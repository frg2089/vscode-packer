import * as fs from 'node:fs'
import * as path from 'node:path'
import { compileAsync } from 'sass-embedded'
import Processor from '.'

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
    async process(processor, files) {
      const list = Object.entries(files)
      for (let i = 0; i < list.length; i++) {
        const [sourceFile, { targetPath }] = list[i]
        const result = await compileAsync(sourceFile)
        await fs.promises.mkdir(path.dirname(targetPath), {
          recursive: true,
        })
        await fs.promises.writeFile(targetPath, result.css, 'utf-8')
      }
    },
  }
}
export default sass
