import * as fs from 'node:fs'
import * as path from 'node:path'

const packageFields = [
  'name',
  'version',
  'publisher',
  'engines',
  'license',
  'displayName',
  'description',
  'categories',
  'keywords',
  'galleryBanner',
  'preview',
  'main',
  'browser',
  'contributes',
  'activationEvents',
  'badges',
  'markdown',
  'qna',
  'sponsor',
  // 'dependencies', 依赖已打包
  // 'devDependencies', 依赖已打包
  'extensionPack',
  'extensionDependencies',
  'extensionKind',
  'scripts',
  'icon',
  'pricing',
  'capabilities',
]
const scriptsFields = ['vscode:uninstall']

export const packageJsonCleaner = async () => {
  const packageJson = await fs.promises.readFile(
    path.resolve('package.json'),
    'utf-8',
  )
  const packageObject = JSON.parse(packageJson)
  if (!packageObject.name) throw new Error('未设置 name')
  if (!packageObject.version) throw new Error('未设置 version')
  if (!packageObject.publisher) throw new Error('未设置 publisher')
  if (!packageObject.engines) throw new Error('未设置 engines')
  if (packageObject.scripts != null) {
    packageObject.scripts = Object.fromEntries(
      Object.entries(packageObject.scripts).filter(([key]) =>
        scriptsFields.includes(key),
      ),
    )
  }

  const newPackage = Object.fromEntries(
    Object.entries(packageObject).filter(([key]) =>
      packageFields.includes(key),
    ),
  )

  await fs.promises.mkdir('dist', { recursive: true })
  await fs.promises.writeFile(
    path.resolve('dist/package.json'),
    JSON.stringify(newPackage, null, 2),
    'utf-8',
  )
}
