type KeyToDepMap = Map<any, ReactiveEffect>
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
  depsMap.set(key, activeEffect)
  console.debug('targetMap', targetMap)
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
  const effect = depsMap.get(key) as ReactiveEffect
  if (!effect) return
  effect.fn()
}
