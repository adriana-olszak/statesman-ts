export class IncompatibleSerializationException extends Error {
  constructor(message: string) {
    super(message || 'IncompatibleSerializationException')
  }
}
