declare module '*.html' {
  import * as path from 'node:path'
  import * as vscode from 'vscode'
  export default (
    webview: vscode.Webview,
    context: vscode.ExtensionContext,
  ) => {
    const webviewRoot = path.resolve(__dirname)
    const base = webview.asWebviewUri(vscode.Uri.file(webviewRoot))
    let html: string

    html = html
      .replaceAll('{{base}}', base)
      .replaceAll('{{cspSource}}', webview.cspSource)

    return html
  }
}
