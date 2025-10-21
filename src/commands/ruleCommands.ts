// Rule Management Commands
import * as vscode from 'vscode';
import { Rule } from '../scanner/rulesScanner';
import { MDCParser } from '../utils/mdcParser';

export class RuleCommands {
	static registerCommands(context: vscode.ExtensionContext): void {
		// View Rule command - now uses the preview/editor interface
		const viewRule = vscode.commands.registerCommand('projectRules.viewRule', async (rule: Rule) => {
			try {
				// Import and use the new preview editor
				const { RulePreviewEditor } = await import('./rulePreviewEditor');
				RulePreviewEditor.createOrShow(rule);
			} catch (e: any) {
				vscode.window.showErrorMessage(`Failed to view rule: ${e?.message || e}`);
			}
		});

		// Create Rule command
		const createRule = vscode.commands.registerCommand('projectRules.createRule', async () => {
			try {
				// Get rule type
				const type = await vscode.window.showQuickPick(
					['always', 'auto', 'agent', 'manual'],
					{ placeHolder: 'Select rule type' }
				);
				if (!type) {return;}

				// Get rule name
				const fileName = await vscode.window.showInputBox({
					prompt: 'Rule file name (without extension)',
					validateInput: (value) => {
						if (!value || value.trim().length === 0) {
							return 'File name is required';
						}
						if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
							return 'File name can only contain letters, numbers, underscores, and hyphens';
						}
						return null;
					}
				});
				if (!fileName) {return;}

				// Get description
				const description = await vscode.window.showInputBox({
					prompt: 'Rule description'
				});
				if (!description) {return;}

				// Get content
				const content = await vscode.window.showInputBox({
					prompt: 'Rule content (markdown)',
					value: 'Write your rule content here...'
				});
				if (!content) {return;}

				// Get directory (optional)
				const directory = await vscode.window.showInputBox({
					prompt: 'Directory (leave empty for root)',
					value: ''
				});

				// Create the rule file
				const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
				if (!workspaceRoot) {
					vscode.window.showErrorMessage('No workspace folder found');
					return;
				}

				const { RulesScanner } = await import('../scanner/rulesScanner');
				const scanner = new RulesScanner(workspaceRoot);

				const metadata = {
					type: type as 'always' | 'auto' | 'agent' | 'manual',
					description,
					globs: [],
					alwaysApply: false
				};

				const fileUri = await scanner.createRuleFile(
					directory || '',
					`${fileName}.mdc`,
					metadata,
					content
				);

				vscode.window.showInformationMessage(`Rule created: ${vscode.workspace.asRelativePath(fileUri)}`);
			} catch (e: any) {
				vscode.window.showErrorMessage(`Failed to create rule: ${e?.message || e}`);
			}
		});

		// Edit Rule command
		const editRule = vscode.commands.registerCommand('projectRules.editRule', async (rule: Rule) => {
			try {
				await vscode.window.showTextDocument(rule.uri);
			} catch (e: any) {
				vscode.window.showErrorMessage(`Failed to edit rule: ${e?.message || e}`);
			}
		});

		// Delete Rule command
		const deleteRule = vscode.commands.registerCommand('projectRules.deleteRule', async (rule: Rule) => {
			try {
				const result = await vscode.window.showWarningMessage(
					`Are you sure you want to delete "${rule.fileName}"?`,
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
					await scanner.deleteRuleFile(rule.uri);
					vscode.window.showInformationMessage(`Rule deleted: ${rule.fileName}`);
				}
			} catch (e: any) {
				vscode.window.showErrorMessage(`Failed to delete rule: ${e?.message || e}`);
			}
		});

		// Copy Rule command
		const copyRule = vscode.commands.registerCommand('projectRules.copyRule', async (rule: Rule) => {
			try {
				const mdcContent = MDCParser.generateMDC(rule.metadata, rule.content);
				await vscode.env.clipboard.writeText(mdcContent);
				vscode.window.showInformationMessage(`Rule copied to clipboard: ${rule.fileName}`);
			} catch (e: any) {
				vscode.window.showErrorMessage(`Failed to copy rule: ${e?.message || e}`);
			}
		});

		context.subscriptions.push(viewRule, createRule, editRule, deleteRule, copyRule);
	}
}
