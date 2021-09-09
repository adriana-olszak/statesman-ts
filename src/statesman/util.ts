import { InvalidArgumentException } from './exceptions/invalid-argument.exception'

export const toArray = (input?: string | string[]): string[] => {
  if (!input) throw new InvalidArgumentException('toArray input should be defined')
  if (Array.isArray(input)) return input
  return [input]
}
