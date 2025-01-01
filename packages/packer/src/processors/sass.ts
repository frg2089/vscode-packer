import * as fs from 'node:fs'
import Processor from '.'

const getSass = async () => {
  try {
    return await import('sass-embedded')
  } catch {
    return await import('sass')
  }
}
const sass = (): Processor.ProcessorPlugin => {
  const pluginName = 'sass'
  return {
    name: pluginName,
    supports: ['.sass', '.scss'] as Processor.ExtensionName[],
    preProcess(processor, sourceFile, ext, type) {
      const targetPath = sourceFile
        .replace(processor.srcDir, processor.distDir)
        .replace(ext, '.css')
      return {
        pluginName,
        sourceFile,
        targetPath,
        ext,
        type,
      }
    },
    async process(processorr, files) {
      const sass = await getSass()
      await Promise.all(
        Object.entries(files).map(async ([sourceFile, { targetPath }]) => {
          const result = await sass.compileAsync(sourceFile)
          await fs.promises.writeFile(targetPath, result.css, 'utf-8')
        }),
      )
    },
  }
}
export default sass
