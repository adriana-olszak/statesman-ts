export type Metadata = Record<string, unknown>

export interface IMachineState {
  name: string
  initial?: boolean
}

export interface IMachineTransition {
  from?: string
  to?: string | string[]
}

export interface IAddCallback {
  type: Phases
  callbackFn: Function
  // callbackClass: Callback TODO: implement
  from: string
  to: string | string[]
}

export enum Phases {
  guards = 'guards',
  after_commit = 'after_commit',
  after_guard_failure = 'after_guard_failure',
  after_transition_failure = 'after_transition_failure',
  after = 'after',
  before = 'before'
}

export interface IMemoryTransition extends IMachineTransition {
  createdAt: number
  updatedAt: number
  sortKey: number
  metadata?: Record<string, any>
}
