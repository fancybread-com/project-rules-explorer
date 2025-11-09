// Dependency Purpose Mapper - Maps dependencies to their purposes
import * as vscode from 'vscode';
import { DependencyInfo, DependencyPurpose, EnhancedDependencies } from './types';

/**
 * Dependency purpose database
 */
const DEPENDENCY_PURPOSES: Record<string, DependencyPurpose> = {
	// Parsing
	'gray-matter': { category: 'parsing', purpose: 'Parse YAML frontmatter', critical: true },
	'yaml': { category: 'parsing', purpose: 'Parse/stringify YAML', critical: true },
	'js-yaml': { category: 'parsing', purpose: 'Parse/stringify YAML', critical: true },
	'marked': { category: 'parsing', purpose: 'Parse Markdown', critical: false },
	'markdown-it': { category: 'parsing', purpose: 'Parse Markdown', critical: false },
	'csv-parser': { category: 'parsing', purpose: 'Parse CSV files', critical: false },
	'papaparse': { category: 'parsing', purpose: 'Parse CSV files', critical: false },
	'xml2js': { category: 'parsing', purpose: 'Parse XML', critical: false },
	'fast-xml-parser': { category: 'parsing', purpose: 'Parse XML (fast)', critical: false },

	// Testing
	'mocha': { category: 'testing', purpose: 'Test runner', critical: false },
	'jest': { category: 'testing', purpose: 'Test framework', critical: false },
	'vitest': { category: 'testing', purpose: 'Fast test framework', critical: false },
	'@vitest/ui': { category: 'testing', purpose: 'Visual test runner', critical: false },
	'cypress': { category: 'testing', purpose: 'E2E testing', critical: false },
	'playwright': { category: 'testing', purpose: 'E2E testing', critical: false },
	'@vscode/test-electron': { category: 'testing', purpose: 'VS Code extension testing', critical: false },
	'chai': { category: 'testing', purpose: 'Assertion library', critical: false },
	'sinon': { category: 'testing', purpose: 'Test spies/stubs/mocks', critical: false },

	// Linting/Quality
	'eslint': { category: 'code-quality', purpose: 'Code linting', critical: false },
	'prettier': { category: 'code-quality', purpose: 'Code formatting', critical: false },
	'stylelint': { category: 'code-quality', purpose: 'CSS linting', critical: false },
	'@typescript-eslint/parser': { category: 'code-quality', purpose: 'TypeScript ESLint parser', critical: false },
	'@typescript-eslint/eslint-plugin': { category: 'code-quality', purpose: 'TypeScript ESLint rules', critical: false },

	// VS Code Platform
	'vscode': { category: 'platform', purpose: 'VS Code API', critical: true },
	'@types/vscode': { category: 'platform', purpose: 'VS Code API types', critical: true },

	// Build Tools
	'typescript': { category: 'build', purpose: 'Type checking and compilation', critical: true },
	'webpack': { category: 'build', purpose: 'Module bundling', critical: false },
	'vite': { category: 'build', purpose: 'Fast build tool', critical: false },
	'rollup': { category: 'build', purpose: 'Module bundler', critical: false },
	'esbuild': { category: 'build', purpose: 'Fast JavaScript bundler', critical: false },
	'parcel': { category: 'build', purpose: 'Zero-config bundler', critical: false },
	'@vscode/vsce': { category: 'build', purpose: 'VS Code extension packaging', critical: false },

	// Utility Libraries
	'lodash': { category: 'utility', purpose: 'Utility functions', critical: false },
	'underscore': { category: 'utility', purpose: 'Utility functions', critical: false },
	'ramda': { category: 'utility', purpose: 'Functional programming utilities', critical: false },
	'date-fns': { category: 'utility', purpose: 'Date manipulation', critical: false },
	'moment': { category: 'utility', purpose: 'Date manipulation', critical: false },
	'dayjs': { category: 'utility', purpose: 'Date manipulation (lightweight)', critical: false },

	// HTTP Clients
	'axios': { category: 'http', purpose: 'HTTP client', critical: true },
	'node-fetch': { category: 'http', purpose: 'Fetch API for Node.js', critical: true },
	'got': { category: 'http', purpose: 'HTTP client', critical: true },
	'superagent': { category: 'http', purpose: 'HTTP client', critical: true },

	// Web Frameworks
	'express': { category: 'framework', purpose: 'Web server framework', critical: true },
	'fastify': { category: 'framework', purpose: 'Fast web framework', critical: true },
	'koa': { category: 'framework', purpose: 'Web framework', critical: true },
	'react': { category: 'framework', purpose: 'UI library', critical: true },
	'react-dom': { category: 'framework', purpose: 'React DOM rendering', critical: true },
	'vue': { category: 'framework', purpose: 'Progressive framework', critical: true },
	'@angular/core': { category: 'framework', purpose: 'Angular framework', critical: true },
	'next': { category: 'framework', purpose: 'React framework', critical: true },
	'nuxt': { category: 'framework', purpose: 'Vue framework', critical: true },
	'svelte': { category: 'framework', purpose: 'Compiler framework', critical: true },
};

interface PackageJson {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
}

/**
 * Maps dependencies to their purposes
 */
export class DependencyPurposeMapper {
	/**
	 * Map dependencies with purposes
	 */
	async map(workspaceRoot: vscode.Uri): Promise<EnhancedDependencies> {
		const packageJsonData = await this.readPackageJson(workspaceRoot);
		if (!packageJsonData) {
			return this.getEmptyDependencies();
		}

		const allDeps = {
			...packageJsonData.dependencies,
			...packageJsonData.devDependencies
		};

		const byPurpose: EnhancedDependencies['byPurpose'] = {
			parsing: [],
			testing: [],
			build: [],
			platform: [],
			'code-quality': [],
			utility: [],
			http: [],
			framework: []
		};

		const devOnlyDeps = new Set(Object.keys(packageJsonData.devDependencies || {}));
		const criticalPath: string[] = [];

		// Map each dependency
		for (const [name, version] of Object.entries(allDeps)) {
			const purpose = DEPENDENCY_PURPOSES[name];

			if (purpose) {
				const depInfo: DependencyInfo = {
					name,
					version,
					purpose: purpose.purpose,
					critical: purpose.critical
				};

				// Add to appropriate category
				const category = purpose.category as keyof typeof byPurpose;
				if (byPurpose[category]) {
					byPurpose[category].push(depInfo);
				}

				// Add to critical path if critical and not dev-only
				if (purpose.critical && !devOnlyDeps.has(name)) {
					criticalPath.push(name);
				}
			}
		}

		return {
			byPurpose,
			criticalPath,
			devOnly: Array.from(devOnlyDeps)
		};
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

	/**
	 * Get empty dependencies structure
	 */
	private getEmptyDependencies(): EnhancedDependencies {
		return {
			byPurpose: {
				parsing: [],
				testing: [],
				build: [],
				platform: [],
				'code-quality': [],
				utility: [],
				http: [],
				framework: []
			},
			criticalPath: [],
			devOnly: []
		};
	}
}

