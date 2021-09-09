import { CustomError } from 'ts-custom-error'

export class TransitionConflictException extends CustomError {
  constructor(message: string) {
    super(message || 'TransitionConflictException')
  }
}
