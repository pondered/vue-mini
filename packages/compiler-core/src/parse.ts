import { log } from 'packages/shared/src/log'
import { ElementTypes, NodeTypes } from './ast'

const enum TagType {
  Start,
  End,
}
export interface ParserContext {
  source: string
}

export interface ElementNode {
  tag: string
}

function createParserContext(content: string): ParserContext {
  return {
    source: content,
  }
}

export function createRoot(children) {
  return {
    type: NodeTypes.ROOT,
    children,
    loc: {},
  }
}
export function baseParse(content: string) {
  const context = createParserContext(content)
  const children = parseChildren(context, [])

  return createRoot(children)
}

function parseInterpolation(context: ParserContext) {
  const [open, close] = ['{{', '}}']
  advanceBy(context, open.length)
  const closeIndex = context.source.indexOf(close, open.length)
  const preTrimContent = parseTextData(context, closeIndex)
  const content = preTrimContent.trim()
  advanceBy(context, close.length)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      isStatic: false,
      content,
    },
  }
}

function parseChildren(context: ParserContext, ancestors) {
  const nodes = []
  while (!isEnd(context, ancestors)) {
    const source = context.source

    let node
    if (startsWith(source, '{{')) {
      node = parseInterpolation(context)
    } else if (source[0] === '<') {
      if (/[a-z]/i.test(source[1])) {
        node = parseElement(context, ancestors)
      }
    }
    if (!node) {
      node = parseText(context)
    }

    pushNode(nodes, node)
  }
  return nodes
}

function pushNode(nodes, node) {
  nodes.push(node)
}

function parseElement(context: ParserContext, ancestors) {
  const element = parseTag(context, TagType.Start)
  ancestors.push(element)
  const children = parseChildren(context, ancestors)
  ancestors.pop()

  element.children = children

  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End)
  }
  return element
}

function parseTag(context: ParserContext, type: TagType) {
  const match: any = /^<\/?([a-z][^\r\n\t\f />]*)/i.exec(context.source)
  const tag = match[1]

  advanceBy(context, match[0].length)

  advanceSpaces(context)
  let props = parseAttributes(context, type)
  // log(props)

  let isSelfClosing = startsWith(context.source, '/>')
  advanceBy(context, isSelfClosing ? 2 : 1)

  return {
    type: NodeTypes.ELEMENT,
    tag,
    tagType: ElementTypes.ELEMENT,
    props,
    children: [],
  }
}

function advanceSpaces(context: ParserContext): void {
  const match = /^[/t/r/n/f ]+/.exec(context.source)
  if (match) {
    advanceBy(context, match[0].length)
  }
}

function parseAttributes(context, type) {
  const props: any = []
  const attributeNames = new Set<string>()

  while (
    context.source.length > 0 &&
    !startsWith(context.source, '>') &&
    !startsWith(context.source, '/>')
  ) {
    const attr = parseAttribute(context, attributeNames)
    log('type:', type === TagType.Start)
    if (type === TagType.Start) {
      props.push(attr)
    }
    advanceSpaces(context)
  }

  return props
}

function parseAttribute(context: ParserContext, nameSet: Set<string>) {
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)!
  const name = match[0]
  nameSet.add(name)
  advanceBy(context, name.length)

  let value: any = undefined
  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    advanceSpaces(context)
    advanceBy(context, 1)
    advanceSpaces(context)
    value = parseAttributeValue(context)
  }

  // v-
  if (/^(v-[A-Za-z0-9-]|:|\.|@|#)/.test(name)) {
    const match =
      /(?:^v-([a-zA-Z0-9-]+))?(?:(?::|^\.|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(
        name
      )!
    let dirName = match[1]
    return {
      type: NodeTypes.DIRECTIVE,
      name: dirName,
      exp: value && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: value.content,
        isStatic: false,
        loc: {},
      },
      arg: undefined,
      modifiers: undefined,
      loc: {},
    }

    return {
      type: NodeTypes.ATTRIBUTE,
      name,
      value: value && {
        type: NodeTypes.TEXT,
        content: value.content,
        loc: {},
      },
      loc: {},
    }
  }
}

function parseAttributeValue(context: ParserContext) {
  let content = ''

  const quote = context.source[0]
  advanceBy(context, 1)

  const endIndex = context.source.indexOf(quote)
  if (endIndex === -1) {
    content = parseTextData(context, context.source.length)
  } else {
    content = parseTextData(context, endIndex)
    advanceBy(context, 1)
  }

  return {
    content,
    isQuoted: true,
    loc: {},
  }
}

function parseText(context: ParserContext) {
  const endTokens = ['<', '{{']
  let endIndex = context.source.length

  for (let index = 0; index < endTokens.length; index++) {
    const i = context.source.indexOf(endTokens[index], 1)
    if (i !== -1 && endIndex > index) {
      endIndex = i
    }
  }
  const content = parseTextData(context, endIndex)
  return {
    type: NodeTypes.TEXT,
    content,
  }
}

function parseTextData(context: ParserContext, length: number) {
  const rawText = context.source.slice(0, length)
  advanceBy(context, length)
  return rawText
}

function isEnd(context: ParserContext, ancestors) {
  const source = context.source
  if (startsWith(source, '</')) {
    for (let index = ancestors.length - 1; index >= 0; index--) {
      if (startsWithEndTagOpen(source, ancestors[index].tag)) {
        return true
      }
    }
  }

  return !source
}

function startsWithEndTagOpen(source: string, tag: string): boolean {
  return startsWith(source, '</')
}

function startsWith(source: string, searchString: string) {
  return source.startsWith(searchString)
}

function advanceBy(context: ParserContext, numberOfCharacters: number) {
  const { source } = context
  context.source = source.slice(numberOfCharacters)
}
