import * as esbuild from 'esbuild'
import Processor from '.'

const typescript = (
  options: esbuild.BuildOptions,
): Processor.ProcessorPlugin => {
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
      await esbuild.build({
        ...options,
        entryPoints: Object.entries(files).map(
          ([sourceFile, { targetPath }]) => ({
            in: sourceFile,
            out: targetPath.replace('.js', ''),
          }),
        ),
      })
    },
  }
}
export default typescript
