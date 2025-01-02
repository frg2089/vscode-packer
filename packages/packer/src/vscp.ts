import { program } from 'commander'
import packageJson from '../package.json'
import * as build from './build'
import * as options from './options'

program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version)

program
  .command('build')
  .description('打包 VSCode 扩展')
  .action(() => {
    const config = options.withDefaults({})
    build.build(config)
  })

program.parse()
