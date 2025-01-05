import { defineConfig } from '@frg2089/vscode-packer'
import sass from '@frg2089/vscode-packer/sass'
import typescript from '@frg2089/vscode-packer/typescript'

export default defineConfig({
  plugins: [typescript(), sass()],
})
