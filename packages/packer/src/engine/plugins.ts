import { HTMLElement } from 'node-html-parser'
import type { EngineContext } from '.'

/**
 * 插件上下文
 */
export interface PluginContext {
  /** HTML 所在目录 */
  baseDir: string
  /** 引擎上下文 */
  engine: EngineContext
  /** style 或 script 元素 */
  element: HTMLElement
}

export interface EnginePlugin {
  /** 扩展名称 */
  name: string
  /**
   * HTML 元素预处理器
   * @param context 插件上下文
   * @returns
   */
  onResolve?: (
    context: PluginContext,
  ) => PromiseLike<boolean | undefined> | boolean | undefined
  /**
   * 处理器
   * @param engine 引擎上下文
   * @returns
   */
  onInvoke?: (engine: EngineContext) => PromiseLike<void> | void
}
