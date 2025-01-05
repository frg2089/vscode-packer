import * as htmlParser from 'node-html-parser'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as tsup from 'tsup'
import * as vite from 'vite'
import type { EngineContext } from '..'
import buildScript from './build.ts.template'
import devTemplate from './dev.html'
import devScript from './dev.js.template'

type ESBuildPlugin = Exclude<tsup.Options['esbuildPlugins'], undefined>[0]

export const esbuildHtmlProcess = (context: EngineContext): ESBuildPlugin => {
  /**
   * HTML 处理器
   * @param absolutePath HTML文件的绝对路径
   * @returns
   */
  const htmlProcess = async (absolutePath: string): Promise<string> => {
    if (context.isDev) {
      const urlPath = path
        .relative(context.cwd, absolutePath)
        .replaceAll('\\', '/')

      return devTemplate.replaceAll(
        '{{serverUrl}}',
        `${context.devUrlBase}${urlPath}`,
      )
    }
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
    name: 'vscode-packer/esbuild-plugin-html-process',
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
          contents: buildScript.replaceAll(
            '{{content}}',
            JSON.stringify(content),
          ),
        }
      })
    },
  }
}

export const viteHtmlProcess = (): vite.PluginOption => {
  return {
    name: 'vscode-packer/vite-plugin-html-process',
    transformIndexHtml: html => {
      /** HTML 文档 */
      const document = htmlParser.parse(html)
      document
        .querySelectorAll('base')
        .concat(
          document.querySelectorAll(
            'meta[http-equiv="Content-Security-Policy"]',
          ),
        )
        .forEach(base => base.remove())
      document
        .querySelector('head')
        ?.insertAdjacentHTML(
          'beforeend',
          /* html */ `<script>${devScript}</script>`,
        )
      return document.toString()
    },
  }
}
