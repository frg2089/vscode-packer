import * as fs from 'node:fs'
import Processor from '.'

const vanilla = (): Processor.ProcessorPlugin => {
  const pluginName = 'vanilla'
  return {
    name: pluginName,
    supports: ['.css', '.js'] as Processor.ExtensionName[],
    preProcess(processor, sourceFile, ext, type) {
      const targetPath = sourceFile.replace(processor.srcDir, processor.distDir)
      return {
        pluginName,
        sourceFile,
        targetPath,
        ext,
        type,
      }
    },
    async process(processor, files) {
      await Promise.all(
        Object.entries(files).map(async ([sourceFile, { targetPath }]) => {
          await fs.promises.copyFile(sourceFile, targetPath)
        }),
      )
    },
  }
}
export default vanilla
