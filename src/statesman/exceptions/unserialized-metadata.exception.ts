import { CustomError } from 'ts-custom-error'

export class UnserializedMetadataException extends CustomError {
  constructor(message: string) {
    super(message || 'UnserializedMetadataException')
  }
}
