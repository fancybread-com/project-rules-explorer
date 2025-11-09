// Agent Guidance Generator - Generates actionable guidance for AI agents
import { EnhancedProjectState, AgentGuidance } from './types';

/**
 * Generates AI agent guidance based on project state
 */
export class AgentGuidanceGenerator {
	/**
	 * Generate agent guidance
	 */
	generate(state: Partial<EnhancedProjectState>): AgentGuidance {
		const suggestedApproach = this.generateApproach(state);
		const criticalFiles = this.identifyCriticalFiles(state);
		const commonTasks = this.identifyCommonTasks(state);
		const watchOuts = this.generateWatchOuts(state);

		return {
			suggestedApproach,
			criticalFiles,
			commonTasks,
			watchOuts
		};
	}

	/**
	 * Generate suggested approach based on project type
	 */
	private generateApproach(state: Partial<EnhancedProjectState>): string {
		const type = state.identity?.projectType || 'unknown';

		switch (type) {
			case 'vscode-extension':
				return 'This is a VS Code extension. Modifications should maintain VS Code API compatibility, properly dispose resources, and follow extension development best practices. Use vscode.workspace.fs for file operations and register all disposables.';

			case 'web-app':
				return 'This is a web application. Consider component reusability, state management patterns, and browser compatibility. Ensure proper error boundaries and accessibility compliance.';

			case 'library':
				return 'This is a library. Maintain backwards compatibility, consider API stability, and ensure comprehensive testing. Document all public APIs thoroughly and follow semantic versioning.';

			case 'cli-tool':
				return 'This is a CLI tool. Focus on clear error messages, proper exit codes, and good help documentation. Handle input validation and provide meaningful feedback.';

			case 'api-server':
				return 'This is an API server. Follow REST/GraphQL best practices, implement proper error handling, validate inputs, and ensure secure authentication. Use middleware for cross-cutting concerns.';

			default:
				return 'Standard application development practices apply. Follow the existing code style and architecture patterns.';
		}
	}

	/**
	 * Identify critical files
	 */
	private identifyCriticalFiles(state: Partial<EnhancedProjectState>): string[] {
		const critical: string[] = [];

		// Always critical
		critical.push('package.json');

		// Entry points
		if (state.architecture?.entryPoints) {
			critical.push(...state.architecture.entryPoints);
		}

		// VS Code specific
		if (state.platformContext?.vscode) {
			critical.push('src/extension.ts');

			// Add provider files if they exist
			if (state.platformContext.vscode.contributes.views > 0) {
				critical.push('src/providers/**/*.ts');
			}
		}

		// Configuration files
		if (state.identity?.projectType === 'vscode-extension') {
			critical.push('package.json (contributes section)');
		}

		// Test files if testing is set up
		if (state.dependencies?.byPurpose.testing && state.dependencies.byPurpose.testing.length > 0) {
			critical.push('test/**/*.test.ts');
		}

		return critical;
	}

	/**
	 * Identify common tasks
	 */
	private identifyCommonTasks(state: Partial<EnhancedProjectState>): string[] {
		const tasks: string[] = [];
		const type = state.identity?.projectType || 'unknown';

		if (type === 'vscode-extension') {
			tasks.push('Adding new commands');
			tasks.push('Enhancing tree view functionality');
			tasks.push('Adding configuration options');
			tasks.push('Implementing context menus');
		}

		if (type === 'web-app') {
			tasks.push('Adding new components');
			tasks.push('Implementing new routes/pages');
			tasks.push('Updating styles and themes');
			tasks.push('Adding state management');
		}

		if (type === 'api-server') {
			tasks.push('Adding new API endpoints');
			tasks.push('Implementing middleware');
			tasks.push('Adding authentication/authorization');
			tasks.push('Database migrations');
		}

		if (type === 'library') {
			tasks.push('Adding new API methods');
			tasks.push('Writing documentation');
			tasks.push('Adding examples');
			tasks.push('Performance optimization');
		}

		// Common to most projects
		if (state.dependencies?.byPurpose.testing && state.dependencies.byPurpose.testing.length > 0) {
			tasks.push('Writing tests');
		}

		if (state.capabilities?.primaryFeatures && state.capabilities.primaryFeatures.length > 0) {
			tasks.push('Enhancing existing features');
		}

		return tasks;
	}

	/**
	 * Generate warnings and watch-outs
	 */
	private generateWatchOuts(state: Partial<EnhancedProjectState>): string[] {
		const warnings: string[] = [];
		const type = state.identity?.projectType || 'unknown';
		const maturity = state.identity?.maturityLevel || 'unknown';

		// Project type specific warnings
		if (type === 'vscode-extension') {
			warnings.push('Dispose resources properly in deactivate()');
			warnings.push('Use vscode.workspace.fs for file operations');
			warnings.push('Test with various workspace configurations');
			warnings.push('Register all commands in package.json');
			warnings.push('Avoid blocking the main thread');
		}

		if (type === 'web-app') {
			warnings.push('Ensure proper error boundaries');
			warnings.push('Consider accessibility (a11y) requirements');
			warnings.push('Test on multiple browsers');
			warnings.push('Optimize bundle size');
		}

		if (type === 'api-server') {
			warnings.push('Validate all user inputs');
			warnings.push('Implement proper error handling');
			warnings.push('Secure sensitive endpoints');
			warnings.push('Rate limit API calls');
		}

		// Maturity level warnings
		if (maturity === 'production' || maturity === 'mature') {
			warnings.push('This is a production project - maintain backwards compatibility');
			warnings.push('Breaking changes require major version bump');
			warnings.push('Update CHANGELOG for all changes');
		}

		if (maturity === 'prototype') {
			warnings.push('This is a prototype - major refactoring may be needed');
		}

		// Critical dependencies warning
		if (state.dependencies?.criticalPath && state.dependencies.criticalPath.length > 0) {
			const critical = state.dependencies.criticalPath.slice(0, 3).join(', ');
			warnings.push(`Critical dependencies: ${critical} - changes may break core functionality`);
		}

		// Security warnings
		if (state.platformContext?.vscode) {
			warnings.push('Be cautious with workspace.fs.readFile - validate paths to prevent directory traversal');
			warnings.push('Sanitize user inputs before displaying in UI');
		}

		return warnings;
	}
}

