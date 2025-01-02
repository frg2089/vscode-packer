import { defineConfig } from 'vscode-packer'
import sass from 'vscode-packer/sass'
import typescript from 'vscode-packer/typescript'

export default defineConfig({
  plugins: [typescript(), sass()],
})
