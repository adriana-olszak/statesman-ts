interface CallbackProps {
  from?: string
  to?: string | string[]
  callback: Function
}

export class Callback {
  from?: string
  to?: string | string[]
  callback: Function

  constructor({ from, to, callback }: CallbackProps) {
    this.from = from
    this.to = to
    this.callback = callback
  }

  call(...args: any) {
    this.callback(...args)
  }

  appliesTo(from: string, to: string) {
    return this.matches(from, to)
  }

  private matches(from: string, to: string) {
    return (
      this.matchesAll(from, to) ||
      this.matchesTo(from, to) ||
      this.matchesFrom(from, to) ||
      this.matchesBoth(from, to)
    )
  }

  private matchesAll(from: string, to: string) {
    return !(this.to && this.from)
  }

  private matchesTo(from: string, to: string) {
    //TODO handle array values
    return this.to === to
  }

  private matchesFrom(from: string, to: string) {
    return this.from === from
  }

  private matchesBoth(from: string, to: string) {
    return this.from === from && this.to === to
  }
}
