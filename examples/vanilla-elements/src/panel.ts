import * as vscode from 'vscode'
import html from './webview/index.html'

export class MainPanel {
  public static currentPanel: MainPanel | undefined
  private readonly _panel: vscode.WebviewPanel
  private _disposables: vscode.Disposable[] = []

  private constructor(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
  ) {
    this._panel = panel

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)
    this._panel.webview.html = html(this._panel.webview, context)

    this.setupWebviewHooks(this._panel.webview, this._disposables)
  }

  public static render(context: vscode.ExtensionContext) {
    if (MainPanel.currentPanel) {
      MainPanel.currentPanel._panel.reveal(vscode.ViewColumn.One)
    } else {
      const panel = vscode.window.createWebviewPanel(
        'showHelloWorld',
        'Hello World',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        },
      )

      MainPanel.currentPanel = new MainPanel(panel, context)
    }
    MainPanel.currentPanel._panel.webview.postMessage({
      type: 'hello',
      data: 'Hello World!',
    })
  }

  setupWebviewHooks(webview: vscode.Webview, disposables: vscode.Disposable[]) {
    webview.onDidReceiveMessage(
      (message: any) => {
        const type = message.type
        const data = message.data
        console.log(`type: ${type}`)
        switch (type) {
          case 'hello':
            vscode.window.showInformationMessage(data)
            return
        }
      },
      undefined,
      disposables,
    )
  }
  /**
   * Cleans up and disposes of webview resources when the webview panel is closed.
   */
  public dispose() {
    MainPanel.currentPanel = undefined

    // Dispose of the current webview panel
    this._panel.dispose()

    // Dispose of all disposables (i.e. commands) for the current webview panel
    while (this._disposables.length) {
      const disposable = this._disposables.pop()
      if (disposable) {
        disposable.dispose()
      }
    }
  }
}
