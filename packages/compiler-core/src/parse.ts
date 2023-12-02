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

function parseChildren(context: ParserContext, ancestors) {
  const nodes = []
  while (!isEnd(context, ancestors)) {
    const source = context.source

    let node
    if (startsWith(source, '{{')) {
      // Template
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

  let isSelfClosing = startsWith(context.source, '/>')
  advanceBy(context, isSelfClosing ? 2 : 1)

  return {
    type: NodeTypes.ELEMENT,
    tag,
    tagType: ElementTypes.ELEMENT,
    props: [],
    children: [],
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
