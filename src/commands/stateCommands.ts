// State Management Commands
import * as vscode from 'vscode';
import { ProjectState } from '../scanner/stateScanner';

export class StateCommands {
	static registerCommands(context: vscode.ExtensionContext): void {
		// Scan State command
		const scanState = vscode.commands.registerCommand('projectRules.scanState', async () => {
			try {
				const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
				if (!workspaceRoot) {
					vscode.window.showErrorMessage('No workspace folder found');
					return;
				}

				const { StateScanner } = await import('../scanner/stateScanner');
				const scanner = new StateScanner(workspaceRoot);
				const state = await scanner.scanState();

				vscode.window.showInformationMessage(
					`Project state scanned: ${state.frameworks.length} frameworks, ${state.configuration.length} config files, ${state.architecture.length} architecture patterns, ${state.documentation.length} documentation files`
				);
			} catch (e: any) {
				vscode.window.showErrorMessage(`Failed to scan state: ${e?.message || e}`);
			}
		});

		// View State command
		const viewState = vscode.commands.registerCommand('projectRules.viewState', async () => {
			try {
				const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
				if (!workspaceRoot) {
					vscode.window.showErrorMessage('No workspace folder found');
					return;
				}

				const { StateScanner } = await import('../scanner/stateScanner');
				const scanner = new StateScanner(workspaceRoot);
				const state = await scanner.scanState();

				// Create a formatted view of the project state
				const content = `# Project State Analysis

## Technology Stack
### Languages (${state.languages.length})
${state.languages.length > 0 ? state.languages.map((l: string) => `- ${l}`).join('\n') : 'No languages detected'}

### Frameworks (${state.frameworks.length})
${state.frameworks.length > 0 ? state.frameworks.map((f: string) => `- ${f}`).join('\n') : 'No frameworks detected'}

### Dependencies (${state.dependencies.length})
${state.dependencies.length > 0 ? state.dependencies.map((d: string) => `- ${d}`).join('\n') : 'No dependencies detected'}

## Development Environment
### Build Tools (${state.buildTools.length})
${state.buildTools.length > 0 ? state.buildTools.map((b: string) => `- ${b}`).join('\n') : 'No build tools detected'}

### Testing (${state.testing.length})
${state.testing.length > 0 ? state.testing.map((t: string) => `- ${t}`).join('\n') : 'No testing frameworks detected'}

### Code Quality (${state.codeQuality.length})
${state.codeQuality.length > 0 ? state.codeQuality.map((c: string) => `- ${c}`).join('\n') : 'No code quality tools detected'}

### Development Tools (${state.developmentTools.length})
${state.developmentTools.length > 0 ? state.developmentTools.map((d: string) => `- ${d}`).join('\n') : 'No development tools detected'}

## Project Structure
### Architecture (${state.architecture.length})
${state.architecture.length > 0 ? state.architecture.map((a: string) => `- ${a}`).join('\n') : 'No architecture patterns detected'}

### Configuration (${state.configuration.length})
${state.configuration.length > 0 ? state.configuration.map((c: string) => `- ${c}`).join('\n') : 'No configuration files found'}

### Documentation (${state.documentation.length})
${state.documentation.length > 0 ? state.documentation.map((d: string) => `- ${d}`).join('\n') : 'No documentation found'}

---
*Generated on ${new Date().toLocaleString()}*
`;

				const doc = await vscode.workspace.openTextDocument({
					content,
					language: 'markdown'
				});
				await vscode.window.showTextDocument(doc);
			} catch (e: any) {
				vscode.window.showErrorMessage(`Failed to view state: ${e?.message || e}`);
			}
		});

		// Export State command
		const exportState = vscode.commands.registerCommand('projectRules.exportState', async () => {
			try {
				const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
				if (!workspaceRoot) {
					vscode.window.showErrorMessage('No workspace folder found');
					return;
				}

				const { StateScanner } = await import('../scanner/stateScanner');
				const scanner = new StateScanner(workspaceRoot);
				const state = await scanner.scanState();

				// Create JSON export
				const exportData = {
					timestamp: new Date().toISOString(),
					workspace: vscode.workspace.name || 'Unknown',
					state
				};

				const content = JSON.stringify(exportData, null, 2);

				const doc = await vscode.workspace.openTextDocument({
					content,
					language: 'json'
				});
				await vscode.window.showTextDocument(doc);

				vscode.window.showInformationMessage('Project state exported to new document');
			} catch (e: any) {
				vscode.window.showErrorMessage(`Failed to export state: ${e?.message || e}`);
			}
		});

		context.subscriptions.push(scanState, viewState, exportState);
	}
}
