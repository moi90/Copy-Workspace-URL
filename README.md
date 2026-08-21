# Copy Workspace URL Extension

This Visual Studio Code extension provides a single command **Copy Workspace URL** that copies a URL which can reopen the current workspace (remote or local) to the system clipboard.

## Features

* Supports workspaces opened via **Remote SSH** (`vscode-remote` scheme).
* Supports local `.code-workspace` files.
* Generates a URL in the form:
  * Remote: `vscode://vscode-remote/<authority><path>?windowId=_blank`
  * Local: `vscode://file/<absolute-path>`
* Provides clipboard output as plain URL, Markdown link, or HTML link.
* Copies to the clipboard and shows a brief notification.

## Usage

1. Open a workspace (`.code-workspace` file) in VS Code.
2. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
3. Run **Copy Workspace URL**.
4. Paste the clipboard contents anywhere – the URL can be opened to reconnect to the same workspace.

For alternate clipboard formats, use:

* **Copy Workspace URL (Choose Format)**
* **Copy Workspace URL as Markdown Link**
* **Copy Workspace URL as HTML Link**

### Remote SSH Note

For Remote SSH usage, this extension is intended to run on the UI (local) extension host so VS Code provides `vscode-remote` workspace URIs.

If you see an error saying a remote session was detected but the workspace URI is `file:`, reinstall the extension for the local/UI side and reload the window.

## Clipboard Format Note

The VS Code extension API currently only exposes text clipboard writes. This extension therefore offers explicit format commands (plain/Markdown/HTML) rather than writing multiple MIME variants in one clipboard operation.

## Development

Contributions and bug reports are welcome.

### Prerequisites

* Node.js (v20 or newer)
* VS Code (v1.89 or newer)

### Building the Extension

```bash
npm install
npm run compile   # compile TypeScript to JavaScript
```

### Running Tests

```bash
npm test
```

### Launching in Extension Development Host

1. Press **F5** in VS Code (or run the `Launch Extension` debug configuration).
2. A new VS Code window opens with the extension loaded.
3. Use the command palette to invoke **Copy Workspace URL**.

### Packaging

To create a `.vsix` package for distribution:

```bash
npx @vscode/vsce package
```

### AI-assisted development

This project was developed primarily with the assistance of AI coding tools. The maintainer has reviewed and tested the resulting code.

## License

MIT License – see [LICENSE](LICENSE) for details.
