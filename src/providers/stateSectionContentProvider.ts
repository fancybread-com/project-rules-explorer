// State Section Content Provider - Provides read-only markdown content for state sections
import * as vscode from 'vscode';

/**
 * Content provider for state section views (read-only, no save prompts)
 */
export class StateSectionContentProvider implements vscode.TextDocumentContentProvider {
	private static scheme = 'project-rules-state';
	private contentCache = new Map<string, string>();

	/**
	 * Get the URI scheme
	 */
	static getScheme(): string {
		return this.scheme;
	}

	/**
	 * Create a URI for a state section
	 */
	static createUri(sectionKey: string, projectName: string): vscode.Uri {
		return vscode.Uri.parse(`${this.scheme}:${encodeURIComponent(projectName)}/${encodeURIComponent(sectionKey)}.md`);
	}

	/**
	 * Store content for a URI
	 */
	setContent(uri: vscode.Uri, content: string): void {
		this.contentCache.set(uri.toString(), content);
	}

	/**
	 * Provide content for a URI
	 */
	provideTextDocumentContent(uri: vscode.Uri): string {
		const content = this.contentCache.get(uri.toString());
		return content || '# Error\n\nContent not found.';
	}

	/**
	 * Register this provider with VS Code
	 */
	static register(context: vscode.ExtensionContext): StateSectionContentProvider {
		const provider = new StateSectionContentProvider();
		context.subscriptions.push(
			vscode.workspace.registerTextDocumentContentProvider(
				this.scheme,
				provider
			)
		);
		return provider;
	}
}

