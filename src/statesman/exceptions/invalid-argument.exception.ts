import { CustomError } from 'ts-custom-error'

export class InvalidArgumentException extends CustomError {
  constructor(message: string) {
    super(message || 'InvalidArgumentException')
  }
}
