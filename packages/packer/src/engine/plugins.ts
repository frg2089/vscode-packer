import { HTMLElement } from 'node-html-parser'
import type { EngineContext } from './engine'

export interface EnginePlugin {
  /** 扩展名称 */
  name: string
  /**
   * HTML 元素预处理器
   * @param context 引擎上下文
   * @param element 解析的元素
   * @param toBaseURL
   * @returns
   */
  onResolve?: (context: {
    engine: EngineContext
    element: HTMLElement
  }) => PromiseLike<boolean | undefined> | boolean | undefined
  /** 处理器 */
  onInvoke?: () => PromiseLike<void> | void
}
