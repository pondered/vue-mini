export function patchAttr(el: Element, key, value) {
  if (value === null || value === undefined) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, value)
  }
}
