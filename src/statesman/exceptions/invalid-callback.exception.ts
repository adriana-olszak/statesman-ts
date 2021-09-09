import { CustomError } from 'ts-custom-error'

export class InvalidCallbackException extends CustomError {
  constructor(message: string) {
    super(message || 'InvalidCallbackException')
  }
}
