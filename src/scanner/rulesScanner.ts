// Rules Scanner - Scan for .cursor/rules/*.mdc files in workspace
import * as vscode from 'vscode';
import { MDCParser } from '../utils/mdcParser';

export interface RuleMetadata {
	description: string;
	globs?: string[];
	alwaysApply?: boolean;
}

export interface Rule {
	uri: vscode.Uri;
	metadata: RuleMetadata;
	content: string;
	fileName: string;
}

export class RulesScanner {
	constructor(private workspaceRoot: vscode.Uri) {}

	async scanRules(): Promise<Rule[]> {
		const rules: Rule[] = [];

		try {
			// Find all .mdc files in .cursor/rules directories
			const pattern = new vscode.RelativePattern(this.workspaceRoot, '**/.cursor/rules/**/*.mdc');
			const files = await vscode.workspace.findFiles(pattern);

			// Also check for .md files (fallback for non-MDC format)
			const mdPattern = new vscode.RelativePattern(this.workspaceRoot, '**/.cursor/rules/**/*.md');
			const mdFiles = await vscode.workspace.findFiles(mdPattern);

			// Combine and deduplicate files
			const allFiles = [...files, ...mdFiles].filter((file, index, self) =>
				index === self.findIndex(f => f.fsPath === file.fsPath)
			);

			// Parse each file
			for (const file of allFiles) {
				try {
					const { metadata, content } = await MDCParser.parseMDC(file);
					const fileName = file.path.split('/').pop() || 'unknown';

					rules.push({
						uri: file,
						metadata,
						content,
						fileName
					});
				} catch (error) {
				// Add a placeholder rule for files that can't be parsed
				const fileName = file.path.split('/').pop() || 'unknown';
				rules.push({
					uri: file,
					metadata: {
						description: 'Error parsing file'
					},
					content: 'Error reading file content',
					fileName
				});
				}
			}

			return rules;
		} catch (error) {
			return [];
		}
	}

	async watchRules(): Promise<vscode.FileSystemWatcher> {
		// Create watcher for .mdc files
		const mdcPattern = new vscode.RelativePattern(this.workspaceRoot, '**/.cursor/rules/**/*.mdc');
		const mdcWatcher = vscode.workspace.createFileSystemWatcher(mdcPattern);

		// Create watcher for .md files
		const mdPattern = new vscode.RelativePattern(this.workspaceRoot, '**/.cursor/rules/**/*.md');
		const mdWatcher = vscode.workspace.createFileSystemWatcher(mdPattern);

		// Return a combined watcher (we'll handle both in the extension)
		return {
			...mdcWatcher,
			dispose: () => {
				mdcWatcher.dispose();
				mdWatcher.dispose();
			}
		} as vscode.FileSystemWatcher;
	}

	async createRuleFile(directory: string, fileName: string, metadata: RuleMetadata, content: string): Promise<vscode.Uri> {
		try {
			// Ensure the directory exists
			// Handle empty directory string by using workspace root directly
			let rulesDir: vscode.Uri;
			if (directory === '' || directory === '.') {
				rulesDir = vscode.Uri.joinPath(this.workspaceRoot, '.cursor', 'rules');
			} else {
				rulesDir = vscode.Uri.joinPath(this.workspaceRoot, directory, '.cursor', 'rules');
			}

			await vscode.workspace.fs.createDirectory(rulesDir);

			// Create the file URI
			const fileUri = vscode.Uri.joinPath(rulesDir, fileName);

			// Generate MDC content
			const mdcContent = MDCParser.generateMDC(metadata, content);

			// Write the file
			await vscode.workspace.fs.writeFile(fileUri, Buffer.from(mdcContent, 'utf8'));

			return fileUri;
		} catch (error) {
			throw error;
		}
	}

	async deleteRuleFile(uri: vscode.Uri): Promise<void> {
		try {
			await vscode.workspace.fs.delete(uri);
		} catch (error) {
			throw error;
		}
	}
}
