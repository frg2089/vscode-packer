import type { EngineContext } from '.'
import type { HTMLElement } from 'node-html-parser'

// export const toBaseURL = (
//   engine: EngineContext,
//   absolutePath: string,
// ): string => {
//   // 将路径处理为以 {{base}}/ 开头的 URL
//   return absolutePath
//     .replace(engine.webviewRelativeOutputDir, '{{base}}')
//     .replaceAll('\\', '/')
// }

export const isScriptElement = (element: HTMLElement): boolean =>
  element.rawTagName.toLowerCase() === 'script'

export const isStyleLinkElement = (element: HTMLElement): boolean =>
  element.rawTagName.toLowerCase() === 'link' &&
  element.getAttribute('rel')?.toLowerCase() === 'stylesheet'

