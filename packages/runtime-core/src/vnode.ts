import { isArray, isFunction, isObject, isString } from '@vue/shared'
import { log } from 'packages/shared/src/log'
import { normalizeClass } from 'packages/shared/src/normalizeProps'
import { ShapeFlags } from 'packages/shared/src/shapeFlags'

export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')
export const Comment = Symbol('Comment')

export interface VNode {
  __v_isVNode: true
  type: any
  props: any
  children: any
  shapeFlag: number
  key: any
}

export function isVNode(value: any): value is VNode {
  return value ? value.__v_isVNode === true : false
}

export function createVNode(type, props, children): VNode {
  if (props) {
    let { class: clazz, style } = props
    log(style)
    if (clazz && !isString(clazz)) {
      props.class = normalizeClass(clazz)
    }
  }

  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0

  return createBaseVNode(type, props, children, shapeFlag)
}

export { createVNode as createElementVNode }

function createBaseVNode(type, props, children, shapeFlag) {
  const vnode = {
    __v_isVNode: true,
    type,
    props,
    shapeFlag,
  } as VNode
  normalizeChildren(vnode, children)
  return vnode
}

function normalizeChildren(vnode: VNode, children: unknown) {
  let type = 0
  const { shapeFlag } = vnode
  log(shapeFlag)

  if (children === null || children === undefined) {
    children = null
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN
  } else if (typeof children === 'object') {
  } else if (isFunction(children)) {
  } else {
    // string
    children = String(children)
    type = ShapeFlags.TEXT_CHILDREN
  }

  vnode.children = children
  vnode.shapeFlag |= type
}

export function isSameVNodeType(n1: VNode, n2: VNode) {
  return n1.type === n2.type && n1.key === n2.key
}
