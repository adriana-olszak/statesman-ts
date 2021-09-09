import { Machine } from './machine'
import { InvalidStateException } from './exceptions/invalid-state.exception'
import { InvalidTransitionException } from './exceptions/invalid-transition.exception'

describe(Machine.name, () => {
  let machine: Machine
  beforeEach(() => {
    machine = new Machine({})
  })

  describe('addState', () => {
    it('should add state', () => {
      machine.addState('x').addState('y')

      expect(machine.states).toMatchObject(['x', 'y'])
    })

    it('should throw if state is already defined', () => {
      expect(() => machine.addState('x').addState('x')).toThrow()
    })

    describe('initial', () => {
      it('should add return state as initial', () => {
        machine.addState('x').addState('y', true)

        expect(machine.initialState).toBe('y')
      })
      it('should throw error when initial state already defined', () => {
        expect(() => machine.addState('x', true).addState('y', true)).toThrow(
          `Cannot set initial state to 'y', already defined as 'x'`
        )
        // TODO fix it
        // expect(() => machine.addState(stateX).addState(stateY)).toThrow(InvalidStateException)
      })
    })
  })

  describe('addTransition', () => {
    beforeEach(() => {
      machine
        .addState('x')
        .addState('y')
        .addState('z')
    })

    it("'valid 'from' and valid 'to' states", () => {
      machine.addTransition({ from: 'z', to: 'y' })
      machine.addTransition({ from: 'z', to: 'x' })

      expect(machine.successors).toMatchObject({ z: ['y', 'x'] })
    })

    it.each([
      {
        name: "given neither a 'from' nor a 'to' state",
        from: undefined,
        to: undefined,
        expected: ''
      },
      {
        name: "given no 'from' state and a valid 'to' state",
        from: undefined,
        to: 'y',
        expected: ''
      },
      {
        name: "given a valid 'from' state and a no 'to' state",
        from: 'x',
        to: undefined,
        expected: ''
      },
      {
        name: "given a valid 'from' state and an empty 'to' state array",
        from: 'x',
        to: [],
        expected: ''
      },
      {
        name: "given an invalid 'from' state",
        from: 'non-existing',
        to: 'z',
        expected: ''
      },
      {
        name: "given an invalid 'to' state",
        from: 'z',
        to: 'non-existing',
        expected: ''
      }
    ])('$name should throw an error', ({ from, to, expected }) => {
      expect(() => {
        machine.addTransition({ from, to })
      }).toThrow()
    })
  })

  describe('validateCallbackConditions', () => {
    beforeEach(() => {
      machine
        .addState('x')
        .addState('y')
        .addState('z')
        .addTransition({ from: 'x', to: 'y' })
        .addTransition({ from: 'y', to: 'z' })
    })

    it("given a terminal 'from' state should throw", () => {
      expect(() => machine.validateCallbackCondition('z', 'y')).toThrowError(
        InvalidTransitionException
      )
    })

    it("given an initial 'to' state should throw", () => {
      expect(() => machine.validateCallbackCondition('y', 'x')).toThrowError(
        InvalidTransitionException
      )
    })

    it('with an invalid transition should throw', () => {
      expect(() => machine.validateCallbackCondition('x', 'z')).toThrowError(
        InvalidTransitionException
      )
    })

    it('with a valid transition should not throw', () => {
      expect(() => machine.validateCallbackCondition('x', 'y')).not.toThrowError()
    })
  })
})
