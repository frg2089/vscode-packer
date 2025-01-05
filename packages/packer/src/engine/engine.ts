import * as tsup from 'tsup'
import * as vite from 'vite'
import type { EngineContext, EngineOptions } from '.'
import { packageJsonCleaner } from '.'
import { esbuildHtmlProcess, viteHtmlProcess } from './esbuild/html'

/**
 * 编译引擎
 */
export class Engine {
  /**
   * 引擎上下文
   */
  readonly context: EngineContext

  /**
   * 构建编译引擎
   * @param options
   */
  constructor(options: EngineOptions) {
    const cwd = process.cwd()
    this.context = {
      cwd,
      ...options,
    }
  }

  /**
   * 启动编译流程
   */
  async build() {
    this.context.isBuild = true
    this.context.isDev = false
    const extension: tsup.Options = {
      entry: [this.context.entry],
      outDir: this.context.dist,
      minify: true,
      external: ['vscode', 'node:*'],
      platform: 'node',
      format: 'cjs',
      clean: true,
      sourcemap: true,

      esbuildPlugins: [esbuildHtmlProcess(this.context)],
    }
    // 通过tsup编译扩展
    await tsup.build(extension)
    // 调用插件进行html处理
    await Promise.all(this.context.plugins.map(i => i.onInvoke?.(this.context)))
    await packageJsonCleaner()
  }

  async dev() {
    this.context.isBuild = false
    this.context.isDev = true
    // 此模式应存在以下行为
    // 监听 extension 代码修改
    // 激活开发服务器使 webview 相关代码可以热重载

    const server = await vite.createServer({
      configFile: false,
      root: this.context.cwd,
      plugins: [viteHtmlProcess()],
    })
    await server.listen()
    this.context.devUrlBase = server.resolvedUrls?.local[0]

    const extension: tsup.Options = {
      entry: [this.context.entry],
      outDir: this.context.dist,
      minify: false,
      external: ['vscode', 'node:*'],
      platform: 'node',
      format: 'cjs',
      clean: false,
      sourcemap: true,
      watch: true,
      esbuildPlugins: [esbuildHtmlProcess(this.context)],
      onSuccess: async () => {
        server.printUrls()
      },
    }
    // 通过tsup编译扩展
    await tsup.build(extension)

    server.bindCLIShortcuts({ print: true })
  }
}
