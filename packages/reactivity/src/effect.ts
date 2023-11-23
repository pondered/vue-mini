import { isArray } from '@vue/shared'
import { Dep, createDep } from './dep'

type KeyToDepMap = Map<any, Dep>
const targetMap = new WeakMap<object, KeyToDepMap>()

export function effect<T = any>(fn: () => T) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}

export let activeEffect: ReactiveEffect | undefined

export class ReactiveEffect<T = any> {
  constructor(public fn: () => T) {}

  run() {
    activeEffect = this
    return this.fn()
  }

  stop() {}
}

// 收集依赖
export function track(target: object, key: unknown) {
  console.debug(`track:收集依赖,target:${JSON.stringify(target)}, key:${key}`)
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = createDep()))
  }
  trackEffects(dep)
  console.debug('targetMap', targetMap)
}

// 利用 dep 依次跟踪指定key 的所有 effect
export function trackEffects(dep: Dep) {
  dep.add(activeEffect!)
}

//触发依赖
export function trigger(target: object, key: unknown, newValue: unknown) {
  console.debug(
    `trigger:触发依赖, target:${JSON.stringify(
      target
    )}, key:${key}, value:${newValue}`
  )
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const dep: Dep | undefined = depsMap.get(key)
  if (!dep) return
  triggerEffects(dep)
}

// 依次触发 dep 中保存的依赖
export function triggerEffects(dep: Dep) {
  const effects = isArray(dep) ? dep : [...dep]
  for (const effect of effects) {
    triggerEffect(effect)
  }
}

// 触发指定依赖
export function triggerEffect(effect: ReactiveEffect) {
  effect.run()
}
