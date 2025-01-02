import * as htmlParser from 'node-html-parser'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as tsup from 'tsup'

type ESBuildPlugin = Exclude<tsup.Options['esbuildPlugins'], undefined>[0]

/**
 * Webview 文件处理器
 */
class Processor {
  /** 项目源代码文件夹 */
  readonly baseDir: string
  /** Webview 代码文件夹名称 */
  readonly webviewDirName: string
  /**
   *  Webview 代码文件夹
   * @default path.resolve(this.baseDir, this.webviewDirName)
   */
  readonly srcDir: string
  /** Webview 产物文件夹 */
  readonly distDir: string
  
  readonly selectors: string[] = ['link[rel="stylesheet"]', 'script[src]']
  /** 文件处理器 */
  readonly plugins: Processor.ProcessorPlugin[] = []

  private fileList: string[] = []
  private waitList: Record<
    string,
    Parameters<Processor.ProcessorPlugin['process']>['1']
  > = {}

  constructor(config: Processor.ProcessConfig) {
    this.baseDir = config.srcDir
    this.webviewDirName = config.webviewDir
    this.srcDir = path.resolve(config.srcDir, config.webviewDir)
    this.distDir = path.resolve(config.distDir, config.webviewDir)
  }

  /**
   * 安装文件处理器
   * @param processor 处理器安装程序
   * @returns
   */
  use(plugins: Processor.ArrayOr<Processor.ProcessorPlugin>) {
    if (!Array.isArray(plugins)) plugins = [plugins]

    this.plugins.push(...plugins)
  }

  /**
   * 处理 HTML 文件
   * @param absolutePath HTML 文件的绝对路径
   * @returns 经过处理的 HTML 字符串
   */
  async html(absolutePath: string): Promise<string> {
    /** HTML 文件所在的文件夹 */
    const baseDir = path.dirname(absolutePath)

    /** HTML 文档 */
    const document = htmlParser.parse(
      await fs.promises.readFile(absolutePath, 'utf-8'),
    )
    const elements = this.selectors.flatMap(i => document.querySelectorAll(i))

    await Promise.all(
      elements.map(async element => {
        const type = element.getAttribute('type')

        // 获取URL
        let url: string | undefined
        let updatePath: Processor.URLUpdater | undefined
        if (
          element.rawTagName === 'link' &&
          element.getAttribute('rel') === 'stylesheet'
        ) {
          url = element.getAttribute('href')
          updatePath = newURL => element.setAttribute('href', newURL)
        } else if (element.rawTagName === 'script') {
          url = element.getAttribute('src')
          updatePath = newURL => element.setAttribute('src', newURL)
        }
        if (!url || !updatePath) return
        const absolutePath = path.resolve(baseDir, url)

        // 跳过已在待处理列表中的文件
        if (this.fileList.includes(absolutePath)) return
        this.fileList.push(absolutePath)

        const result = await this.preProcess(absolutePath, type)

        const newURL = this.toBaseURL(result.targetPath)

        updatePath(newURL)
      }),
    )

    return document.toString()
  }

  toBaseURL(absolutePath: string): Processor.BaseURL {
    // 将路径处理为以 {{base}}/ 开头的 URL
    return absolutePath
      .replace(this.distDir, '{{base}}')
      .replaceAll('\\', '/') as Processor.BaseURL
  }

  /**
   * 路径预处理
   * @param sourceAbsolutePath 源文件的绝对路径
   * @param type link 或 script 的 type
   * @returns 以 {{base}}/ 开头的 URL
   */
  async preProcess(
    sourceAbsolutePath: string,
    type?: string,
  ): Promise<Processor.PreProcessResult> {
    // 获取文件扩展名
    const ext = path.extname(sourceAbsolutePath) as Processor.ExtensionName

    const plugin = this.plugins.find(plugin => plugin.supports.includes(ext))
    if (!plugin) throw new Error(`此文件不受支持 "${sourceAbsolutePath}"`)

    const result = await plugin.preProcess(this, sourceAbsolutePath, ext, type)

    this.waitList[result.pluginName] ??= {}

    this.waitList[result.pluginName][sourceAbsolutePath] = {
      targetPath: result.targetPath,
      ext: result.ext,
      type: result.type,
    }
    return result
  }

  /**
   * 处理文件
   */
  async process(): Promise<void> {
    const list = Object.entries(this.waitList)
    for (let i = 0; i < list.length; i++) {
      const [pluginName, files] = list[i]

      const plugin = this.plugins.find(plugin => plugin.name === pluginName)
      if (!plugin) throw new Error(`找不到插件 "${pluginName}"`)

      await plugin.process(this, files)
    }
  }

  readonly esbuild: ESBuildPlugin = {
    name: 'vscode-packer/html-process',
    setup: build => {
      const filter = /\.html$/
      const namespace = 'vsc-html'

      // 解析所有被导入的 HTML 文件
      build.onResolve({ filter }, args => ({
        path: path.resolve(args.resolveDir, args.path),
        namespace,
      }))

      // 为 VSCode Extension 处理 HTML
      build.onLoad({ filter, namespace }, async args => {
        const content = await this.html(args.path)

        return {
          loader: 'ts',
          contents: /* ts */ `
import * as vscode from 'vscode'
import * as path from 'node:path'
export default (webview: vscode.Webview, context: vscode.ExtensionContext) => {
  const webviewRoot = path.resolve(context.extensionPath, ${JSON.stringify(this.webviewDirName)})
  const base = webview.asWebviewUri(vscode.Uri.file(webviewRoot))
  let html = ${JSON.stringify(content)}

  html = html
    .replaceAll('{{base}}', base)
    .replaceAll('{{cspSource}}', webview.cspSource)

  return html
}
`,
        }
      })
    },
  }
}

namespace Processor {
  export type PromiseOr<T> = Promise<T> | T
  export type ArrayOr<T> = Array<T> | T

  /** 扩展名 */
  export type ExtensionName = `.${string}`
  /** 以 `{{base}}/` 开头的URL */
  export type BaseURL = `{{base}}/${string}`

  export interface URLUpdater {
    (newURL: string): void
  }

  /**
   * Webview 文件处理器参数
   */
  export interface ProcessConfig {
    /** 源代码文件夹 */
    srcDir: string
    /** 产物文件夹 */
    distDir: string
    /** Webview 文件夹 */
    webviewDir: string
  }

  /**
   *  预处理器返回值
   */
  export interface PreProcessResult {
    /** 插件名 */
    pluginName: string
    /** 源文件绝对路径 */
    sourceFile: string
    /** 产物文件绝对路径 */
    targetPath: string
    /** 源文件扩展名 */
    ext: Processor.ExtensionName
    /** script 或 link 的 type */
    type?: string
  }

  /** 处理器插件 */
  export interface ProcessorPlugin {
    /** 插件名 */
    name: string
    /** 插件支持的文件扩展名 */
    supports: ExtensionName[]

    /**
     * ## 文件预处理器
     *
     * 在此阶段生成最终文件路径
     *
     * @param processor 处理器实例
     * @param sourceFile 源文件的绝对路径
     * @param ext 文件扩展名
     * @param type script 或 link 的 type
     * @returns 返回文件类型和产物文件的绝对路径
     */
    preProcess(
      processor: Processor,
      sourceFile: string,
      ext: ExtensionName,
      type?: string,
    ): PromiseOr<PreProcessResult>

    /**
     * ## 文件处理器
     *
     * 在此阶段生成最终文件
     *
     * @param processor 处理器实例
     * @returns
     */
    process(
      processor: Processor,
      files: Record<
        string,
        Pick<Processor.PreProcessResult, 'targetPath' | 'ext' | 'type'>
      >,
    ): PromiseOr<void>
  }
}

export default Processor
