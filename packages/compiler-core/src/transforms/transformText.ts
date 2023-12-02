import { NodeTypes } from '../ast'
import { isText } from '../utils'

export const transformText = (node, context) => {
  if (
    node.type === NodeTypes.ROOT ||
    node.type === NodeTypes.ELEMENT ||
    node.type === NodeTypes.FOR ||
    node.type === NodeTypes.IF_BRANCH
  ) {
    return () => {
      const children = node.children
      let currentContainer

      for (let index = 0; index < children.length; index++) {
        const child = children[index]
        if (isText(child)) {
          for (let j = index + 1; j < children.length; j++) {
            const next = children[j]

            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[index] = createCompoundExpression(
                  [child],
                  child.loc
                )
              }
              currentContainer.children.push(` + `, next)
              children.splice(j, 1)
              j--
            } else {
              currentContainer = undefined
              break
            }
          }
        }
      }
    }
  }
}

export function createCompoundExpression(children, loc) {
  return {
    type: NodeTypes.COMPOUND_EXPRESSION,
    loc,
    children,
  }
}
