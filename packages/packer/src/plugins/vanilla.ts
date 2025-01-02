import { ElementParser, type EnginePlugin } from '../engine'
import fs from 'node:fs'
import path from 'node:path'

export const vanilla = (): EnginePlugin => {
  const list: ElementParser[] = []
  return {
    name: '@vscp/vanilla',
    onResolve({ baseDir, element }) {
      const parser = ElementParser.create(baseDir, element)
      if (!parser) return

      const result = parser.extname === '.js' || parser.extname === '.css'
      if (result) list.push(parser)
      return result
    },
    async onInvoke(engine) {
      await Promise.all(
        list.map(async i => {
          const targetPath = i.absolutePath.replace(
            path.resolve(engine.src),
            path.resolve(engine.dist),
          )
          await fs.promises.mkdir(path.dirname(targetPath), {
            recursive: true,
          })
          await fs.promises.copyFile(i.absolutePath, targetPath)
        }),
      )
    },
  }
}
export default vanilla
