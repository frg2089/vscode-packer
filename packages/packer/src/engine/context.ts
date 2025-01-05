import type { EngineOptions } from '.'

/**
 * 引擎上下文
 */
export interface EngineContext extends Readonly<EngineOptions> {
  /** 引擎工作目录 */
  readonly cwd: string
  /** 是生产环境 */
  isBuild?: boolean
  /** 是开发环境 */
  isDev?: boolean
  /** 开发服务器URL */
  devUrlBase?: string
}
