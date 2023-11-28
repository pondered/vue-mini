import { isArray, isString } from '@vue/shared'

class Style {}
export function patchStyle(el: Element, prevStyle: Style, nextStyle: Style) {
  const style = (el as HTMLElement).style
  const isCssString = isString(nextStyle)
  if (nextStyle && !isCssString) {
    for (const key in nextStyle) {
      setStyle(style, key, nextStyle[key])
    }
    if (prevStyle && !isString(prevStyle)) {
      for (const key in prevStyle) {
        if (nextStyle[key] === null || nextStyle[key] === undefined) {
          setStyle(style, key, '')
        }
      }
    }
  } else {
  }
}

function setStyle(
  style: CSSStyleDeclaration,
  name: string,
  value: string | string[]
) {
  if (isArray(value)) {
    ;(value as string[]).forEach(val => setStyle(style, name, val))
  } else {
    style[name] = value
  }
}
