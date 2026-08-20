export type WorkspaceUriLike = {
  scheme: string;
  authority: string;
  path: string;
  query?: string;
};

export type WorkspaceFolderLike = {
  uri: WorkspaceUriLike;
};

export type WorkspaceSelection =
  | { ok: true; uri: WorkspaceUriLike }
  | { ok: false; message: string };

function withWindowIdQuery(query: string | undefined): string {
  const params = new URLSearchParams(query ?? '');
  if (!params.has('windowId')) {
    params.set('windowId', '_blank');
  }
  return params.toString();
}

/**
 * Generate a VS Code URL that can reopen the given workspace URI.
 * Supports remote SSH (vscode-remote scheme) and local file scheme.
 */
export function createWorkspaceUrl(uri: WorkspaceUriLike): string | undefined {
  if (uri.scheme === 'vscode-remote') {
    const base = `vscode://vscode-remote/${uri.authority}${uri.path}`;
    return `${base}?${withWindowIdQuery(uri.query)}`;
  }

  if (uri.scheme === 'file') {
    const base = `vscode://file${uri.path}`;
    return uri.query ? `${base}?${uri.query}` : base;
  }

  return undefined;
}

export function selectWorkspaceUri(
  workspaceFile: WorkspaceUriLike | undefined,
  workspaceFolders: readonly WorkspaceFolderLike[] | undefined
): WorkspaceSelection {
  if (workspaceFile) {
    return { ok: true, uri: workspaceFile };
  }

  if (!workspaceFolders || workspaceFolders.length === 0) {
    return { ok: false, message: 'No workspace or folder is open.' };
  }

  if (workspaceFolders.length === 1) {
    return { ok: true, uri: workspaceFolders[0].uri };
  }

  return {
    ok: false,
    message: 'The current workspace does not have a persistent workspace file.'
  };
}

export type ClipboardFormat = 'plain' | 'markdown' | 'html';

export function formatWorkspaceUrl(url: string, format: ClipboardFormat, workspaceName?: string): string {
  if (format === 'plain') {
    return url;
  }

  const safeName = workspaceName?.trim() || 'Workspace';

  if (format === 'markdown') {
    return `[${safeName}](${url})`;
  }

  return `<a href="${escapeHtml(url)}">${escapeHtml(safeName)}</a>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
