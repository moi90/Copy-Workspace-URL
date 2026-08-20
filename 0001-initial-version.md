# Specification: VS Code “Copy Workspace URL” Extension

## Objective

Build a small Visual Studio Code extension that copies a URL representing the **currently open workspace** to the system clipboard.

The primary use case is a VS Code window connected through **Remote SSH**, where the current workspace is a `.code-workspace` file and the desired clipboard output is a URL that can reopen that same workspace.

Example input context:

```text
Remote authority:
ssh-remote+dev-host-001

Workspace file:
/srv/projects/example-project/example-project.code-workspace
```

Expected clipboard output:

```text
vscode://vscode-remote/ssh-remote+dev-host-001/srv/projects/example-project/example-project.code-workspace?windowId=_blank
```

All hostnames, usernames, paths, and project names in this specification are examples and must not be hard-coded.

## Functional Requirements

### 1. Command

Register a VS Code command:

```text
Copy Workspace URL
```

Suggested command ID:

```text
copyWorkspaceUrl.copy
```

The command must be available from the Command Palette.

Optionally contribute it to an appropriate workspace-related menu, but this is not required for the first version.

### 2. Determine the Current Workspace

When invoked, inspect the current VS Code window.

For a multi-root workspace opened from a `.code-workspace` file, use:

```ts
vscode.workspace.workspaceFile
```

as the source of the workspace URI.

The extension must operate on the workspace itself, not on the currently active editor or file.

### 3. Remote SSH Support

The main supported environment is VS Code Remote SSH.

A remote workspace may expose a URI conceptually equivalent to:

```text
vscode-remote://ssh-remote+dev-host-001/srv/projects/example-project/example-project.code-workspace
```

The extension must convert this into the externally launchable VS Code URL form:

```text
vscode://vscode-remote/ssh-remote+dev-host-001/srv/projects/example-project/example-project.code-workspace?windowId=_blank
```

The transformation should preserve:

- remote authority
    
- complete path
    
- workspace filename
    
- URL escaping where required
    

Do not reconstruct paths manually if the VS Code URI API can be used safely.

### 4. URL Format

For a remote workspace, generate:

```text
vscode://vscode-remote/<authority><path>?windowId=_blank
```

Example:

```text
vscode://vscode-remote/ssh-remote+example-host/home/example-user/projects/sample/sample.code-workspace?windowId=_blank
```

The `windowId=_blank` query parameter should be included by default so opening the URL creates or targets a separate VS Code window rather than unexpectedly replacing the current one.

Do not append duplicate query parameters if the implementation later accepts URIs that already contain a query string.

### 5. Clipboard

Copy the generated URL using the VS Code clipboard API:

```ts
vscode.env.clipboard.writeText(...)
```

After a successful copy, show a brief notification such as:

```text
Workspace URL copied to clipboard.
```

Avoid showing the full URL in the notification unless useful for debugging.

## Local Workspace Behavior

The extension should also behave sensibly when VS Code is not connected to a remote host.

If `workspaceFile` is a local `file:` URI, generate an appropriate VS Code URL for reopening that workspace.

Preferred format:

```text
vscode://file/<absolute-path-to-workspace>
```

If VS Code requires a different canonical URL form for local `.code-workspace` files, use the form supported by the VS Code URI/CLI semantics rather than forcing the remote format.

Local workspace support is secondary to Remote SSH support but should not break.

## Unsupported / Error Cases

### No Workspace Open

If:

```ts
vscode.workspace.workspaceFile
```

is undefined, do not copy anything.

Show:

```text
No workspace file is open.
```

A plain folder opened directly in VS Code is therefore not required to be supported in version 1.

### Untitled Workspace

If the workspace is an untitled or temporary workspace that does not have a stable reopenable location, show an informative error and do not generate a misleading URL.

Suggested message:

```text
The current workspace does not have a persistent workspace file.
```

### Unsupported URI Scheme

If an unexpected URI scheme is encountered, fail gracefully.

Suggested message:

```text
Cannot create a workspace URL for URI scheme: <scheme>
```

Do not silently generate a potentially invalid URL.

## Extension Structure

Keep the project deliberately small.

Suggested structure:

```text
copy-workspace-url/
├── package.json
├── tsconfig.json
├── src/
│   └── extension.ts
├── README.md
├── .gitignore
└── .vscodeignore
```

TypeScript is preferred.

Avoid unnecessary dependencies. Ideally, the extension should have **zero runtime npm dependencies** beyond the VS Code extension API.

## Activation

Use command-based activation.

For example:

```json
"activationEvents": [
  "onCommand:copyWorkspaceUrl.copy"
]
```

For VS Code versions where contributed commands automatically trigger activation, follow the current recommended extension manifest conventions.

Do not activate the extension on every VS Code startup unless required.

## Command Contribution

The extension manifest should contribute a command similar to:

```json
{
  "contributes": {
    "commands": [
      {
        "command": "copyWorkspaceUrl.copy",
        "title": "Copy Workspace URL"
      }
    ]
  }
}
```

Use a concise extension name and description.

Suggested metadata:

```text
Display name: Copy Workspace URL

Description:
Copies a reopenable VS Code URL for the current workspace to the clipboard.
```

## Implementation Guidance

Keep URL-generation logic separate from VS Code UI glue where practical.

For example:

```ts
function createWorkspaceUrl(uri: vscode.Uri): string
```

This function should be easy to unit test with synthetic URIs.

Avoid brittle string replacements such as globally replacing:

```text
vscode-remote://
```

with another prefix without separately handling the URI authority and path.

Prefer parsing the URI into its semantic components:

```text
scheme
authority
path
query
fragment
```

and deliberately building the target URL.

Pay particular attention to:

- spaces
    
- `+` characters in Remote SSH authorities
    
- Unicode filenames
    
- percent-encoded paths
    
- Windows drive letters for local workspaces
    
- avoiding accidental double encoding
    

## Example Test Cases

### Remote SSH

Input URI:

```text
vscode-remote://ssh-remote+example-host/srv/projects/sample/sample.code-workspace
```

Expected:

```text
vscode://vscode-remote/ssh-remote+example-host/srv/projects/sample/sample.code-workspace?windowId=_blank
```

### Remote SSH With Spaces

Conceptual workspace:

```text
/srv/projects/My Project/My Project.code-workspace
```

The resulting URL must be correctly encoded and remain reopenable by VS Code.

Do not assume that manually replacing spaces with `%20` is sufficient if VS Code's `Uri` APIs already handle encoding.

### Different Remote Host

Input:

```text
vscode-remote://ssh-remote+compute-node-042/home/example-user/work/project.code-workspace
```

Expected:

```text
vscode://vscode-remote/ssh-remote+compute-node-042/home/example-user/work/project.code-workspace?windowId=_blank
```

### No Workspace File

Input:

```ts
vscode.workspace.workspaceFile === undefined
```

Expected:

- clipboard unchanged
    
- informational/error notification shown
    
- command does not throw
    

## Testing

At minimum, test the URL conversion logic independently from a live SSH connection.

Recommended unit tests:

- ordinary `vscode-remote` URI
    
- remote path containing spaces
    
- remote path containing Unicode characters
    
- local workspace URI
    
- unsupported scheme
    
- query/encoding edge cases
    

Also perform one manual integration test:

1. Connect VS Code to a test machine through Remote SSH.
    
2. Open a `.code-workspace` file.
    
3. Run `Copy Workspace URL`.
    
4. Paste the clipboard contents into a shell or text editor and inspect it.
    
5. Open the copied URL.
    
6. Verify that VS Code reconnects to the same remote host and opens the same workspace.
    

## Acceptance Criteria

The implementation is complete when all of the following are true:

- The Command Palette contains **Copy Workspace URL**.
    
- Running it in a Remote SSH `.code-workspace` window copies a URL of the form:
    

```text
vscode://vscode-remote/ssh-remote+<host>/<workspace-path>?windowId=_blank
```

- Opening the copied URL reopens the intended remote workspace.
    
- No hostnames, usernames, project names, or paths are hard-coded.
    
- Paths requiring URL encoding work correctly.
    
- Invoking the command without a workspace file produces a clear message rather than an exception.
    
- The extension has no unnecessary runtime dependencies.
    
- The core implementation remains small and straightforward.
    

## Non-Goals

Version 1 does not need to support:

- copying the URL of the active file
    
- copying line or column numbers
    
- arbitrary folder-only workspaces without a `.code-workspace` file
    
- Remote Containers / Dev Containers unless they work naturally through the same URI mechanism
    
- WSL-specific behavior
    
- Codespaces-specific behavior
    
- configurable URL templates
    
- URL shortening
    
- QR codes
    
- telemetry
    
- network communication
    
- account authentication
    

These can be added later if there is a concrete need.

## Deliverables

The agent should produce:

- complete extension source code
    
- `package.json`
    
- TypeScript configuration
    
- a minimal README with installation and usage instructions
    
- tests for the URL-generation logic
    
- instructions for running the extension in VS Code's Extension Development Host
    
- instructions for packaging it into a `.vsix`
    

The implementation should prioritize correctness and minimalism over adding additional features.