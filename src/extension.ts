import * as vscode from 'vscode';
import { createWorkspaceUrl, formatWorkspaceUrl, selectWorkspaceUri, type ClipboardFormat } from './workspaceUrl';

export function activate(context: vscode.ExtensionContext) {
  const copyUrl = async (format: ClipboardFormat) => {
    const selection = selectWorkspaceUri(vscode.workspace.workspaceFile, vscode.workspace.workspaceFolders);
    if (!selection.ok) {
      vscode.window.showErrorMessage(selection.message);
      return;
    }

    if (vscode.env.remoteName && selection.uri.scheme === 'file') {
      vscode.window.showErrorMessage(
        'Remote session detected but workspace URI is local file:. Install/run this extension on the UI host and try again.'
      );
      return;
    }

    const url = createWorkspaceUrl(selection.uri);

    if (!url) {
      vscode.window.showErrorMessage(`Cannot create a workspace URL for URI scheme: ${selection.uri.scheme}`);
      return;
    }

    try {
      const workspaceName = vscode.workspace.name;
      const payload = formatWorkspaceUrl(url, format, workspaceName);
      await vscode.env.clipboard.writeText(payload);
      const label = format === 'plain' ? 'URL' : `${format} link`;
      vscode.window.showInformationMessage(`Workspace ${label} copied to clipboard.`);
    } catch (e) {
      vscode.window.showErrorMessage('Failed to copy URL to clipboard.');
    }
  };

  const copyDefault = vscode.commands.registerCommand('copyWorkspaceUrl.copy', async () => {
    await copyUrl('plain');
  });

  const copyMarkdown = vscode.commands.registerCommand('copyWorkspaceUrl.copyMarkdown', async () => {
    await copyUrl('markdown');
  });

  const copyHtml = vscode.commands.registerCommand('copyWorkspaceUrl.copyHtml', async () => {
    await copyUrl('html');
  });

  const copyChooseFormat = vscode.commands.registerCommand('copyWorkspaceUrl.copyChooseFormat', async () => {
    const choice = await vscode.window.showQuickPick(
      [
        { label: 'Plain URL', value: 'plain' as const },
        { label: 'Markdown Link', value: 'markdown' as const },
        { label: 'HTML Link', value: 'html' as const }
      ],
      {
        placeHolder: 'Choose clipboard output format'
      }
    );

    if (!choice) {
      return;
    }

    await copyUrl(choice.value);
  });

  context.subscriptions.push(copyDefault, copyMarkdown, copyHtml, copyChooseFormat);
}

export function deactivate() {}
