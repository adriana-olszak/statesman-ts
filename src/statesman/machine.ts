import { MemoryTransition } from './adapters/memory-transition'
import { Memory } from './adapters/memory'
import { Validator } from './validator'
import { Callback } from './callback'
import { InvalidStateException } from './exceptions/invalid-state.exception'
import { TransitionFailedException } from './exceptions/transition-failed.exception'
import { GuardFailedException } from './exceptions/guard-failed.exception'
import { InvalidTransitionException } from './exceptions/invalid-transition.exception'
import { InvalidArgumentException } from './exceptions/invalid-argument.exception'
import { toArray } from './util'
import { IAddCallback, IMachineState, IMachineTransition, Metadata, Phases } from './types'

export class Machine<TransitionClass extends MemoryTransition = MemoryTransition> {
  // TODO: retry_conflicts

  public states: string[] = []
  public storageAdapter: Memory
  public validator: Validator
  public initialState?: string
  public successors: Record<string, any> = []
  public callbacks: Record<Phases, Callback[]> = {
    before: [],
    after: [],
    after_transition_failure: [],
    after_guard_failure: [],
    after_commit: [],
    guards: []
  }

  constructor(
    private object: Record<string, any>,
    private options: { transitionClass: typeof MemoryTransition } = {
      transitionClass: MemoryTransition
    }
  ) {
    // TODO change to adapterFactory, think about how it would be used in nestJS with DI
    this.storageAdapter = this.adapterClass(options.transitionClass, object)
    this.validator = new Validator()
  }

  adapterClass(transitionClass: typeof MemoryTransition, object: Record<string, any>): Memory {
    // if (transitionClass instanceof MemoryTransition) {
    //   return Memory
    // } else {
    //   TODO: implement adapters selection
    // }
    return new Memory(transitionClass, object, this)
  }

  addState(name: string, initial?: boolean) {
    if (initial) {
      this.validatedInitialState(name)
      this.initialState = name
    }

    if (this.states.includes(name)) {
      throw new InvalidStateException('State already defined')
    }

    this.states.push(name)

    // allow chaining
    return this
  }

  addTransition({ from, to }: IMachineTransition) {
    const tos = toArray(to)

    if (!tos.filter(Boolean).length) {
      throw new InvalidStateException(`'No 'to' states provided.'`)
    }
    if (!from) {
      throw new InvalidStateException(`'No 'from' states provided.'`)
    }
    const transitions = [...toArray(to), from]

    transitions.forEach(state => this.validateState(state))

    const currentFromValue = this.successors[from] || []
    this.successors[from] = currentFromValue.concat(to)

    // allow chaining
    return this
  }

  beforeTransition(from: string, to: string, callbackFn: Function) {
    this.addCallback({
      type: Phases.before,
      from,
      to,
      callbackFn
    })
    return this
  }

  afterTransition(from: string, to: string, callbackFn: Function) {
    this.addCallback({
      type: Phases.after,
      from,
      to,
      callbackFn
    })
    return this
  }

  afterTransitionFailure(from: string, to: string, callbackFn: Function) {
    this.addCallback({
      type: Phases.after_transition_failure,
      from,
      to,
      callbackFn
    })
    return this
  }

  afterGuardFailure(from: string, to: string, callbackFn: Function) {
    this.addCallback({
      type: Phases.after_guard_failure,
      from,
      to,
      callbackFn
    })
    return this
  }

  afterCommit(from: string, to: string, callbackFn: Function) {
    this.addCallback({
      type: Phases.after_commit,
      from,
      to,
      callbackFn
    })
    return this
  }

  guardTransition(from: string, to: string, callbackFn: Function) {
    this.addCallback({
      type: Phases.guards,
      from,
      to,
      callbackFn
    })
    return this
  }

  addCallback({ type, callbackFn, from, to }: IAddCallback) {
    this.validateCallbackTypeAndClass(type, callbackFn)
    this.validateCallbackCondition(from, to)

    this.callbacks[type].push(new Callback({ from, to, callback: callbackFn }))
    return this
  }

  transitionTo(newState: string, metadata?: Metadata) {
    const currentState = this.currentState() as string

    try {
      this.validateTransition({ from: currentState, to: newState, metadata })
      return this.storageAdapter.create({ from: currentState, to: newState, metadata })
    } catch (e) {
      switch (e.constructor) {
        case TransitionFailedException:
          this.executeOnFailure(Phases.after_transition_failure, currentState, newState, e)
        case GuardFailedException:
          this.executeOnFailure(Phases.after_guard_failure, currentState, newState, e)
      }
      throw e
    }
  }

  executeOnFailure(phase: Phases, currentState: string, newState: string, exception: Error) {
    this.callbacksFor(phase, currentState, newState).forEach(callback =>
      callback.call(this, exception)
    )
  }

  execute(phase: Phases, currentState: string, newState: string, transition: IMachineTransition) {
    this.callbacksFor(phase, currentState, newState).forEach(callback =>
      callback.call(this, transition)
    )
  }

  lastTransition(forceReload = false) {
    return this.storageAdapter.last(forceReload)
  }

  lastTransitionTo(state: string) {
    return this.history()
      .reverse()
      .find(transition => transition.to === state)
  }

  history() {
    return this.storageAdapter.history
  }

  reset() {
    return this.storageAdapter.reset()
  }

  currentState(forceReload: boolean = false) {
    const lastAction = this.lastTransition(forceReload)
    return lastAction ? lastAction.to : this.initialState
  }

  successorsFor(from: string): string[] {
    return this.successors[from] || []
  }

  guardsFor(from: string, to: string) {
    return this.selectCallbacksFor(this.callbacks.guards, { from, to })
  }

  callbacksFor(phase: Phases, from: string, to: string) {
    return this.selectCallbacksFor(this.callbacks[phase], { from, to })
  }

  selectCallbacksFor(callbacks: Callback[], { from, to }: { from: string; to: string }) {
    return callbacks.filter(callback => callback.appliesTo(from, to))
  }

  canTransitionTo(newState: string, metadata: Metadata) {
    try {
      this.validateTransition({
        from: this.currentState() as string,
        to: newState,
        metadata
      })

      return true
    } catch (e) {
      return false
    }
  }

  allowedTransitions(metadata: Metadata) {
    return this.successorsFor(this.currentState() as string).filter(state =>
      this.canTransitionTo(state, metadata)
    )
  }

  validateNotFromTerminalState(from: string) {
    if ((this.successors[from] || []).length === 0) {
      throw new InvalidTransitionException(`Cannot transition away from terminal state '${from}'`)
    }
  }

  validateNotToInitialState(to: string) {
    if (
      !Object.values(this.successors)
        .flat()
        .includes(to)
    )
      throw new InvalidTransitionException(`Cannot transition to initial state '${to}'`)
  }

  validateFromAndToState(from: string, to: string) {
    if (!(this.successors[from] || []).includes(to)) {
      throw new InvalidTransitionException(`Cannot transition from '${from}' to '${to}'`)
    }
  }

  validateCallbackTypeAndClass(type: string, callbackClass: any) {
    if (!type) throw new InvalidArgumentException(`missing keyword: callback_type`)
    if (!callbackClass) throw new InvalidArgumentException(`missing keyword: callback_class`)
  }

  validateCallbackCondition(from: string, to: string | string[]) {
    const tos = toArray(to)
    const states = [from, ...tos]
    states.forEach(state => this.validateState(state))

    this.validateNotFromTerminalState(from)

    tos.forEach(to => this.validateNotToInitialState(to))
  }

  // TODO move out validators into separate class, ideally with DI
  validateState(state: string) {
    if (this.states.includes(state)) return

    throw new InvalidStateException(`Invalid state '${state}'`)
  }

  validatedInitialState(state: string) {
    if (!this.initialState) return

    throw new InvalidStateException(
      `Cannot set initial state to '${state}', already defined as '${this.initialState}'`
    )
  }

  validateTransition({ from, to, metadata }: { from: string; to: string; metadata?: Metadata }) {
    const transitionPossible = (this.successors[from] || []).includes(to)
    if (!transitionPossible) {
      throw new TransitionFailedException(from, to)
    }

    const guards = this.guardsFor(from, to)

    guards.forEach(guard => {
      guard.call(this, this.lastTransition(), metadata)
    })
  }
}
