import { program } from 'commander'
import packageJson from '../package.json'
import { Engine, EngineOptions } from './engine'

program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version)

program
  .command('build')
  .description('打包 VSCode 扩展')
  .action(async () => {
    const config = await EngineOptions.loadFromConfig()
    const engine = new Engine(config)

    await engine.build()
  })

program
  .command('dev')
  .description('打包 VSCode 扩展')
  .action(async () => {
    const config = await EngineOptions.loadFromConfig()
    const engine = new Engine(config)

    await engine.dev()
  })

program.parse()
