import * as path from 'node:path'
import * as tsup from 'tsup'
import { ElementParser, type EnginePlugin } from '../engine'

export const typescript = (options?: tsup.Options): EnginePlugin => {
  options ??= {}
  const list: Array<[ElementParser, boolean]> = []
  return {
    name: '@vscp/typescript',
    onResolve({ baseDir, element }) {
      const parser = ElementParser.create(baseDir, element)

      if (parser?.type !== 'script') return

      const result = parser.extname === '.ts' || parser.extname === '.tsx'
      if (!result) return

      list.push([parser, element.getAttribute('type') === 'module'])
      element.setAttribute(
        'src',
        parser.url.replace('.ts', '.js').replace('.jsx', '.js'),
      )

      return true
    },
    async onInvoke(engine) {
      const template = async (
        source: ElementParser[] | undefined,
        format: tsup.Options['format'],
      ) => {
        if (!source) return
        const record: Record<string, tsup.Options> = {}

        source
          .map(i => {
            const entry = path
              .relative(engine.cwd, i.absolutePath)
              .replaceAll('\\', '/')

            return {
              entry,
              outDir: path.dirname(entry).replace(engine.src, engine.dist),
            }
          })
          .forEach(({ entry, outDir }) => {
            record[outDir] ??= {
              outDir,
              entry: [],
            }
            if (!Array.isArray(record[outDir].entry)) record[outDir].entry = []
            record[outDir].entry.push(entry)
          })

        await Promise.all(
          Object.values(record).map(
            async i =>
              await tsup.build({
                format,
                bundle: !!engine.isBuild,
                minify: !!engine.isBuild,
                treeshake: !!engine.isBuild,
                sourcemap: true,
                platform: 'browser',
                outExtension: () => {
                  return {
                    js: '.js',
                  }
                },
                ...i,
                ...options,
              }),
          ),
        )
      }
      template(
        list.filter(([_, esm]) => esm).map(([i]) => i),
        'esm',
      )
      template(
        list.filter(([_, esm]) => !esm).map(([i]) => i),
        'iife',
      )
    },
  }
}
export default typescript
