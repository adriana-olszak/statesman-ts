import { MemoryTransition } from './memory-transition'
import { Phases } from '../types'
import { Machine } from '../machine'

interface IMemoryCreate {
  from: string
  to: string
  metadata?: Record<string, any>
}

export class Memory {
  public history: Array<MemoryTransition> = []

  constructor(
    public transitionClass: typeof MemoryTransition,
    public parent_model: any,
    private observer: Machine,
    private _opt: Record<string, any> = {}
  ) {}

  create({ from: fromRaw, to: toRaw, metadata }: IMemoryCreate) {
    const from = fromRaw.toString()
    const to = toRaw.toString()
    const transition = new this.transitionClass(from, to, this.nextSortKey(), metadata)

    this.observer.execute(Phases.before, from, to, transition)
    this.history.push(transition)
    this.observer.execute(Phases.after, from, to, transition)
    this.observer.execute(Phases.after_commit, from, to, transition)
    return transition
  }

  last(forceReload?: boolean) {
    if (forceReload) {
      this.reset()
    }
    return this.history
      .sort(({ sortKey: sortKeyA }, { sortKey: sortKeyB }) => sortKeyB - sortKeyA)
      .pop()
  }

  reset() {
    this.history = []
  }

  private nextSortKey() {
    if (!this.last()?.sortKey) return 10
    return this.last()?.sortKey || 10
  }
}
