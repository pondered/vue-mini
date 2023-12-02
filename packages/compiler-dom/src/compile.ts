import { extend } from '@vue/shared'
import { generate } from 'packages/compiler-core/src/codegen'
import { baseParse } from 'packages/compiler-core/src/parse'
import { transform } from 'packages/compiler-core/src/transform'
import { transformElement } from 'packages/compiler-core/src/transforms/transformElement'
import { transformText } from 'packages/compiler-core/src/transforms/transformText'
import { transformIf } from 'packages/compiler-core/src/transforms/vif'
import { log } from 'packages/shared/src/log'

export function baseCompile(template: string, options = {}) {
  const ast = baseParse(template)
  log(1, ast)

  transform(
    ast,
    extend(options, {
      nodeTransforms: [transformElement, transformText, transformIf],
    })
  )
  log(2, ast)

  log(ast)
  return generate(ast)
}
