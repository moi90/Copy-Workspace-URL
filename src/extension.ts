import * as vscode from 'vscode';
import { createWorkspaceUrl, selectWorkspaceUri } from './workspaceUrl';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('copyWorkspaceUrl.copy', async () => {
    const selection = selectWorkspaceUri(vscode.workspace.workspaceFile, vscode.workspace.workspaceFolders);
    if (!selection.ok) {
      vscode.window.showErrorMessage(selection.message);
      return;
    }

    const url = createWorkspaceUrl(selection.uri);

    if (!url) {
      vscode.window.showErrorMessage(`Cannot create a workspace URL for URI scheme: ${selection.uri.scheme}`);
      return;
    }

    try {
      await vscode.env.clipboard.writeText(url);
      vscode.window.showInformationMessage('Workspace URL copied to clipboard.');
    } catch (e) {
      vscode.window.showErrorMessage('Failed to copy URL to clipboard.');
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
