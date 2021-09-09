import { CustomError } from 'ts-custom-error'

export class MissingTransitionAssociationException extends CustomError {
  constructor(message: string) {
    super(message || 'MissingTransitionAssociationException')
  }
}
