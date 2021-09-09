import { CustomError } from 'ts-custom-error'

export class TransitionFailedException extends CustomError {
  constructor(from: string, to: string) {
    super(`TransitionFailedException from: ${from} to:${to}`)
  }
}
