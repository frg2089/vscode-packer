import * as tsup from 'tsup'

interface CommonOptions {
  /**
   * 是否压缩产物
   * @default true
   */
  minify: boolean
  // /**
  //  * 是否打包依赖项
  //  * @default true
  //  */
  // bundle: boolean
  external: string[]
  tsconfig: string
}

export interface WebviewOptions extends CommonOptions {
  /**
   * webview 文件夹
   * @default 'webview'
   */
  webviewdir: string
  /**
   * 在打包时排除的依赖包
   * @default []
   */
  external: string[]
  /**
   * tsconfig 文件路径
   * @default 'tsconfig.webview.json'
   */
  tsconfig: string
}
export interface BuildOptions extends CommonOptions {
  /**
   * 扩展的入口文件
   * @default 'index.ts'
   */
  main: string
  /**
   * 源代码文件夹
   * @default 'src'
   */
  srcdir: string
  /**
   * 产物文件夹
   * @default 'dist'
   */
  outdir: string
  /**
   * 在打包时排除的依赖包
   * @default ['vscode', 'node:*']
   */
  external: string[]
  /**
   * tsconfig 文件路径
   * @default 'tsconfig.extension.json'
   */
  tsconfig: string
  /**
   * webview 设置
   */
  webview: WebviewOptions
}
export const withDefaults = (
  options: Partial<BuildOptions>,
  isBuild?: boolean,
): BuildOptions => {
  isBuild ??= false
  const result = options as BuildOptions
  result.main ??= 'index.ts'
  result.srcdir ??= 'src'
  result.outdir ??= 'dist'
  result.tsconfig ??= 'tsconfig.extension.json'
  result.external ??= ['vscode', 'node:*']
  result.minify ??= isBuild
  // result.bundle ??= isBuild

  result.webview ??= {} as WebviewOptions
  result.webview.webviewdir ??= 'webview'
  result.webview.tsconfig ??= 'tsconfig.webview.json'
  result.webview.external ??= []
  result.webview.minify ??= isBuild
  // result.webview.bundle ??= isBuild

  return result
}
export const getTSUPOptions = (options: BuildOptions): tsup.Options => {
  return {
    entry: [`${options.srcdir}/${options.main}`],
    outDir: options.outdir,
    minify: options.minify,
    external: options.external,
    tsconfig: options.tsconfig,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    clean: true,
    loader: {
      '.html': 'text',
    },
  }
}
export const getTSUPWebviewOptions = (
  options: WebviewOptions,
): tsup.Options => {
  return {
    minify: options.minify,
    external: options.external,
    tsconfig: options.tsconfig,
    bundle: false,
    treeshake: true,
    platform: 'browser',
    outExtension: () => {
      return {
        js: '.js',
      }
    },
  }
}
