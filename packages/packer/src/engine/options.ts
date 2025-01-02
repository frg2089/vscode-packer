import * as fs from 'fs'
import * as path from 'node:path'
import type { EnginePlugin } from '.'

/**
 * 引擎设置
 */
export interface EngineOptions {
  /**
   * 扩展入口文件
   *
   * 此文件中应导出 `activate` 和 `deactivate` 函数
   *
   * @default 'src/index.ts'
   */
  entry: string
  /**
   * 源代码文件夹
   *
   * @default 'src'
   */
  src: string
  /**
   * 产物文件夹
   *
   * @default 'dist'
   */
  dist: string
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
      entry = 'src/index.ts',
      src = 'src',
      dist: output = 'dist',
      plugins = [],
    } = options
    return { entry, src, dist: output, plugins }
  }

  const loadConfigFromJS = () => {
    const configPath = path.resolve('vscp.config.js')
    if (!fs.existsSync(configPath)) return

    // 读取配置文件内容
    const configFileContent = fs.readFileSync(configPath, 'utf-8')

    // 执行编译后的代码
    return eval(configFileContent)
  }

  const loadConfigFromTS = async () => {
    const configPath = path.resolve('vscp.config.ts')
    if (!fs.existsSync(configPath)) return

    // 尝试动态导入 typescript
    let ts: typeof import('typescript')
    try {
      ts = await import('typescript')
    } catch (error) {
      console.error(
        'TypeScript is not installed. Please install it to use this feature.',
      )
      process.exit(1)
    }
    // 读取配置文件内容
    const configFileContent = fs.readFileSync(configPath, 'utf-8')

    // 使用 TypeScript 编译器将 TypeScript 代码编译为 JavaScript
    const result = ts.transpileModule(configFileContent, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
      },
    })

    // 执行编译后的代码
    return eval(result.outputText)
  }

  export const loadFromConfig = async () => {
    const config = await loadConfigFromTS()
    if (config) return config
    return loadConfigFromJS()
  }
}
