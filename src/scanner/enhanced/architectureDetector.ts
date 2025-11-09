// Architecture Detector - Detects project architecture patterns
import * as vscode from 'vscode';
import { EnhancedArchitecture } from './types';

/**
 * Detects project architecture patterns
 */
export class ArchitectureDetector {
	/**
	 * Detect architecture
	 */
	async detect(workspaceRoot: vscode.Uri): Promise<EnhancedArchitecture> {
		const structure = await this.analyzeStructure(workspaceRoot);
		const patterns = await this.detectPatterns(workspaceRoot);
		const entryPoints = await this.findEntryPoints(workspaceRoot);

		return {
			style: structure.style,
			organization: structure.type,
			patterns,
			entryPoints
		};
	}

	/**
	 * Analyze directory structure
	 */
	private async analyzeStructure(workspaceRoot: vscode.Uri): Promise<{ type: string; style: string }> {
		// Check for src directory
		if (!await this.directoryExists(workspaceRoot, 'src')) {
			return { type: 'flat', style: 'simple' };
		}

		// Check for component-oriented structure (React/Vue/Angular)
		if (await this.hasSubdirs(workspaceRoot, 'src', ['components', 'pages', 'layouts'])) {
			return { type: 'feature-based', style: 'component-oriented' };
		}

		// Check for MVC structure (traditional web apps)
		if (await this.hasSubdirs(workspaceRoot, 'src', ['controllers', 'models', 'views'])) {
			return { type: 'mvc', style: 'layered' };
		}

		// Check for service-oriented structure (VS Code extensions, microservices)
		if (await this.hasSubdirs(workspaceRoot, 'src', ['providers', 'services', 'commands'])) {
			return { type: 'service-oriented', style: 'layered' };
		}

		// Check for common VS Code extension structure
		if (await this.hasSubdirs(workspaceRoot, 'src', ['scanner', 'providers'])) {
			return { type: 'feature-based', style: 'modular' };
		}

		return { type: 'src-based', style: 'modular' };
	}

	/**
	 * Detect design patterns with detailed descriptions
	 */
	private async detectPatterns(workspaceRoot: vscode.Uri): Promise<string[]> {
		const patterns: string[] = [];

		// Provider Pattern - Common in VS Code extensions for tree views
		if (await this.hasFilePattern(workspaceRoot, '**/provider*.ts') ||
		    await this.hasFilePattern(workspaceRoot, '**/providers/**/*.ts')) {
			const providerDetails = await this.getProviderDetails(workspaceRoot);
			patterns.push(`Provider Pattern${providerDetails}`);
		}

		// Command Pattern - Encapsulates operations as objects
		if (await this.hasFilePattern(workspaceRoot, '**/command*.ts') ||
		    await this.hasFilePattern(workspaceRoot, '**/commands/**/*.ts')) {
			const commandDetails = await this.getCommandDetails(workspaceRoot);
			patterns.push(`Command Pattern${commandDetails}`);
		}

		// Factory Pattern - Creates objects without specifying exact classes
		if (await this.hasFilePattern(workspaceRoot, '**/factory*.ts')) {
			patterns.push('Factory Pattern (object creation abstraction)');
		}

		// Singleton Pattern - Ensures single instance
		if (await this.hasFilePattern(workspaceRoot, '**/singleton*.ts')) {
			patterns.push('Singleton Pattern (single instance management)');
		}

		// Observer Pattern - Event-driven communication
		if (await this.hasFilePattern(workspaceRoot, '**/observer*.ts')) {
			patterns.push('Observer Pattern (event-driven notifications)');
		}

		// Adapter Pattern - Interface translation
		if (await this.hasFilePattern(workspaceRoot, '**/adapter*.ts')) {
			patterns.push('Adapter Pattern (interface compatibility)');
		}

		// Builder Pattern - Step-by-step object construction
		if (await this.hasFilePattern(workspaceRoot, '**/builder*.ts')) {
			patterns.push('Builder Pattern (fluent object construction)');
		}

		// Strategy Pattern - Interchangeable algorithms
		if (await this.hasFilePattern(workspaceRoot, '**/strategy*.ts')) {
			patterns.push('Strategy Pattern (pluggable algorithms)');
		}

		// Middleware Pattern - Request/response pipeline
		if (await this.directoryExists(workspaceRoot, 'src/middleware')) {
			patterns.push('Middleware Pattern (request/response processing pipeline)');
		}

		// Decorator Pattern - Dynamic behavior addition
		if (await this.directoryExists(workspaceRoot, 'src/decorators')) {
			patterns.push('Decorator Pattern (runtime behavior enhancement)');
		}

		// Repository Pattern - Data access abstraction
		if (await this.hasFilePattern(workspaceRoot, '**/repository*.ts') ||
		    await this.directoryExists(workspaceRoot, 'src/repositories')) {
			patterns.push('Repository Pattern (data access abstraction)');
		}

		// Service Layer Pattern - Business logic encapsulation
		if (await this.directoryExists(workspaceRoot, 'src/services')) {
			patterns.push('Service Layer Pattern (business logic encapsulation)');
		}

		return patterns;
	}

	/**
	 * Get provider-specific details
	 */
	private async getProviderDetails(workspaceRoot: vscode.Uri): Promise<string> {
		const details: string[] = [];

		if (await this.hasFilePattern(workspaceRoot, '**/treeDataProvider*.ts')) {
			details.push('tree views');
		}
		if (await this.hasFilePattern(workspaceRoot, '**/completionProvider*.ts')) {
			details.push('code completion');
		}
		if (await this.hasFilePattern(workspaceRoot, '**/hoverProvider*.ts')) {
			details.push('hover tooltips');
		}

		return details.length > 0 ? ` (for ${details.join(', ')})` : ' (data/service providers)';
	}

	/**
	 * Get command-specific details
	 */
	private async getCommandDetails(workspaceRoot: vscode.Uri): Promise<string> {
		// Check if commands directory has multiple command files
		try {
			const commandFiles = await vscode.workspace.findFiles(
				new vscode.RelativePattern(workspaceRoot, '**/commands/**/*.ts'),
				'**/node_modules/**',
				10
			);
			if (commandFiles.length > 3) {
				return ' (encapsulated operations with multiple command handlers)';
			}
		} catch {
			// Ignore errors
		}
		return ' (encapsulated operations)';
	}

	/**
	 * Find entry points
	 */
	private async findEntryPoints(workspaceRoot: vscode.Uri): Promise<string[]> {
		const candidates = [
			'src/extension.ts',   // VS Code
			'src/index.ts',       // Common
			'src/main.ts',        // Common
			'src/app.ts',         // Web app
			'src/server.ts',      // API server
			'index.ts',
			'main.ts',
			'app.ts',
			'server.ts'
		];

		const entryPoints: string[] = [];

		for (const candidate of candidates) {
			if (await this.fileExists(workspaceRoot, candidate)) {
				entryPoints.push(candidate);
			}
		}

		return entryPoints;
	}

	/**
	 * Check if directory has specific subdirectories
	 */
	private async hasSubdirs(workspaceRoot: vscode.Uri, parent: string, subdirs: string[]): Promise<boolean> {
		let foundCount = 0;
		for (const subdir of subdirs) {
			if (await this.directoryExists(workspaceRoot, `${parent}/${subdir}`)) {
				foundCount++;
			}
		}
		// Require at least 2 of the subdirectories to exist
		return foundCount >= 2;
	}

	/**
	 * Check if a file pattern exists
	 */
	private async hasFilePattern(workspaceRoot: vscode.Uri, pattern: string): Promise<boolean> {
		try {
			const files = await vscode.workspace.findFiles(
				new vscode.RelativePattern(workspaceRoot, pattern),
				'**/node_modules/**',
				1
			);
			return files.length > 0;
		} catch {
			return false;
		}
	}

	/**
	 * Check if a file exists
	 */
	private async fileExists(workspaceRoot: vscode.Uri, relativePath: string): Promise<boolean> {
		try {
			const uri = vscode.Uri.joinPath(workspaceRoot, relativePath);
			await vscode.workspace.fs.stat(uri);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Check if a directory exists
	 */
	private async directoryExists(workspaceRoot: vscode.Uri, relativePath: string): Promise<boolean> {
		try {
			const uri = vscode.Uri.joinPath(workspaceRoot, relativePath);
			const stat = await vscode.workspace.fs.stat(uri);
			return stat.type === vscode.FileType.Directory;
		} catch {
			return false;
		}
	}
}

