import * as path from 'node:path'
import * as tsup from 'tsup'
import type { EngineContext } from '../engine'

type ESBuildPlugin = Exclude<tsup.Options['esbuildPlugins'], undefined>[0]

export const esbuildHtmlProcess = (
  context: EngineContext,
  htmlProcess: (path: string) => Promise<string>,
): ESBuildPlugin => ({
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
  const webviewRoot = path.resolve(context.extensionPath, ${JSON.stringify(context.webviewRelativeOutputDir)})
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
})
