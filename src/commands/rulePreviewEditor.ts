// Rule Preview/Editor Webview
import * as vscode from 'vscode';
import { Rule } from '../scanner/rulesScanner';
import { MDCParser } from '../utils/mdcParser';

export class RulePreviewEditor {
	private static readonly viewType = 'rulePreviewEditor';
	private static openPanels: Map<string, vscode.WebviewPanel> = new Map();

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
		const panel = vscode.window.createWebviewPanel(
			RulePreviewEditor.viewType,
			`Rule: ${rule.fileName}`,
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

		// Handle messages from the webview
		panel.webview.onDidReceiveMessage(
			async (message) => {
				switch (message.type) {
					case 'editMode':
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
		const ruleData = RulePreviewEditor.serializeRule(rule);

		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rule Preview</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .title {
            font-size: 1.5em;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }

        .controls {
            display: flex;
            gap: 10px;
        }

        .btn {
            padding: 8px 16px;
            border: 1px solid var(--vscode-button-border);
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-radius: 3px;
            cursor: pointer;
            font-size: 13px;
            transition: background-color 0.2s;
        }

        .btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        .btn.primary {
            background-color: var(--vscode-button-background);
        }

        .btn.secondary {
            background-color: transparent;
            color: var(--vscode-foreground);
        }

        .metadata {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 20px;
        }

        .metadata-item {
            margin-bottom: 8px;
        }

        .metadata-label {
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
            display: inline-block;
            width: 120px;
        }

        .metadata-value {
            color: var(--vscode-foreground);
        }

        .content {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 20px;
            white-space: pre-wrap;
            font-family: var(--vscode-editor-font-family);
        }

        .edit-mode {
            display: none;
        }

        .edit-mode.active {
            display: block;
        }

        .preview-mode {
            display: block;
        }

        .preview-mode.hidden {
            display: none;
        }

        .form-group {
            margin-bottom: 15px;
        }

        .form-label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: var(--vscode-foreground);
        }

        .form-input {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 3px;
            font-family: var(--vscode-font-family);
        }

        .form-select {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 3px;
            font-family: var(--vscode-font-family);
        }

        .form-textarea {
            width: 100%;
            min-height: 200px;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
            resize: vertical;
        }

        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .checkbox {
            width: 16px;
            height: 16px;
        }

        .source-info {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid var(--vscode-panel-border);
            color: var(--vscode-descriptionForeground);
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${rule.fileName}</div>
        <div class="controls">
            <button class="btn secondary" id="previewBtn" onclick="toggleMode('preview')">Preview</button>
            <button class="btn primary" id="editBtn" onclick="toggleMode('edit')">Edit</button>
            <button class="btn secondary" onclick="closePanel()">Close</button>
        </div>
    </div>

    <div class="preview-mode" id="previewMode">
        <div class="metadata">
            <div class="metadata-item">
                <span class="metadata-label">Type:</span>
                <span class="metadata-value">${rule.metadata.type}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Description:</span>
                <span class="metadata-value">${rule.metadata.description}</span>
            </div>
            ${rule.metadata.globs && rule.metadata.globs.length > 0 ? `
            <div class="metadata-item">
                <span class="metadata-label">Globs:</span>
                <span class="metadata-value">${rule.metadata.globs.join(', ')}</span>
            </div>
            ` : ''}
            ${rule.metadata.alwaysApply ? `
            <div class="metadata-item">
                <span class="metadata-label">Always Apply:</span>
                <span class="metadata-value">Yes</span>
            </div>
            ` : ''}
        </div>

        <div class="content">${rule.content}</div>
    </div>

    <div class="edit-mode" id="editMode">
        <form id="editForm">
            <div class="form-group">
                <label class="form-label" for="type">Type</label>
                <select class="form-select" id="type" name="type">
                    <option value="always" ${rule.metadata.type === 'always' ? 'selected' : ''}>Always</option>
                    <option value="auto" ${rule.metadata.type === 'auto' ? 'selected' : ''}>Auto</option>
                    <option value="agent" ${rule.metadata.type === 'agent' ? 'selected' : ''}>Agent</option>
                    <option value="manual" ${rule.metadata.type === 'manual' ? 'selected' : ''}>Manual</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label" for="description">Description</label>
                <input type="text" class="form-input" id="description" name="description" value="${rule.metadata.description}" required>
            </div>

            <div class="form-group">
                <label class="form-label" for="globs">Globs (comma-separated)</label>
                <input type="text" class="form-input" id="globs" name="globs" value="${rule.metadata.globs ? rule.metadata.globs.join(', ') : ''}" placeholder="*.js, *.ts, *.tsx">
            </div>

            <div class="form-group">
                <div class="checkbox-group">
                    <input type="checkbox" class="checkbox" id="alwaysApply" name="alwaysApply" ${rule.metadata.alwaysApply ? 'checked' : ''}>
                    <label class="form-label" for="alwaysApply">Always Apply</label>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label" for="content">Content</label>
                <textarea class="form-textarea" id="content" name="content" required>${rule.content}</textarea>
            </div>

            <div class="controls">
                <button type="button" class="btn primary" onclick="saveRule()">Save</button>
                <button type="button" class="btn secondary" onclick="toggleMode('preview')">Cancel</button>
            </div>
        </form>
    </div>

    <div class="source-info">
        Source: ${rule.uri.fsPath}
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentRule = ${JSON.stringify(ruleData)};

        function toggleMode(mode) {
            const previewMode = document.getElementById('previewMode');
            const editMode = document.getElementById('editMode');
            const previewBtn = document.getElementById('previewBtn');
            const editBtn = document.getElementById('editBtn');

            if (mode === 'preview') {
                previewMode.classList.remove('hidden');
                editMode.classList.remove('active');
                previewBtn.classList.add('primary');
                previewBtn.classList.remove('secondary');
                editBtn.classList.add('secondary');
                editBtn.classList.remove('primary');
            } else {
                previewMode.classList.add('hidden');
                editMode.classList.add('active');
                editBtn.classList.add('primary');
                editBtn.classList.remove('secondary');
                previewBtn.classList.add('secondary');
                previewBtn.classList.remove('primary');
            }
        }

        function saveRule() {
            const form = document.getElementById('editForm');
            const formData = new FormData(form);

            const globs = formData.get('globs').split(',').map(g => g.trim()).filter(g => g.length > 0);

            const updatedRule = {
                ...currentRule,
                metadata: {
                    type: formData.get('type'),
                    description: formData.get('description'),
                    globs: globs,
                    alwaysApply: formData.get('alwaysApply') === 'on'
                },
                content: formData.get('content')
            };

            vscode.postMessage({
                type: 'saveRule',
                rule: updatedRule
            });
        }

        function closePanel() {
            vscode.postMessage({
                type: 'close'
            });
        }

        // Handle messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'updateRule':
                    currentRule = message.rule;
                    // Update the UI with the new rule data
                    break;
            }
        });
    </script>
</body>
</html>`;
	}

	private static serializeRule(rule: Rule): any {
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
			// Generate MDC content
			const mdcContent = MDCParser.generateMDC(ruleData.metadata, ruleData.content);

			// Write to file
			const uri = vscode.Uri.parse(ruleData.uri);
			await vscode.workspace.fs.writeFile(uri, Buffer.from(mdcContent, 'utf8'));

			// Show success message
			vscode.window.showInformationMessage(`Rule saved: ${ruleData.fileName}`);

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

	static registerCommands(context: vscode.ExtensionContext): void {
		const openRulePreview = vscode.commands.registerCommand('projectRules.openRulePreview', (rule: Rule) => {
			RulePreviewEditor.createOrShow(rule);
		});

		context.subscriptions.push(openRulePreview);
	}
}
