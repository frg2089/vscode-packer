import * as fs from 'node:fs'
import * as path from 'node:path'
import * as tsup from 'tsup'
import Processor from '.'

const typescript = (options: tsup.Options): Processor.ProcessorPlugin => {
  const pluginName = 'typescript'
  return {
    name: pluginName,
    supports: ['.ts', '.tsx'] as Processor.ExtensionName[],
    preProcess(processor, sourceFile, ext, type) {
      const targetPath = sourceFile
        .replace(processor.srcDir, processor.distDir)
        .replace(ext, '.js')
      return {
        pluginName,
        sourceFile,
        targetPath,
        ext,
        type,
      }
    },
    async process(processor, files) {
      await fs.promises.mkdir(processor.distDir, { recursive: true })

      const group: {
        iife?: typeof files
        esm?: typeof files
      } = {}
      Object.entries(files).forEach(([key, value]) => {
        const format = value.type === 'module' ? 'esm' : 'iife'
        key = path.relative(process.cwd(), key).replaceAll('\\', '/')
        group[format] ??= {}
        group[format][key] = value
      })

      if (group.esm) {
        const entry = Object.keys(group.esm)
        await tsup.build({
          outDir: processor.distDir,
          entry,
          format: 'esm',
          ...options,
        })
      }
      if (group.iife) {
        const entry = Object.keys(group.iife)
        await tsup.build({
          outDir: processor.distDir,
          entry,
          format: 'iife',
          ...options,
        })
      }
    },
  }
}
export default typescript
