# Clipboard Diff Swap Extension

A VS Code extension that provides configurable clipboard comparison with editable content and proper diff ordering.

## Background

This extension addresses the community request in [VS Code GitHub issue #259434](https://github.com/microsoft/vscode/issues/259434) for:
- Configurable diff ordering (active file ↔ clipboard)
- Editable clipboard content in diff view
- Native swap functionality for clipboard comparisons

The extension provides users with choice and flexibility for their clipboard comparison workflow.

## Features

- **Compare active file with clipboard content** in a side-by-side diff view
- **Configurable clipboard editing**: Choose between read-only or editable clipboard content
- **Native swap functionality**: Use VS Code's built-in swap to toggle left ↔ right positions
- **Clean workspace**: Optional read-only mode creates no temporary files
- **Keyboard shortcut**: `Ctrl+K Ctrl+Shift+C` (or `Cmd+K Cmd+Shift+C` on Mac)

## Configuration

The extension provides a configuration option to control clipboard behavior:

### `clipboardDiffSwap.editableClipboard`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Make clipboard content editable in diff view

#### When `false` (default - Read-only mode):
- ✅ **Clean workspace**: No temporary files created
- ✅ **Fast workflow**: Instant comparison without file management
- ✅ **Native swap works**: Can still swap left ↔ right positions
- ❌ **Clipboard not editable**: Can only edit the active file side

#### When `true` (Editable mode):
- ✅ **Full editing**: Both clipboard and file sides are editable
- ✅ **Native swap works**: Perfect title updates when swapping
- ✅ **Save clipboard**: Can save modified clipboard content to a file
- ❌ **Temporary file**: Creates an "Untitled-1" document that needs manual cleanup

## Usage

### Basic Workflow

1. **Copy content** to your clipboard from anywhere
2. **Open a file** in VS Code that you want to compare
3. **Press `Cmd+K Cmd+Shift+C`** (or use Command Palette: "Compare Clipboard with Active File")
4. **View the diff**: Active file on left, clipboard on right
5. **Swap if needed**: Click the swap button in the diff view to toggle positions

### Changing Configuration

#### Via Settings UI:
1. Open VS Code Settings (`Cmd+,`)
2. Go to **Extensions** → **Clipboard Diff Swap**
3. Toggle **"Editable Clipboard"** option

#### Via settings.json:
```json
{
  "clipboardDiffSwap.editableClipboard": true
}
```

## Commands

| Command | Keyboard Shortcut | Description |
|---------|------------------|-------------|
| `clipboard-swap.compareWithClipboard` | `Cmd+K Cmd+Shift+C` | Compare clipboard with active file |

## Installation

### Option 1: One-line install (no global packages)
```bash
git clone https://github.com/hrdkmshra/clipboard-diff-swap.git && cd clipboard-diff-swap && npm install && npx vsce package && code --install-extension clipboard-diff-swap-1.0.0.vsix
```

### Option 2: Step by step
```bash
git clone https://github.com/hrdkmshra/clipboard-diff-swap.git
cd clipboard-diff-swap
npm install
npx vsce package
code --install-extension clipboard-diff-swap-1.0.0.vsix
```

### Option 3: Direct from GitHub (requires git and npm)
```bash
npx degit hrdkmshra/clipboard-diff-swap clipboard-diff-swap && cd clipboard-diff-swap && npm install && npx vsce package && code --install-extension clipboard-diff-swap-1.0.0.vsix
```

### Verification

After installation, verify the extension works:
1. Open any file in VS Code
2. Copy some text to clipboard
3. Press `Cmd+K Cmd+Shift+C`
4. You should see the diff view open

### Uninstallation

```bash
code --uninstall-extension clipboard-diff-swap
```

Or via VS Code UI: Extensions view → Find "Clipboard Diff Swap" → Uninstall


