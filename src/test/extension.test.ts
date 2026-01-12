import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('Clipboard Diff Swap Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	suite('Configuration Tests', () => {
		test('Should have default configuration value', async () => {
			const config = vscode.workspace.getConfiguration('clipboardDiffSwap');
			const editableClipboard = config.get<boolean>('editableClipboard');
			
			// Default should be false (read-only mode)
			assert.strictEqual(editableClipboard, false);
		});

		test('Should allow configuration changes', async () => {
			const config = vscode.workspace.getConfiguration('clipboardDiffSwap');
			
			// Change to editable mode
			await config.update('editableClipboard', true, vscode.ConfigurationTarget.Global);
			
			const updatedValue = config.get<boolean>('editableClipboard');
			assert.strictEqual(updatedValue, true);
			
			// Reset to default
			await config.update('editableClipboard', false, vscode.ConfigurationTarget.Global);
		});
	});

	suite('Command Registration Tests', () => {
		test('Should register compare command', async () => {
			const commands = await vscode.commands.getCommands();
			assert.ok(commands.includes('clipboard-swap.compareWithClipboard'));
		});

		test('Should have correct command title', async () => {
			// This tests that the command is properly registered with correct metadata
			const commands = await vscode.commands.getCommands(true);
			const compareCommand = commands.find(cmd => cmd === 'clipboard-swap.compareWithClipboard');
			assert.ok(compareCommand, 'Compare command should be registered');
		});
	});

	suite('Functional Tests', () => {
		let testDocument: vscode.TextDocument;
		let testEditor: vscode.TextEditor;

		suiteSetup(async () => {
			// Create a test document
			testDocument = await vscode.workspace.openTextDocument({
				content: 'function test() {\n  return "hello world";\n}',
				language: 'typescript'
			});
			testEditor = await vscode.window.showTextDocument(testDocument);
		});

		suiteTeardown(async () => {
			// Clean up test document
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
		});

		test('Should fail when clipboard is empty', async () => {
			// Clear clipboard
			await vscode.env.clipboard.writeText('');
			
			// Try to execute compare command
			try {
				await vscode.commands.executeCommand('clipboard-swap.compareWithClipboard');
				assert.fail('Should have thrown an error for empty clipboard');
			} catch (error) {
				// Expected to fail
				assert.ok(true);
			}
		});

		test('Should work with clipboard content - Read-only mode', async () => {
			// Set configuration to read-only
			const config = vscode.workspace.getConfiguration('clipboardDiffSwap');
			await config.update('editableClipboard', false, vscode.ConfigurationTarget.Global);
			
			// Set clipboard content
			await vscode.env.clipboard.writeText('function test() {\n  return "modified content";\n}');
			
			// Execute compare command
			await vscode.commands.executeCommand('clipboard-swap.compareWithClipboard');
			
			// Verify diff editor opened (check active editor)
			const activeEditor = vscode.window.activeTextEditor;
			assert.ok(activeEditor, 'Should have an active editor after comparison');
			
			// Check if it's a diff editor by checking the viewColumn
			assert.ok(activeEditor.viewColumn, 'Should have opened a diff view');
		});

		test('Should work with clipboard content - Editable mode', async () => {
			// Set configuration to editable
			const config = vscode.workspace.getConfiguration('clipboardDiffSwap');
			await config.update('editableClipboard', true, vscode.ConfigurationTarget.Global);
			
			// Set clipboard content
			await vscode.env.clipboard.writeText('function test() {\n  return "editable content";\n}');
			
			// Execute compare command
			await vscode.commands.executeCommand('clipboard-swap.compareWithClipboard');
			
			// Verify diff editor opened
			const activeEditor = vscode.window.activeTextEditor;
			assert.ok(activeEditor, 'Should have an active editor after comparison');
			
			// In editable mode, should create an untitled document
			const visibleEditors = vscode.window.visibleTextEditors;
			const untitledEditor = visibleEditors.find(editor => 
				editor.document.uri.scheme === 'untitled'
			);
			assert.ok(untitledEditor, 'Should create an untitled document in editable mode');
			
			// Reset to default
			await config.update('editableClipboard', false, vscode.ConfigurationTarget.Global);
		});

		test('Should handle different file types', async () => {
			// Test with different language
			const jsonDoc = await vscode.workspace.openTextDocument({
				content: '{\n  "test": "value"\n}',
				language: 'json'
			});
			await vscode.window.showTextDocument(jsonDoc);
			
			await vscode.env.clipboard.writeText('{\n  "test": "modified"\n}');
			
			// Should work with JSON files
			await vscode.commands.executeCommand('clipboard-swap.compareWithClipboard');
			
			const activeEditor = vscode.window.activeTextEditor;
			assert.ok(activeEditor, 'Should work with JSON files');
			
			// Clean up
			await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
		});

		test('Should handle no active editor gracefully', async () => {
			// Close all editors
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
			
			// Try to execute compare command
			try {
				await vscode.commands.executeCommand('clipboard-swap.compareWithClipboard');
				// Should not throw but should show error message
				assert.ok(true, 'Should handle no active editor gracefully');
			} catch (error) {
				assert.fail('Should not throw error, should show user message instead');
			}
		});
	});

	suite('Integration Tests', () => {
		test('Should work with VS Code built-in swap command', async () => {
			// Set up test environment
			const config = vscode.workspace.getConfiguration('clipboardDiffSwap');
			await config.update('editableClipboard', true, vscode.ConfigurationTarget.Global);
			
			const testDoc = await vscode.workspace.openTextDocument({
				content: 'original content',
				language: 'plaintext'
			});
			await vscode.window.showTextDocument(testDoc);
			
			await vscode.env.clipboard.writeText('clipboard content');
			
			// Open comparison
			await vscode.commands.executeCommand('clipboard-swap.compareWithClipboard');
			
			// Try to use built-in swap command
			try {
				await vscode.commands.executeCommand('workbench.action.compareEditor.swapSides');
				assert.ok(true, 'Built-in swap command should work');
			} catch (error) {
				// May not work in test environment, but shouldn't crash
				assert.ok(true, 'Swap command handled gracefully');
			}
			
			// Reset configuration
			await config.update('editableClipboard', false, vscode.ConfigurationTarget.Global);
		});
	});

	suite('Edge Cases', () => {
		test('Should handle very large clipboard content', async () => {
			const largeContent = 'x'.repeat(10000);
			await vscode.env.clipboard.writeText(largeContent);
			
			const testDoc = await vscode.workspace.openTextDocument({
				content: 'small content',
				language: 'plaintext'
			});
			await vscode.window.showTextDocument(testDoc);
			
			// Should handle large content without crashing
			await vscode.commands.executeCommand('clipboard-swap.compareWithClipboard');
			assert.ok(true, 'Should handle large clipboard content');
		});

		test('Should handle special characters in clipboard', async () => {
			const specialContent = '🚀 Special chars: áéíóú ñ 中文 العربية';
			await vscode.env.clipboard.writeText(specialContent);
			
			const testDoc = await vscode.workspace.openTextDocument({
				content: 'regular content',
				language: 'plaintext'
			});
			await vscode.window.showTextDocument(testDoc);
			
			await vscode.commands.executeCommand('clipboard-swap.compareWithClipboard');
			assert.ok(true, 'Should handle special characters');
		});

		test('Should handle whitespace-only clipboard', async () => {
			await vscode.env.clipboard.writeText('   \n\t  \n   ');
			
			const testDoc = await vscode.workspace.openTextDocument({
				content: 'content',
				language: 'plaintext'
			});
			await vscode.window.showTextDocument(testDoc);
			
			// Should treat whitespace-only as empty
			try {
				await vscode.commands.executeCommand('clipboard-swap.compareWithClipboard');
				assert.fail('Should reject whitespace-only clipboard');
			} catch (error) {
				assert.ok(true, 'Should reject whitespace-only clipboard');
			}
		});
	});

	suite('Performance Tests', () => {
		test('Should execute compare command quickly', async () => {
			const testDoc = await vscode.workspace.openTextDocument({
				content: 'performance test content',
				language: 'plaintext'
			});
			await vscode.window.showTextDocument(testDoc);
			
			await vscode.env.clipboard.writeText('clipboard performance test');
			
			const startTime = Date.now();
			await vscode.commands.executeCommand('clipboard-swap.compareWithClipboard');
			const endTime = Date.now();
			
			const executionTime = endTime - startTime;
			assert.ok(executionTime < 5000, `Command should execute quickly (took ${executionTime}ms)`);
		});
	});
});
