// Enhanced Node.js Parser - Parse package.json with version detection
import * as vscode from 'vscode';
import { NodeProjectInfo, FrameworkPatterns, CloudSDKPatterns } from '../types';

/**
 * Enhanced parser for Node.js/JavaScript projects
 */
export class NodeParser {
	/**
	 * Parse enhanced Node.js project information
	 */
	async parseProject(workspaceRoot: vscode.Uri): Promise<NodeProjectInfo | null> {
		try {
			const packageJsonUri = vscode.Uri.joinPath(workspaceRoot, 'package.json');
			const content = await vscode.workspace.fs.readFile(packageJsonUri);
			const packageJson = JSON.parse(Buffer.from(content).toString('utf8'));

			const projectInfo: NodeProjectInfo = {
				name: packageJson.name,
				version: packageJson.version,
				engines: packageJson.engines || {},
				frameworks: [],
				cloudSDKs: [],
				testingFrameworks: []
			};

			// Detect frameworks from dependencies
			const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
			this.detectFrameworks(allDeps, projectInfo);
			this.detectCloudSDKs(allDeps, projectInfo);
			this.detectTestingFrameworks(allDeps, projectInfo);

			return projectInfo;
		} catch (error) {
			// Silently fail if package.json doesn't exist or can't be parsed
			return null;
		}
	}

	/**
	 * Detect frameworks from dependencies
	 */
	private detectFrameworks(dependencies: Record<string, string>, projectInfo: NodeProjectInfo): void {
		for (const [depName, depVersion] of Object.entries(dependencies)) {
			const lowerName = depName.toLowerCase();

			// Detect React
			if (FrameworkPatterns.react.some(pattern => lowerName.includes(pattern.toLowerCase()))) {
				if (!projectInfo.frameworks.includes('React')) {
					projectInfo.frameworks.push('React');
				}
			}

			// Detect Vue
			if (FrameworkPatterns.vue.some(pattern => lowerName.includes(pattern.toLowerCase()))) {
				if (!projectInfo.frameworks.includes('Vue')) {
					projectInfo.frameworks.push('Vue');
				}
			}

			// Detect Angular
			if (FrameworkPatterns.angular.some(pattern => lowerName.includes(pattern.toLowerCase()))) {
				if (!projectInfo.frameworks.includes('Angular')) {
					projectInfo.frameworks.push('Angular');
				}
			}

			// Detect Express
			if (FrameworkPatterns.express.some(pattern => lowerName.includes(pattern.toLowerCase()))) {
				if (!projectInfo.frameworks.includes('Express')) {
					projectInfo.frameworks.push('Express');
				}
			}

			// Detect Fastify
			if (FrameworkPatterns.fastify.some(pattern => lowerName.includes(pattern.toLowerCase()))) {
				if (!projectInfo.frameworks.includes('Fastify')) {
					projectInfo.frameworks.push('Fastify');
				}
			}

			// Detect Koa
			if (FrameworkPatterns.koa.some(pattern => lowerName.includes(pattern.toLowerCase()))) {
				if (!projectInfo.frameworks.includes('Koa')) {
					projectInfo.frameworks.push('Koa');
				}
			}

			// Detect Next.js
			if (lowerName === 'next') {
				projectInfo.frameworks.push('Next.js');
			}

			// Detect Nuxt.js
			if (lowerName === 'nuxt') {
				projectInfo.frameworks.push('Nuxt.js');
			}
		}
	}

	/**
	 * Detect cloud SDKs from dependencies
	 */
	private detectCloudSDKs(dependencies: Record<string, string>, projectInfo: NodeProjectInfo): void {
		for (const [depName] of Object.entries(dependencies)) {
			const lowerName = depName.toLowerCase();

			// Detect AWS SDK
			if (CloudSDKPatterns.aws.some(pattern => lowerName.includes(pattern.toLowerCase()))) {
				if (!projectInfo.cloudSDKs.includes('AWS SDK')) {
					projectInfo.cloudSDKs.push('AWS SDK');
				}
			}

			// Detect Azure SDK
			if (CloudSDKPatterns.azure.some(pattern => lowerName.includes(pattern.toLowerCase()))) {
				if (!projectInfo.cloudSDKs.includes('Azure SDK')) {
					projectInfo.cloudSDKs.push('Azure SDK');
				}
			}

			// Detect Google Cloud SDK
			if (CloudSDKPatterns.gcp.some(pattern => lowerName.includes(pattern.toLowerCase()))) {
				if (!projectInfo.cloudSDKs.includes('Google Cloud SDK')) {
					projectInfo.cloudSDKs.push('Google Cloud SDK');
				}
			}
		}
	}

	/**
	 * Detect testing frameworks from dependencies
	 */
	private detectTestingFrameworks(dependencies: Record<string, string>, projectInfo: NodeProjectInfo): void {
		for (const [depName] of Object.entries(dependencies)) {
			const lowerName = depName.toLowerCase();

			// Detect Jest
			if (lowerName.includes('jest')) {
				if (!projectInfo.testingFrameworks.includes('Jest')) {
					projectInfo.testingFrameworks.push('Jest');
				}
			}

			// Detect Mocha
			if (lowerName === 'mocha') {
				if (!projectInfo.testingFrameworks.includes('Mocha')) {
					projectInfo.testingFrameworks.push('Mocha');
				}
			}

			// Detect Jasmine
			if (lowerName === 'jasmine' || lowerName === 'jasmine-core') {
				if (!projectInfo.testingFrameworks.includes('Jasmine')) {
					projectInfo.testingFrameworks.push('Jasmine');
				}
			}

			// Detect Vitest
			if (lowerName === 'vitest') {
				if (!projectInfo.testingFrameworks.push('Vitest')) {
					projectInfo.testingFrameworks.push('Vitest');
				}
			}

			// Detect Cypress
			if (lowerName === 'cypress') {
				if (!projectInfo.testingFrameworks.includes('Cypress')) {
					projectInfo.testingFrameworks.push('Cypress');
				}
			}

			// Detect Playwright
			if (lowerName === 'playwright') {
				if (!projectInfo.testingFrameworks.includes('Playwright')) {
					projectInfo.testingFrameworks.push('Playwright');
				}
			}
		}
	}
}

