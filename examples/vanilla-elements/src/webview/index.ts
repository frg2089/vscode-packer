import '@vscode-elements/elements'

const vscode = acquireVsCodeApi<string>()

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
  setState.onclick = () => {
    vscode.setState(stateInput?.value)
  }
}
const getState: HTMLButtonElement | null = document.querySelector('#getState')
if (getState && stateInput) {
  stateInput.value = vscode.getState()!
  getState.onclick = () => {
    stateInput.value = vscode.getState()!
  }
}
