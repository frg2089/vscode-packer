import type { EnginePlugin } from './plugins'

/**
 * 引擎设置
 */
export interface EngineOptions {
  /**
   * 生成模式
   *
   * @default 'development'
   */
  mode: 'development' | 'production'
  /**
   * 扩展入口文件
   *
   * 此文件中应导出 `activate` 和 `deactivate` 函数
   *
   * @default 'src/index.ts'
   */
  entry: string
  /**
   * 产物文件夹
   *
   * @default 'dist'
   */
  output: string
  /**
   * 插件
   */
  plugins: EnginePlugin[]
}
export namespace EngineOptions {
  export const withDefault = (
    options: Partial<EngineOptions>,
  ): EngineOptions => {
    const {
      mode = 'development',
      entry = 'src/index.ts',
      output = 'dist',
      plugins = [],
    } = options
    return { mode, entry, output, plugins }
  }
}
