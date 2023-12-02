import { isArray, isString } from '@vue/shared'
import { NodeTypes } from './ast'
import { TO_DISPLAY_STRING, helperNameMap } from './runtimeHelpers'
import { getVNodeHelper } from './utils'

const aliasHelper = (s: symbol) => `${helperNameMap[s]}: _${helperNameMap[s]}`

function createCodegenContext(ast) {
  const context = {
    code: '',
    runtimeGlobalName: 'Vue',
    source: ast.loc.source,
    indentLevel: 0,
    isSSR: false,
    helper(key) {
      return `_${helperNameMap[key]}`
    },
    push(code) {
      context.code += code
    },
    newLine() {
      newLine(context.indentLevel)
    },
    indent() {
      newLine(++context.indentLevel)
    },
    deindent() {
      newLine(--context.indentLevel)
    },
  }

  function newLine(n: number) {
    context.code += '\n' + `  `.repeat(n)
  }

  return context
}
export function generate(ast) {
  const context = createCodegenContext(ast)
  const { push, newLine, indent, deindent } = context

  genFunctionPreamble(context)

  const functionName = `render`
  const args = ['_ctx', '_cache']
  const signature = args.join(', ')
  push(`function ${functionName}(${signature}){`)
  indent()

  push(`with (_ctx){`)
  indent()

  const hasHelpers = ast.helpers.length > 0
  if (hasHelpers) {
    push(`const {${ast.helpers.map(aliasHelper).join(', ')}} = _Vue`)
    push('\n')
    newLine()
  }
  newLine()
  push(`return `)
  if (ast.codegenNode) {
    genNode(ast.codegenNode, context)
  } else {
    push(` null`)
  }
  deindent()
  push('}')

  deindent()
  push('}')

  return {
    ast,
    code: context.code,
  }
}

function genFunctionPreamble(context) {
  const { push, runtimeGlobalName, newLine } = context
  const VueBinding = runtimeGlobalName
  push(`const _Vue = ${VueBinding}\n`)
  newLine()
  push(`return `)
}

function genNode(node, context) {
  switch (node.type) {
    case NodeTypes.ELEMENT:
    case NodeTypes.IF:
      genNode(node.codegenNode, context)
      break
    case NodeTypes.VNODE_CALL:
      genVNodeCall(node, context)
      break
    case NodeTypes.TEXT:
      genText(node, context)
      break
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context)
      break
    case NodeTypes.ELEMENT:
      genNode(node.codegenNode, context)
      break
    case NodeTypes.JS_CONDITIONAL_EXPRESSION:
      genConditionalExpression(node, context)
      break
    case NodeTypes.JS_CALL_EXPRESSION:
      genCallExpression(node, context)
      break
  }
}

function genCallExpression(node, context) {
  const { push, helper } = context
  const callee = isString(node.callee) ? node.callee : helper(node.callee)

  push(callee + `( `)
  genNodeList(node.arguments, context)
  push(` )`)
}
function genConditionalExpression(node, context) {
  const { test, consequent, alternate, newline: needNewLine } = node
  const { push, indent, deindent, newline } = context

  if (test.type === NodeTypes.SIMPLE_EXPRESSION) {
    genExpression(test, context)
  }

  needNewLine && indent()

  context.indentLevel++
  needNewLine || push(` `)
  push(`?`)
  genNode(consequent, context)
  context.indentLevel--

  needNewLine && newline()
  needNewLine || push(` `)
  push(`: `)

  const isNested = alternate.type === NodeTypes.JS_CONDITIONAL_EXPRESSION
  if (!isNested) {
    context.indentLevel++
  }

  genNode(alternate, context)

  if (!isNested) {
    context.indentLevel--
  }
  needNewLine && deindent()
}

function genText(node, context) {
  context.push(JSON.stringify(node.content), node)
}
function genExpression(node, context) {
  const { content, isStatic } = node
  context.push(isStatic ? JSON.stringify(content) : content)
}

function genCompoundExpression(node, context) {
  for (let index = 0; index < node.children.length; index++) {
    const child = node.children[index]
    if (isString(child)) {
      context.push(child)
    } else {
      genNode(child, context)
    }
  }
}

function genInterpolation(node, context) {
  const { push, helper } = context
  push(`${helper(TO_DISPLAY_STRING)}(`)
  genNode(node.content, context)
  push(')')
}

function genVNodeCall(node, context) {
  const { push, helper } = context
  const { tag, props, children, patchFlag, dynamicProps, isComponent } = node

  const callHelper = getVNodeHelper(context.isSSR, isComponent)
  push(helper(callHelper), +`(`)

  const args = genNullableArgs([tag, props, children, patchFlag, dynamicProps])

  push('(')
  genNodeList(args, context)

  push(')')
}

function genNullableArgs(args: any[]) {
  let i = args.length
  while (i--) {
    if (args[i] !== null && args[i] !== undefined) break
  }

  return args.slice(0, i + 1).map(arg => arg || `null`)
}

function genNodeList(nodes, context) {
  const { push } = context
  for (let index = 0; index < nodes.length; index++) {
    const element = nodes[index]
    if (isString(element)) {
      push(element)
    } else if (isArray(element)) {
      genNodeListAsArray(element, context)
    } else {
      genNode(element, context)
    }

    if (index < nodes.length - 1) {
      push(`, `)
    }
  }
}

function genNodeListAsArray(nodes, context) {
  context.push('[')
  genNodeList(nodes, context)
  context.push(']')
}
