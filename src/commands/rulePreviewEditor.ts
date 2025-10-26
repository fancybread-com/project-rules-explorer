// Rule Preview/Editor Webview
import * as vscode from 'vscode';
import { Rule } from '../scanner/rulesScanner';
import { MDCParser } from '../utils/mdcParser';

export class RulePreviewEditor {
	private static readonly viewType = 'rulePreviewEditor';
	private static openPanels: Map<string, vscode.WebviewPanel> = new Map();
	private static context: vscode.ExtensionContext;
	private static projectContext: any;

	static createOrShow(rule: Rule): void {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// Create a unique key for this rule
		const ruleKey = rule.uri.toString();

		// If we already have a panel for this rule, show it
		if (RulePreviewEditor.openPanels.has(ruleKey)) {
			const existingPanel = RulePreviewEditor.openPanels.get(ruleKey)!;
			existingPanel.reveal(column);
			existingPanel.webview.postMessage({
				type: 'updateRule',
				rule: RulePreviewEditor.serializeRule(rule)
			});
			return;
		}

		// Otherwise, create a new panel
		const isNewRule = !rule.uri || rule.uri.fsPath === '';
		const panelTitle = isNewRule ? 'New Rule' : `Rule: ${rule.fileName}`;

		const panel = vscode.window.createWebviewPanel(
			RulePreviewEditor.viewType,
			panelTitle,
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: []
			}
		);

		// Store the panel with the rule key
		RulePreviewEditor.openPanels.set(ruleKey, panel);
		RulePreviewEditor.updateWebview(rule);

		// Store whether this is a new rule for later use
		if (isNewRule) {
			// Send message after a short delay to ensure DOM is ready
			setTimeout(() => {
				panel.webview.postMessage({
					type: 'isNewRule',
					value: true
				});
			}, 100);
		}

		// Handle messages from the webview
		panel.webview.onDidReceiveMessage(
			async (message) => {
				switch (message.type) {
					case 'openInEditor':
						await RulePreviewEditor.handleEditMode(rule);
						break;
					case 'saveRule':
						await RulePreviewEditor.handleSaveRule(message.rule);
						break;
					case 'close':
						panel.dispose();
						break;
				}
			},
			undefined,
			[]
		);

		// Clean up when the panel is closed
		panel.onDidDispose(() => {
			RulePreviewEditor.openPanels.delete(ruleKey);
		});
	}

	private static updateWebview(rule: Rule): void {
		const ruleKey = rule.uri.toString();
		const panel = RulePreviewEditor.openPanels.get(ruleKey);
		if (!panel) {
			return;
		}

		panel.webview.html = RulePreviewEditor.getHtmlForWebview(rule);
	}

	private static getHtmlForWebview(rule: Rule): string {
		// Generate the raw MDC content (Markdown + YAML frontmatter)
		const mdcContent = MDCParser.generateMDC(rule.metadata, rule.content);

		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rule Preview: ${rule.fileName}</title>
    <style>
        body {
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 16px;
            line-height: 1.5;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .title {
            font-size: 1.2em;
            font-weight: 600;
            color: var(--vscode-textLink-foreground);
        }

        .controls {
            display: flex;
            gap: 8px;
        }

        .btn {
            padding: 4px 12px;
            border: 1px solid var(--vscode-button-border);
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-radius: 2px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 400;
            transition: all 0.1s ease;
            outline: none;
        }

        .btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        .btn:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: 2px;
        }

        .btn.secondary {
            background-color: transparent;
            color: var(--vscode-foreground);
            border-color: var(--vscode-contrastBorder);
        }

        .btn.secondary:hover {
            background-color: var(--vscode-toolbar-hoverBackground);
        }

        .content {
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            line-height: 1.5;
            white-space: pre-wrap;
            word-wrap: break-word;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 16px;
        }

        .source-info {
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px solid var(--vscode-panel-border);
            color: var(--vscode-descriptionForeground);
            font-size: 0.9em;
        }

        .format-info {
            margin-bottom: 12px;
            padding: 8px 12px;
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 3px solid var(--vscode-textBlockQuote-border);
            border-radius: 2px;
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${rule.fileName}</div>
        <div class="controls">
            <button class="btn secondary" onclick="openInEditor()">
                Open in Editor
            </button>
            <button class="btn secondary" onclick="closePanel()">
                Close
            </button>
        </div>
    </div>

    <div class="format-info">
        <strong>MDC Format:</strong> Markdown with YAML frontmatter (Cursor's rule format)
    </div>

    <div class="content">${mdcContent}</div>

    <div class="source-info">
        ${rule.uri && rule.uri.fsPath ? `Source: ${rule.uri.fsPath}` : 'New rule'}
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function openInEditor() {
            vscode.postMessage({
                type: 'openInEditor'
            });
        }

        function closePanel() {
            vscode.postMessage({
                type: 'close'
            });
        }
    </script>
</body>
</html>`;
	}

	static serializeRule(rule: Rule): any {
		return {
			fileName: rule.fileName,
			metadata: rule.metadata,
			content: rule.content,
			uri: rule.uri.toString()
		};
	}

	private static async handleEditMode(rule: Rule): Promise<void> {
		// Open the rule file in the editor
		await vscode.window.showTextDocument(rule.uri);
	}

	private static async handleSaveRule(ruleData: any): Promise<void> {
		try {
			// Validate rule data
			if (!ruleData.metadata || !ruleData.metadata.description) {
				vscode.window.showErrorMessage('Invalid rule data: missing description');
				return;
			}

			// Generate MDC content
			const mdcContent = MDCParser.generateMDC(ruleData.metadata, ruleData.content);

			let fileUri: vscode.Uri;

			// Check if this is a new rule (empty URI)
			if (!ruleData.uri || ruleData.uri === '') {
				// This is a new rule, we need to create it
				const { ProjectManager } = await import('../services/projectManager');
				const { RulesScanner } = await import('../scanner/rulesScanner');

				// Get the project context or fall back to current project
				if (!RulePreviewEditor.context) {
					vscode.window.showErrorMessage('Extension context not available');
					return;
				}

				let workspaceRoot: vscode.Uri;

				// Use the project context if available (from tree item), otherwise fall back to current project
				if (RulePreviewEditor.projectContext) {
					workspaceRoot = vscode.Uri.file(RulePreviewEditor.projectContext.path);
				} else {
					const projectManager = new ProjectManager(RulePreviewEditor.context);
					const currentProject = await projectManager.getCurrentProject();

					if (currentProject) {
						workspaceRoot = vscode.Uri.file(currentProject.path);
					} else {
						const fallbackRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
						if (!fallbackRoot) {
							vscode.window.showErrorMessage('No workspace folder found');
							return;
						}
						workspaceRoot = fallbackRoot;
					}
				}

				// Validate that we have a proper workspace root
				if (!workspaceRoot || workspaceRoot.fsPath === '/' || workspaceRoot.fsPath === '') {
					vscode.window.showErrorMessage('Invalid workspace root detected. Please ensure you have a valid workspace folder open.');
					return;
				}

				const scanner = new RulesScanner(workspaceRoot);

				// Use the title from the form data as the filename
				const fileName = ruleData.fileName;

				// Create the rule file - use empty string to create in the workspace root
				fileUri = await scanner.createRuleFile('', fileName, ruleData.metadata, ruleData.content);
			} else {
				// Existing rule, write to existing URI
				fileUri = vscode.Uri.parse(ruleData.uri);
				await vscode.workspace.fs.writeFile(fileUri, Buffer.from(mdcContent, 'utf8'));
			}

			// Show success message
			vscode.window.showInformationMessage(`Rule saved: ${vscode.workspace.asRelativePath(fileUri)}`);

			// Close the panel
			const ruleKey = ruleData.uri;
			const panel = RulePreviewEditor.openPanels.get(ruleKey);
			if (panel) {
				panel.dispose();
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to save rule: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	static createNewRule(context: vscode.ExtensionContext, projectContext?: any): void {
		// Create a temporary rule for the new rule template
		const tempRule: Rule = {
			uri: vscode.Uri.file(''), // Will be set when saved
			metadata: {
				description: '',
				globs: [],
				alwaysApply: false
			},
			content: '',
			fileName: 'new-rule.mdc'
		};

		// Store the context and project context for use in handleSaveRule
		RulePreviewEditor.context = context;
		RulePreviewEditor.projectContext = projectContext;
		RulePreviewEditor.createOrShow(tempRule);
	}

	static createRuleWithContent(context: vscode.ExtensionContext, projectContext: any, rule: Rule): void {
		// Store the context and project context for use in handleSaveRule
		RulePreviewEditor.context = context;
		RulePreviewEditor.projectContext = projectContext;
		RulePreviewEditor.createOrShow(rule);
	}

	static registerCommands(context: vscode.ExtensionContext): void {
		const openRulePreview = vscode.commands.registerCommand('projectRules.openRulePreview', (rule: Rule) => {
			RulePreviewEditor.createOrShow(rule);
		});

		context.subscriptions.push(openRulePreview);
	}
}
