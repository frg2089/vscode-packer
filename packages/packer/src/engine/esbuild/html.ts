import * as htmlParser from 'node-html-parser'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as tsup from 'tsup'
import type { EngineContext } from '..'

type ESBuildPlugin = Exclude<tsup.Options['esbuildPlugins'], undefined>[0]

export const esbuildHtmlProcess = (context: EngineContext): ESBuildPlugin => {
  /**
   * HTML 处理器
   * @param absolutePath HTML文件的绝对路径
   * @returns
   */
  const htmlProcess = async (absolutePath: string): Promise<string> => {
    /** HTML 文件所在的文件夹 */
    const baseDir = path.dirname(absolutePath)

    /** HTML 文档 */
    const document = htmlParser.parse(
      await fs.promises.readFile(absolutePath, 'utf-8'),
    )

    /** 待处理的元素 */
    const elements = ['link[rel="stylesheet"]', 'script[src]'].flatMap(i =>
      document.querySelectorAll(i),
    )

    elements.forEach(element =>
      context.plugins.find(plugin =>
        plugin.onResolve?.({
          baseDir,
          engine: context,
          element,
        }),
      ),
    )

    return document.toString()
  }
  return {
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
        const content = await htmlProcess(args.path)

        return {
          loader: 'ts',
          contents: /* ts */ `
import * as vscode from 'vscode'
import * as path from 'node:path'
export default (webview: vscode.Webview, context: vscode.ExtensionContext) => {
  const webviewRoot = path.resolve(__dirname)
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
