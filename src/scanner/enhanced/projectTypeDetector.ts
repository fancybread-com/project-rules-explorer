// Project Type Detector - Detects the primary type of project
import * as vscode from 'vscode';
import { ProjectIdentity } from './types';

interface PackageJson {
	name?: string;
	version?: string;
	description?: string;
	keywords?: string[];
	engines?: {
		vscode?: string;
		node?: string;
	};
	bin?: any;
	main?: string;
	type?: string;
	private?: boolean;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
}

/**
 * Detects the project type, domain, primary language, and maturity level
 */
export class ProjectTypeDetector {
	/**
	 * Detect project identity
	 */
	async detect(workspaceRoot: vscode.Uri): Promise<ProjectIdentity> {
		const projectType = await this.detectProjectType(workspaceRoot);
		const domain = await this.detectDomain(workspaceRoot);
		const primaryLanguage = await this.detectPrimaryLanguage(workspaceRoot);
		const maturityLevel = await this.detectMaturityLevel(workspaceRoot);

		return {
			projectType,
			domain,
			primaryLanguage,
			maturityLevel
		};
	}

	/**
	 * Detect project type from package.json and root files
	 */
	private async detectProjectType(workspaceRoot: vscode.Uri): Promise<string> {
		try {
			// Check for package.json
			const packageJsonUri = vscode.Uri.joinPath(workspaceRoot, 'package.json');
			const packageJsonContent = await vscode.workspace.fs.readFile(packageJsonUri);
			const pkg: PackageJson = JSON.parse(Buffer.from(packageJsonContent).toString('utf8'));

			// VS Code Extension
			if (pkg.engines?.vscode) {
				return 'vscode-extension';
			}

			// CLI Tool
			if (pkg.bin) {
				return 'cli-tool';
			}

			// Web App
			if (pkg.dependencies?.react || pkg.dependencies?.vue || pkg.dependencies?.['@angular/core']) {
				return 'web-app';
			}

			// Check for index.html at root
			if (await this.fileExists(workspaceRoot, 'index.html')) {
				return 'web-app';
			}

			// API Server
			if (pkg.dependencies?.express || pkg.dependencies?.fastify || pkg.dependencies?.koa) {
				return 'api-server';
			}

			// Library
			if (pkg.main && !pkg.private) {
				return 'library';
			}

			return 'application';
		} catch (error) {
			// If no package.json, check for other project types

			// .NET project
			if (await this.fileExists(workspaceRoot, '*.csproj')) {
				return 'dotnet-application';
			}

			// Python project
			if (await this.fileExists(workspaceRoot, 'setup.py') ||
			    await this.fileExists(workspaceRoot, 'pyproject.toml')) {
				return 'python-package';
			}

			// Go project
			if (await this.fileExists(workspaceRoot, 'go.mod')) {
				return 'go-application';
			}

			// Rust project
			if (await this.fileExists(workspaceRoot, 'Cargo.toml')) {
				return 'rust-application';
			}

			return 'unknown';
		}
	}

	/**
	 * Detect domain from package.json keywords
	 */
	private async detectDomain(workspaceRoot: vscode.Uri): Promise<string> {
		try {
			const packageJsonUri = vscode.Uri.joinPath(workspaceRoot, 'package.json');
			const packageJsonContent = await vscode.workspace.fs.readFile(packageJsonUri);
			const pkg: PackageJson = JSON.parse(Buffer.from(packageJsonContent).toString('utf8'));

			const keywords = pkg.keywords || [];

			// Map keywords to domains
			if (keywords.some(k => ['vscode', 'developer', 'tools', 'development'].includes(k.toLowerCase()))) {
				return 'developer-tools';
			}
			if (keywords.some(k => ['ui', 'component', 'design', 'css', 'styling'].includes(k.toLowerCase()))) {
				return 'ui-components';
			}
			if (keywords.some(k => ['api', 'rest', 'graphql', 'server', 'backend'].includes(k.toLowerCase()))) {
				return 'backend-services';
			}
			if (keywords.some(k => ['frontend', 'webapp', 'react', 'vue', 'angular'].includes(k.toLowerCase()))) {
				return 'frontend-applications';
			}
			if (keywords.some(k => ['test', 'testing', 'qa', 'automation'].includes(k.toLowerCase()))) {
				return 'testing-tools';
			}
			if (keywords.some(k => ['cli', 'command-line', 'terminal'].includes(k.toLowerCase()))) {
				return 'cli-tools';
			}
			if (keywords.some(k => ['library', 'utility', 'helper', 'utils'].includes(k.toLowerCase()))) {
				return 'libraries';
			}
			if (keywords.some(k => ['data', 'database', 'orm', 'sql'].includes(k.toLowerCase()))) {
				return 'data-tools';
			}

			return 'general';
		} catch (error) {
			return 'general';
		}
	}

	/**
	 * Detect primary language from file extensions and package.json
	 */
	private async detectPrimaryLanguage(workspaceRoot: vscode.Uri): Promise<string> {
		try {
			// Check for TypeScript first
			if (await this.fileExists(workspaceRoot, 'tsconfig.json')) {
				return 'TypeScript';
			}

			// Check package.json for type="module" or dependencies
			const packageJsonUri = vscode.Uri.joinPath(workspaceRoot, 'package.json');
			const packageJsonContent = await vscode.workspace.fs.readFile(packageJsonUri);
			const pkg: PackageJson = JSON.parse(Buffer.from(packageJsonContent).toString('utf8'));

			if (pkg.dependencies?.typescript || pkg.devDependencies?.typescript) {
				return 'TypeScript';
			}

			if (pkg.type === 'module' || pkg.dependencies || pkg.devDependencies) {
				return 'JavaScript';
			}
		} catch (error) {
			// Continue to check other languages
		}

		// Check for other languages
		if (await this.fileExists(workspaceRoot, '*.csproj')) {
			return 'C#';
		}
		if (await this.fileExists(workspaceRoot, 'setup.py') || await this.fileExists(workspaceRoot, 'pyproject.toml')) {
			return 'Python';
		}
		if (await this.fileExists(workspaceRoot, 'go.mod')) {
			return 'Go';
		}
		if (await this.fileExists(workspaceRoot, 'Cargo.toml')) {
			return 'Rust';
		}
		if (await this.fileExists(workspaceRoot, 'pom.xml') || await this.fileExists(workspaceRoot, 'build.gradle')) {
			return 'Java';
		}

		return 'JavaScript';
	}

	/**
	 * Detect maturity level from version and changelog
	 */
	private async detectMaturityLevel(workspaceRoot: vscode.Uri): Promise<string> {
		try {
			const packageJsonUri = vscode.Uri.joinPath(workspaceRoot, 'package.json');
			const packageJsonContent = await vscode.workspace.fs.readFile(packageJsonUri);
			const pkg: PackageJson = JSON.parse(Buffer.from(packageJsonContent).toString('utf8'));

			const version = pkg.version || '0.0.0';

			// Check version for maturity
			if (version.startsWith('0.0.')) {
				return 'prototype';
			}
			if (version.startsWith('0.')) {
				return 'active-development';
			}
			if (version.startsWith('1.') || version.startsWith('2.') || version.startsWith('3.')) {
				// Check for CHANGELOG to determine if it's production or stable
				if (await this.fileExists(workspaceRoot, 'CHANGELOG.md') ||
				    await this.fileExists(workspaceRoot, 'CHANGELOG.rst')) {
					return 'production';
				}
				return 'stable';
			}

			return 'active-development';
		} catch (error) {
			return 'unknown';
		}
	}

	/**
	 * Check if a file exists
	 */
	private async fileExists(workspaceRoot: vscode.Uri, relativePath: string): Promise<boolean> {
		try {
			// If the path contains wildcards, we can't use simple stat
			if (relativePath.includes('*')) {
				// Use findFiles for wildcard patterns
				const files = await vscode.workspace.findFiles(
					new vscode.RelativePattern(workspaceRoot, relativePath),
					null,
					1
				);
				return files.length > 0;
			}

			const uri = vscode.Uri.joinPath(workspaceRoot, relativePath);
			await vscode.workspace.fs.stat(uri);
			return true;
		} catch {
			return false;
		}
	}
}

