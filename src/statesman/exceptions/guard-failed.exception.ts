import { CustomError } from 'ts-custom-error'

export class GuardFailedException extends CustomError {
  constructor(message: string) {
    super(message || 'GuardFailedException')
  }
}
