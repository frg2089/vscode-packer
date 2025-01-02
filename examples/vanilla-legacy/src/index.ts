import * as vscode from 'vscode'
import { MainPanel } from './panel'

export const activate = async (context: vscode.ExtensionContext) => {
  context.subscriptions.push(
    vscode.commands.registerCommand('hello-world.showHelloWorld', async () => {
      MainPanel.render(context)
    }),
  )
}

export const deactivate = () => {}
