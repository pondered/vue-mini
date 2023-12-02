import { extend } from '@vue/shared'
import { generate } from 'packages/compiler-core/src/codegen'
import { baseParse } from 'packages/compiler-core/src/parse'
import { transform } from 'packages/compiler-core/src/transform'
import { transformElement } from 'packages/compiler-core/src/transforms/transformElement'
import { transformText } from 'packages/compiler-core/src/transforms/transformText'
import { log } from 'packages/shared/src/log'

export function baseCompile(template: string, options = {}) {
  const ast = baseParse(template)

  transform(
    ast,
    extend(options, {
      nodeTransforms: [transformElement, transformText],
    })
  )

  log(ast)
  return generate(ast)
}