import { isScriptElement, isStyleLinkElement } from '.'
import type { HTMLElement } from 'node-html-parser'
import path from 'node:path'

export type ElementType = 'script' | 'style'
export class ElementParser {
  type: ElementType
  url: string
  baseDir: string
  get absolutePath() {
    return path.resolve(this.baseDir, this.url)
  }
  get extname() {
    return path.extname(this.url)
  }

  private constructor(baseDir: string, type: ElementType, url: string) {
    this.baseDir = baseDir
    this.type = type
    this.url = url
  }

  static create(
    baseDir: string,
    element: HTMLElement,
  ): ElementParser | undefined {
    let url: string | undefined
    let type: ElementType | undefined
    if (isScriptElement(element)) {
      type = 'script'
      url = element.getAttribute('src')
    } else if (isStyleLinkElement(element)) {
      type = 'style'
      url = element.getAttribute('href')
    }
    if (!type || !url) return
    return new ElementParser(baseDir, type, url)
  }
}
