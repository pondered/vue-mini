import { LifecycleHook } from './component'

export function injectHook(type: LifecycleHook, hook: Function, target) {
  if (target) {
    target[type] = hook
    return hook
  }
}

export const createHook = (lifecycleHook: LifecycleHook) => {
  return (hook, target) => injectHook(lifecycleHook, hook, target)
}

export const onBeforeMount = createHook(LifecycleHook.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHook.MOUNTED)
