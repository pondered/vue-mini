import { ReactiveEffect } from './effect'

export type Dep = Set<ReactiveEffect>

export const createDep = (effects?: ReactiveEffect[]) => {
  const deps = new Set<ReactiveEffect>(effects) as Dep

  return deps
}
