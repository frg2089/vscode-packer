import {
  allComponents,
  provideVSCodeDesignSystem,
} from '@vscode/webview-ui-toolkit'

const vscode = acquireVsCodeApi()

provideVSCodeDesignSystem().register(allComponents)

const btnPostMessage: HTMLButtonElement | null =
  document.querySelector('#postMessage')
if (btnPostMessage) {
  btnPostMessage.onclick = () => {
    vscode.postMessage({
      type: 'hello',
      data: 'Hey there partner! 🤠',
    })
  }
}
const stateInput: HTMLInputElement | null =
  document.querySelector('#stateInput')
if (stateInput) {
  stateInput.oninput = e => {
    const element = e.target as HTMLInputElement
    document.querySelector('#state')!.innerHTML = element.value
  }
}

const setState: HTMLButtonElement | null = document.querySelector('#setState')
if (setState) {
  vscode.setState(stateInput?.value)
}
const getState: HTMLButtonElement | null = document.querySelector('#getState')
if (getState && stateInput) {
  stateInput.value = (await vscode.getState()) as string
}
