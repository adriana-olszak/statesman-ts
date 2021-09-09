import { CustomError } from 'ts-custom-error'

export class InvalidTransitionException extends CustomError {
  constructor(message: string) {
    super(message || 'InvalidTransitionException')
  }
}
