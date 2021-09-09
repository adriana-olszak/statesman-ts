import { IMemoryTransition } from '../types'

export class MemoryTransition implements IMemoryTransition {
  public createdAt: number
  public updatedAt: number

  constructor(
    public from: string,
    public to: string,
    public sortKey: number,
    public metadata?: Record<string, any>
  ) {
    this.createdAt = Date.now()
    this.updatedAt = Date.now()
  }
}
