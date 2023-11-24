export function isArray(value: unknown) {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

export const isObject = (val: unknown) =>
  val !== null && typeof val === 'object'

/**
 * 对比两个数据是否发生改变
 */
export const hasChanged = (val: any, oldVal: any): boolean =>
  !Object.is(val, oldVal)
