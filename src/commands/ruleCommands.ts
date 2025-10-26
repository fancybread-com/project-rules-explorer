// Rule Management Commands
import * as vscode from 'vscode';
import { Rule } from '../scanner/rulesScanner';
import { MDCParser } from '../utils/mdcParser';
import { RulesTreeItem } from '../providers/rulesTreeProvider';

export class RuleCommands {
	static registerCommands(context: vscode.ExtensionContext): void {

		// Create Rule command
		const createRule = vscode.commands.registerCommand('projectRules.createRule', async (treeItem?: RulesTreeItem) => {
			try {

				// Get the project context from the tree item
				let projectPath: string;
				if (treeItem && treeItem.project) {
					projectPath = treeItem.project.path;
				} else {
					// Fallback to workspace root
					const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
					if (!workspaceRoot) {
						vscode.window.showErrorMessage('No workspace folder found');
						return;
					}
					projectPath = workspaceRoot.fsPath;
				}

				// Ask for rule name
				const ruleName = await vscode.window.showInputBox({
					prompt: 'Enter rule name',
					placeHolder: 'my-new-rule',
					validateInput: (value) => {
						if (!value || value.trim().length === 0) {
							return 'Rule name cannot be empty';
						}
						if (value.includes(' ')) {
							return 'Rule name cannot contain spaces (use kebab-case)';
						}
						if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
							return 'Rule name can only contain letters, numbers, hyphens, and underscores';
						}
						return null;
					}
				});

				if (!ruleName) {
					return; // User cancelled
				}

				const fileName = ruleName.endsWith('.mdc') ? ruleName : `${ruleName}.mdc`;
				const rulesDir = vscode.Uri.joinPath(vscode.Uri.file(projectPath), '.cursor', 'rules');

				// Ensure .cursor/rules directory exists
				try {
					await vscode.workspace.fs.stat(rulesDir);
				} catch {
					await vscode.workspace.fs.writeFile(vscode.Uri.joinPath(rulesDir, '.gitkeep'), Buffer.from(''));
				}

				const ruleUri = vscode.Uri.joinPath(rulesDir, fileName);

				// Check if file already exists
				try {
					await vscode.workspace.fs.stat(ruleUri);
					vscode.window.showErrorMessage(`A rule with the name "${fileName}" already exists`);
					return;
				} catch {
					// File doesn't exist, which is what we want
				}

			// Create default rule content
			const defaultContent = `---
description: "New rule"
globs: []
alwaysApply: false
---

# ${ruleName}

Describe your rule here.

## Guidelines

- Add specific guidelines
- Include examples
- Explain when to apply this rule
`;

				// Create the file
				await vscode.workspace.fs.writeFile(ruleUri, Buffer.from(defaultContent, 'utf8'));

				// Open the file in the editor
				await vscode.window.showTextDocument(ruleUri);

				vscode.window.showInformationMessage(`Rule created: ${fileName}`);
			} catch (e: any) {
				vscode.window.showErrorMessage(`Failed to create rule: ${e?.message || e}`);
			}
		});


		// Delete Rule command
		const deleteRule = vscode.commands.registerCommand('projectRules.deleteRule', async (rule: Rule | RulesTreeItem) => {
			try {
				// Debug logging

				// Handle both Rule and RulesTreeItem types
				let actualRule: Rule;
				if (rule && 'rule' in rule && rule.rule) {
					// It's a RulesTreeItem with a rule property
					actualRule = rule.rule;
				} else if (rule && 'uri' in rule) {
					// It's a Rule object directly
					actualRule = rule as Rule;
				} else {
					vscode.window.showErrorMessage('No rule provided or invalid rule object');
					return;
				}

				// Validate rule and uri
				if (!actualRule) {
					vscode.window.showErrorMessage('No rule provided');
					return;
				}

				if (!actualRule.uri) {
					vscode.window.showErrorMessage('Rule URI is missing');
					return;
				}

				const result = await vscode.window.showWarningMessage(
					`Are you sure you want to delete "${actualRule.fileName || 'Unknown'}"?`,
					'Yes', 'No'
				);

				if (result === 'Yes') {
					const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
					if (!workspaceRoot) {
						vscode.window.showErrorMessage('No workspace folder found');
						return;
					}

					const { RulesScanner } = await import('../scanner/rulesScanner');
					const scanner = new RulesScanner(workspaceRoot);
					await scanner.deleteRuleFile(actualRule.uri);
					vscode.window.showInformationMessage(`Rule deleted: ${actualRule.fileName || 'Unknown'}`);
				}
			} catch (e: any) {
				vscode.window.showErrorMessage(`Failed to delete rule: ${e?.message || e}`);
			}
		});

		// Copy Rule command
		const copyRule = vscode.commands.registerCommand('projectRules.copyRule', async (rule: Rule | RulesTreeItem) => {
			try {
				// Debug logging

				// Handle both Rule and RulesTreeItem types
				let actualRule: Rule;
				if (rule && 'rule' in rule && rule.rule) {
					// It's a RulesTreeItem with a rule property
					actualRule = rule.rule;
				} else if (rule && 'metadata' in rule) {
					// It's a Rule object directly
					actualRule = rule as Rule;
				} else {
					vscode.window.showErrorMessage('No rule provided or invalid rule object');
					return;
				}

				// Validate rule and metadata
				if (!actualRule) {
					vscode.window.showErrorMessage('No rule provided');
					return;
				}

				if (!actualRule.metadata) {
					vscode.window.showErrorMessage('Rule metadata is missing');
					return;
				}

			// Ensure metadata has required fields with defaults
			const metadata = {
				description: actualRule.metadata.description || 'No description',
				globs: actualRule.metadata.globs || [],
				alwaysApply: actualRule.metadata.alwaysApply || false
			};

				const content = actualRule.content || '';
				const mdcContent = MDCParser.generateMDC(metadata, content);
				await vscode.env.clipboard.writeText(mdcContent);
				vscode.window.showInformationMessage(`Rule copied to clipboard: ${actualRule.fileName || 'Unknown'}`);
			} catch (e: any) {
				vscode.window.showErrorMessage(`Failed to copy rule: ${e?.message || e}`);
			}
		});


		// Rename Rule command
		const renameRule = vscode.commands.registerCommand('projectRules.renameRule', async (rule: Rule | RulesTreeItem) => {
			try {
				// Debug logging

				// Handle both Rule and RulesTreeItem types
				let actualRule: Rule;
				if (rule && 'rule' in rule && rule.rule) {
					// It's a RulesTreeItem with a rule property
					actualRule = rule.rule;
				} else if (rule && 'uri' in rule) {
					// It's a Rule object directly
					actualRule = rule as Rule;
				} else {
					vscode.window.showErrorMessage('No rule provided or invalid rule object');
					return;
				}

				// Validate rule and uri
				if (!actualRule) {
					vscode.window.showErrorMessage('No rule provided');
					return;
				}

				if (!actualRule.uri) {
					vscode.window.showErrorMessage('Rule URI is missing');
					return;
				}

				const newName = await vscode.window.showInputBox({
					prompt: 'Enter new rule name',
					value: (actualRule.fileName || '').replace('.mdc', ''),
					validateInput: (value) => {
						if (!value || value.trim().length === 0) {
							return 'Rule name cannot be empty';
						}
						if (value.includes(' ')) {
							return 'Rule name cannot contain spaces (use kebab-case)';
						}
						if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
							return 'Rule name can only contain letters, numbers, hyphens, and underscores';
						}
						return null;
					}
				});

				if (!newName) {
					return; // User cancelled
				}

				const newFileName = newName.endsWith('.mdc') ? newName : `${newName}.mdc`;
				const newUri = vscode.Uri.joinPath(actualRule.uri, '..', newFileName);

				// Check if file already exists
				try {
					await vscode.workspace.fs.stat(newUri);
					vscode.window.showErrorMessage(`A rule with the name "${newFileName}" already exists`);
					return;
				} catch {
					// File doesn't exist, which is what we want
				}

				// Read the current file content
				const currentContent = await vscode.workspace.fs.readFile(actualRule.uri);

				// Write to new location
				await vscode.workspace.fs.writeFile(newUri, currentContent);

				// Delete the old file
				await vscode.workspace.fs.delete(actualRule.uri);

				vscode.window.showInformationMessage(`Rule renamed: ${actualRule.fileName || 'Unknown'} → ${newFileName}`);
			} catch (e: any) {
				vscode.window.showErrorMessage(`Failed to rename rule: ${e?.message || e}`);
			}
		});

		// Paste Rule command
		const pasteRule = vscode.commands.registerCommand('projectRules.pasteRule', async (treeItem?: RulesTreeItem) => {
			try {

				// Get content from clipboard
				const clipboardContent = await vscode.env.clipboard.readText();
				if (!clipboardContent) {
					vscode.window.showWarningMessage('No content in clipboard');
					return;
				}

				// Try to parse the clipboard content as MDC
				try {
					const { metadata, content } = MDCParser.parseMDCFromString(clipboardContent);

					// Create a new rule with the parsed content
					const { RulePreviewEditor } = await import('./rulePreviewEditor');
					const projectContext = treeItem?.project;

					// Create a temporary rule with the pasted content
					const tempRule: Rule = {
						uri: vscode.Uri.file(''), // Will be set when saved
						metadata: {
							...metadata,
							// Add a suffix to indicate it's a pasted rule
							description: metadata.description ? `${metadata.description} (pasted)` : 'Pasted rule'
						},
						content: content,
						fileName: 'pasted-rule.mdc'
					};

					// Create a new rule with the pasted content
					RulePreviewEditor.createRuleWithContent(context, projectContext, tempRule);

				} catch (parseError) {
					// If parsing fails, treat it as plain text content
					vscode.window.showWarningMessage('Clipboard content is not a valid rule format. Creating rule with clipboard content as text.');

					const { RulePreviewEditor } = await import('./rulePreviewEditor');
					const projectContext = treeItem?.project;

				// Create a temporary rule with the clipboard content as plain text
				const tempRule: Rule = {
					uri: vscode.Uri.file(''), // Will be set when saved
					metadata: {
						description: 'Pasted content',
						globs: [],
						alwaysApply: false
					},
					content: clipboardContent,
					fileName: 'pasted-content.mdc'
				};

					// Create a new rule with the pasted content
					RulePreviewEditor.createRuleWithContent(context, projectContext, tempRule);
				}
			} catch (e: any) {
				vscode.window.showErrorMessage(`Failed to paste rule: ${e?.message || e}`);
			}
		});

		context.subscriptions.push(createRule, deleteRule, copyRule, pasteRule, renameRule);
	}
}
