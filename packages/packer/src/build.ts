import * as esbuild from 'esbuild'
import * as path from 'node:path'
import { packageJsonCleaner } from './package'
import Processor from './processors'
import sass from './processors/sass'
import typescript from './processors/typescript'
import vanilla from './processors/vanilla'

/**
 * 默认基础配置
 */
const extension: esbuild.BuildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  platform: 'node',
  format: 'cjs',
  external: ['vscode', 'node:*'],
  loader: {
    '.html': 'text',
  },
}

const processor = new Processor({
  srcDir: 'src/webview',
  distDir: 'dist/webview',
})
processor.use(vanilla())
processor.use(sass())
processor.use(
  typescript({
    format: 'esm',
    platform: 'browser',
    outdir: 'dist/webview',
    bundle: true,
  }),
)

/**
 * HTML 处理工具
 */
const html: esbuild.Plugin = {
  name: 'vscode-packer/html',
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
      // TODO: 需要改为从配置项中加载
      const webviewRoot = 'webview'
      const content = await processor.html(args.path)

      return {
        loader: 'ts',
        contents: /* ts */ `
import * as vscode from 'vscode'
import * as path from 'node:path'
export default (webview: vscode.Webview, context: vscode.ExtensionContext) => {
  const webviewRoot = path.resolve(context.extensionPath, ${JSON.stringify(webviewRoot)})
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

const build = async () => {
  packageJsonCleaner()
  extension.plugins ??= []
  extension.plugins.push(html)
  await esbuild.build(extension)
  await processor.process()
}

await build()
