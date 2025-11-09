// VS Code Extension Analyzer - Deep analysis of VS Code extensions
import * as vscode from 'vscode';
import { VSCodeContext } from '../types';

interface PackageJson {
	name?: string;
	displayName?: string;
	description?: string;
	version?: string;
	categories?: string[];
	engines?: {
		vscode?: string;
	};
	activationEvents?: string[];
	contributes?: {
		commands?: Array<{ command: string; title: string }>;
		views?: Record<string, Array<{ id: string; name: string }>>;
		viewsContainers?: any;
		configuration?: any;
		menus?: any;
		languages?: any[];
		grammars?: any[];
		themes?: any[];
		iconThemes?: any[];
		snippets?: any[];
		debuggers?: any[];
		keybindings?: any[];
	};
}

/**
 * Analyzes VS Code extensions
 */
export class VSCodeAnalyzer {
	/**
	 * Analyze VS Code extension
	 */
	async analyze(workspaceRoot: vscode.Uri): Promise<VSCodeContext> {
		const pkg = await this.readPackageJson(workspaceRoot);
		if (!pkg || !pkg.engines?.vscode) {
			throw new Error('Not a VS Code extension');
		}

		const extensionType = this.categorizeExtension(pkg);
		const capabilities = this.inferCapabilities(pkg.contributes || {});

		return {
			extensionType,
			category: pkg.categories?.[0] || 'Other',
			minVersion: pkg.engines?.vscode || 'unknown',
			activation: pkg.activationEvents || [],
			contributes: {
				commands: (pkg.contributes?.commands || []).length,
				views: this.countViews(pkg.contributes?.views || {}),
				configuration: !!pkg.contributes?.configuration,
				menus: !!pkg.contributes?.menus,
				languages: (pkg.contributes?.languages || []).length,
				themes: (pkg.contributes?.themes || []).length
			},
			capabilities
		};
	}

	/**
	 * Categorize extension type
	 */
	private categorizeExtension(pkg: PackageJson): string {
		const contributes = pkg.contributes || {};

		// Language support
		if (contributes.languages || contributes.grammars) {
			return 'language-support';
		}

		// Theme
		if (contributes.themes || contributes.iconThemes) {
			return 'theme';
		}

		// Debugger
		if (contributes.debuggers) {
			return 'debugger';
		}

		// Snippets
		if (contributes.snippets && !contributes.commands && !contributes.views) {
			return 'snippets';
		}

		// Productivity (has commands or views)
		if (contributes.views || contributes.commands) {
			return 'productivity';
		}

		return 'extension';
	}

	/**
	 * Infer capabilities from contributes
	 */
	private inferCapabilities(contributes: any): string[] {
		const caps: string[] = [];

		if (contributes.commands && contributes.commands.length > 0) {
			caps.push('Provides custom commands');
		}
		if (contributes.views && Object.keys(contributes.views).length > 0) {
			caps.push('Adds custom views to sidebar');
		}
		if (contributes.viewsContainers) {
			caps.push('Adds custom view containers');
		}
		if (contributes.configuration) {
			caps.push('User-configurable settings');
		}
		if (contributes.languages && contributes.languages.length > 0) {
			caps.push('Language support');
		}
		if (contributes.debuggers && contributes.debuggers.length > 0) {
			caps.push('Debugging support');
		}
		if (contributes.snippets && contributes.snippets.length > 0) {
			caps.push('Code snippets');
		}
		if (contributes.themes && contributes.themes.length > 0) {
			caps.push('Themes');
		}
		if (contributes.iconThemes && contributes.iconThemes.length > 0) {
			caps.push('Icon themes');
		}
		if (contributes.grammars && contributes.grammars.length > 0) {
			caps.push('Syntax highlighting');
		}
		if (contributes.keybindings && contributes.keybindings.length > 0) {
			caps.push('Custom keybindings');
		}
		if (contributes.menus) {
			caps.push('Context menus');
		}

		return caps;
	}

	/**
	 * Count total views across all containers
	 */
	private countViews(views: Record<string, any[]>): number {
		let count = 0;
		for (const container of Object.values(views)) {
			if (Array.isArray(container)) {
				count += container.length;
			}
		}
		return count;
	}

	/**
	 * Read package.json
	 */
	private async readPackageJson(workspaceRoot: vscode.Uri): Promise<PackageJson | null> {
		try {
			const packageJsonUri = vscode.Uri.joinPath(workspaceRoot, 'package.json');
			const packageJsonContent = await vscode.workspace.fs.readFile(packageJsonUri);
			return JSON.parse(Buffer.from(packageJsonContent).toString('utf8'));
		} catch (error) {
			return null;
		}
	}
}

