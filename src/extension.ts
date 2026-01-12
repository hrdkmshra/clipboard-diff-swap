import * as vscode from 'vscode';

/**
 * Clipboard Diff Swap Extension
 * 
 * Provides functionality to compare active file with clipboard content
 * in a configurable diff view with swap capabilities.
 */

// Extension state management
interface ExtensionState {
	currentClipboardContent: string;
	originalEditor: vscode.TextEditor | undefined;
	clipboardDocument: vscode.TextDocument | undefined;
	contentProvider: vscode.Disposable | undefined;
}

const state: ExtensionState = {
	currentClipboardContent: '',
	originalEditor: undefined,
	clipboardDocument: undefined,
	contentProvider: undefined
};

// Configuration constants
const EXTENSION_CONFIG_SECTION = 'clipboardDiffSwap';
const EDITABLE_CLIPBOARD_CONFIG = 'editableClipboard';
const PROVIDER_CLEANUP_DELAY = 1000;

export function activate(context: vscode.ExtensionContext) {
	const compareDisposable = vscode.commands.registerCommand(
		'clipboard-swap.compareWithClipboard', 
		async () => {
			try {
				await compareWithClipboard();
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
				vscode.window.showErrorMessage(`Clipboard Diff Swap: ${errorMessage}`);
			}
		}
	);

	context.subscriptions.push(compareDisposable);
}

/**
 * Main function to compare active file with clipboard content
 */
async function compareWithClipboard(): Promise<void> {
	// Clean up any previous state
	await cleanupState();

	const activeEditor = await getActiveEditor();
	if (!activeEditor) {
		return;
	}

	const clipboardContent = await getClipboardContent();
	if (!clipboardContent) {
		return;
	}

	// Update state
	state.originalEditor = activeEditor;
	state.currentClipboardContent = clipboardContent;

	// Show diff based on configuration
	const isEditableMode = getEditableClipboardConfig();
	if (isEditableMode) {
		await showEditableDiff();
	} else {
		await showReadOnlyDiff();
	}
}

/**
 * Get active editor with fallback logic
 */
async function getActiveEditor(): Promise<vscode.TextEditor | undefined> {
	let activeEditor = vscode.window.activeTextEditor;
	
	// Fallback to any visible editor if no active editor
	if (!activeEditor) {
		const visibleEditors = vscode.window.visibleTextEditors;
		if (visibleEditors.length > 0) {
			activeEditor = visibleEditors[0];
		} else {
			vscode.window.showErrorMessage('No open files found. Please open a file first.');
			return undefined;
		}
	}

	return activeEditor;
}

/**
 * Get and validate clipboard content
 */
async function getClipboardContent(): Promise<string | undefined> {
	const clipboardContent = await vscode.env.clipboard.readText();
	
	if (!clipboardContent.trim()) {
		vscode.window.showErrorMessage('Clipboard is empty. Please copy some text first.');
		return undefined;
	}

	return clipboardContent;
}

/**
 * Get editable clipboard configuration
 */
function getEditableClipboardConfig(): boolean {
	const config = vscode.workspace.getConfiguration(EXTENSION_CONFIG_SECTION);
	return config.get<boolean>(EDITABLE_CLIPBOARD_CONFIG, false);
}

/**
 * Show diff with editable clipboard (creates temp file)
 */
async function showEditableDiff(): Promise<void> {
	if (!state.originalEditor) {
		return;
	}

	try {
		// Create editable clipboard document
		state.clipboardDocument = await vscode.workspace.openTextDocument({
			content: state.currentClipboardContent,
			language: state.originalEditor.document.languageId
		});

		const fileName = vscode.workspace.asRelativePath(state.originalEditor.document.uri);

		// Active file LEFT, Clipboard RIGHT (both editable)
		await vscode.commands.executeCommand('vscode.diff', 
			state.originalEditor.document.uri, 
			state.clipboardDocument.uri, 
			`${fileName} ↔ Clipboard (Editable)`
		);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Failed to create editable diff';
		vscode.window.showErrorMessage(`Clipboard Diff Swap: ${errorMessage}`);
	}
}

/**
 * Show diff with read-only clipboard (no temp files)
 */
async function showReadOnlyDiff(): Promise<void> {
	if (!state.originalEditor) {
		return;
	}

	try {
		const clipboardUri = vscode.Uri.parse(`clipboard:content-${Date.now()}`);
		
		// Create content provider
		state.contentProvider = vscode.workspace.registerTextDocumentContentProvider('clipboard', {
			provideTextDocumentContent: () => state.currentClipboardContent
		});

		const fileName = vscode.workspace.asRelativePath(state.originalEditor.document.uri);

		// Active file LEFT, Clipboard RIGHT (read-only)
		await vscode.commands.executeCommand('vscode.diff', 
			state.originalEditor.document.uri, 
			clipboardUri, 
			`${fileName} ↔ Clipboard (Read-only)`
		);

		// Schedule cleanup
		setTimeout(() => {
			if (state.contentProvider) {
				state.contentProvider.dispose();
				state.contentProvider = undefined;
			}
		}, PROVIDER_CLEANUP_DELAY);

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Failed to create read-only diff';
		vscode.window.showErrorMessage(`Clipboard Diff Swap: ${errorMessage}`);
	}
}

/**
 * Clean up extension state
 */
async function cleanupState(): Promise<void> {
	// Dispose content provider if exists
	if (state.contentProvider) {
		state.contentProvider.dispose();
		state.contentProvider = undefined;
	}

	// Reset state
	state.currentClipboardContent = '';
	state.originalEditor = undefined;
	state.clipboardDocument = undefined;
}

export function deactivate() {
	// Clean up all resources
	cleanupState().catch(error => {
		console.error('Error during extension deactivation:', error);
	});
}
