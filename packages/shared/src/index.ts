export function isArray(value: unknown) {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}
