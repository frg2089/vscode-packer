# VSCode Packer(暂定名)

与 [@tomjs/vite-plugin-vscode](https://github.com/tomjs/vite-plugin-vscode) 的方案不同的是

本项目采用的方案是：
- 对于webview 仅在 dev 时使用 vite 服务器，其他时候通过 tsup 编译
