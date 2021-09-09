import { CustomError } from 'ts-custom-error'

export class InvalidStateException extends CustomError {
  constructor(message: string) {
    super(message || 'Invalid state error')
  }
}
