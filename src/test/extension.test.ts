import * as assert from 'assert';
import { createWorkspaceUrl, selectWorkspaceUri } from '../workspaceUrl';

describe('Workspace URL generation', () => {
  it('Remote SSH URI converts correctly', () => {
    const uri = {
      scheme: 'vscode-remote',
      authority: 'ssh-remote+example-host',
      path: '/srv/projects/sample/sample.code-workspace'
    };
    const result = createWorkspaceUrl(uri);
    assert.strictEqual(
      result,
      'vscode://vscode-remote/ssh-remote+example-host/srv/projects/sample/sample.code-workspace?windowId=_blank'
    );
  });

  it('Remote SSH with existing query keeps query and adds windowId', () => {
    const uri = {
      scheme: 'vscode-remote',
      authority: 'ssh-remote+host',
      path: '/path/workspace.code-workspace',
      query: 'foo=bar'
    };
    const result = createWorkspaceUrl(uri);
    assert.strictEqual(result, 'vscode://vscode-remote/ssh-remote+host/path/workspace.code-workspace?foo=bar&windowId=_blank');
  });

  it('Remote SSH with existing windowId does not duplicate', () => {
    const uri = {
      scheme: 'vscode-remote',
      authority: 'ssh-remote+host',
      path: '/path/workspace.code-workspace',
      query: 'foo=bar&windowId=_blank'
    };
    const result = createWorkspaceUrl(uri);
    assert.strictEqual(result, 'vscode://vscode-remote/ssh-remote+host/path/workspace.code-workspace?foo=bar&windowId=_blank');
  });

  it('Local file scheme converts correctly', () => {
    const uri = {
      scheme: 'file',
      authority: '',
      path: '/home/user/project/my.code-workspace'
    };
    const result = createWorkspaceUrl(uri);
    assert.strictEqual(result, 'vscode://file/home/user/project/my.code-workspace');
  });

  it('Unsupported scheme returns undefined', () => {
    const uri = {
      scheme: 'http',
      authority: 'example.com',
      path: ''
    };
    const result = createWorkspaceUrl(uri);
    assert.strictEqual(result, undefined);
  });

  it('selectWorkspaceUri prefers workspace file when present', () => {
    const selection = selectWorkspaceUri(
      { scheme: 'file', authority: '', path: '/tmp/example.code-workspace' },
      [{ uri: { scheme: 'file', authority: '', path: '/tmp/project' } }]
    );
    assert.deepStrictEqual(selection, {
      ok: true,
      uri: { scheme: 'file', authority: '', path: '/tmp/example.code-workspace' }
    });
  });

  it('selectWorkspaceUri falls back to single folder', () => {
    const selection = selectWorkspaceUri(undefined, [
      { uri: { scheme: 'vscode-remote', authority: 'ssh-remote+host', path: '/srv/project' } }
    ]);
    assert.deepStrictEqual(selection, {
      ok: true,
      uri: { scheme: 'vscode-remote', authority: 'ssh-remote+host', path: '/srv/project' }
    });
  });

  it('selectWorkspaceUri errors for no workspace and no folder', () => {
    const selection = selectWorkspaceUri(undefined, undefined);
    assert.deepStrictEqual(selection, {
      ok: false,
      message: 'No workspace or folder is open.'
    });
  });

  it('selectWorkspaceUri errors for multi-root without workspace file', () => {
    const selection = selectWorkspaceUri(undefined, [
      { uri: { scheme: 'file', authority: '', path: '/tmp/a' } },
      { uri: { scheme: 'file', authority: '', path: '/tmp/b' } }
    ]);
    assert.deepStrictEqual(selection, {
      ok: false,
      message: 'The current workspace does not have a persistent workspace file.'
    });
  });
});
