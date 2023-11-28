import { isArray, isObject, isString } from '.'

export function normalizeClass(value: unknown): string {
  let res = ''
  if (isString(value)) {
    res = value as string
  } else if (isArray(value)) {
    for (let index = 0; index < (value as []).length; index++) {
      const normalized = normalizeClass((value as [])[index])
      if (normalized) {
        res += normalized + ' '
      }
    }
  } else if (isObject(value)) {
    for (const key in value as object) {
      if ((value as object)[key]) {
        res += key + ' '
      }
    }
  }
  return res.trim()
}
