import * as fs from 'node:fs'
import * as path from 'node:path'
import { ElementParser, type EnginePlugin } from '../engine'

const getSass = async () => {
  try {
    return await import('sass-embedded')
  } catch {
    return (await import('sass')) as unknown as typeof import('sass-embedded')
  }
}

export const sass = (
  options?: Parameters<(typeof import('sass-embedded'))['compileAsync']>[1],
): EnginePlugin => {
  options ??= {}
  const list: Array<ElementParser> = []

  return {
    name: '@vscp/sass',
    onResolve({ baseDir, element }) {
      const parser = ElementParser.create(baseDir, element)

      if (parser?.type !== 'style') return

      const result = parser.extname === '.sass' || parser.extname === '.scss'
      if (!result) return

      list.push(parser)
      element.setAttribute(
        'href',
        parser.url.replace('.sass', '.scss').replace('.scss', '.css'),
      )

      return true
    },
    async onInvoke(engine) {
      const sass = await getSass()

      for (let i = 0; i < list.length; i++) {
        const element = list[i]

        const entry = path
          .relative(engine.cwd, element.absolutePath)
          .replaceAll('\\', '/')
        const targetPath = entry
          .replace(engine.src, engine.dist)
          .replace('.sass', '.scss')
          .replace('.scss', '.css')

        const result = await sass.compileAsync(entry, {
          alertColor: true,
          sourceMap: true,
          ...options,
        })
        await fs.promises.mkdir(path.dirname(targetPath), { recursive: true })
        await fs.promises.writeFile(targetPath, result.css, 'utf-8')
        if (result.sourceMap)
          await fs.promises.writeFile(
            `${targetPath}.map`,
            JSON.stringify(result.sourceMap),
            'utf-8',
          )
      }
    },
  }
}
export default sass
