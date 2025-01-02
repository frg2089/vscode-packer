import * as tsup from 'tsup'
import {
  type BuildOptions,
  getTSUPOptions,
  getTSUPWebviewOptions,
} from './options'
import { packageJsonCleaner } from './package'
import Processor from './processors'
import sass from './processors/sass'
import typescript from './processors/typescript'
import vanilla from './processors/vanilla'

export const build = async (options: BuildOptions) => {
  const tsupOptions = getTSUPOptions(options)
  const tsupWebviewOptions = getTSUPWebviewOptions(options.webview)

  const processor = new Processor({
    srcDir: options.srcdir,
    distDir: options.outdir,
    webviewDir: options.webview.webviewdir,
  })
  processor.use(vanilla())
  processor.use(sass())
  processor.use(typescript(tsupWebviewOptions))
  tsupOptions.esbuildPlugins ??= []
  tsupOptions.esbuildPlugins.push(processor.esbuild)
  await tsup.build(tsupOptions)
  await processor.process()
  packageJsonCleaner()
}
