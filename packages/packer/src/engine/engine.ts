import * as htmlParser from 'node-html-parser'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as tsup from 'tsup'
import type { EngineOptions } from './options'
import { esbuildHtmlProcess } from './plugins/html'

/**
 * 引擎上下文
 */
export interface EngineContext extends Readonly<EngineOptions> {
  /** 引擎工作目录 */
  readonly cwd: string
  /** 相对于 `output` 文件夹的 webview 产物文件夹路径 以 '/' 分隔 */
  readonly webviewRelativeOutputDir: string
}

/**
 * 编译引擎
 */
export class Engine {
  readonly context: EngineContext

  constructor(options: EngineOptions) {
    const cwd = process.cwd()
    this.context = {
      cwd,
      // TODO: 从配置项中读取
      webviewRelativeOutputDir: 'webview',
      ...options,
    }
  }

  async build() {
    if (this.context.mode === 'development') {
      // 此模式应存在以下行为
      // 监听 extension 代码修改
      // 激活开发服务器使 webview 相关代码可以热重载
    } else if (this.context.mode === 'production') {
      const extension: tsup.Options = {
        esbuildPlugins: [esbuildHtmlProcess(this.context, this.htmlProcess)],
      }
      await tsup.build(extension)
    }
  }

  private async htmlProcess(absolutePath: string): Promise<string> {
    /** HTML 文件所在的文件夹 */
    const baseDir = path.dirname(absolutePath)

    /** HTML 文档 */
    const document = htmlParser.parse(
      await fs.promises.readFile(absolutePath, 'utf-8'),
    )

    /** 待处理的元素 */
    const elements = ['link[rel="stylesheet"]', 'script[src]'].flatMap(
      document.querySelectorAll,
    )

    elements.forEach(element => {
      this.context.plugins.find(plugin =>
        plugin.onResolve?.(this.context, element, this.toBaseURL),
      )
    })

    return document.toString()
  }
  private toBaseURL(absolutePath: string): string {
    // 将路径处理为以 {{base}}/ 开头的 URL
    return absolutePath
      .replace(this.context.webviewRelativeOutputDir, '{{base}}')
      .replaceAll('\\', '/')
  }
}
