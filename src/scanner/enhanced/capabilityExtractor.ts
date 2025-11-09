// Capability Extractor - Extracts project capabilities from README and package.json
import * as vscode from 'vscode';
import { ProjectCapabilities } from './types';

interface PackageJson {
	description?: string;
	keywords?: string[];
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
}

/**
 * Extracts project capabilities and features
 */
export class CapabilityExtractor {
	/**
	 * Extract project capabilities
	 */
	async extract(workspaceRoot: vscode.Uri): Promise<ProjectCapabilities> {
		const description = await this.extractDescription(workspaceRoot);
		const primaryFeatures = await this.extractPrimaryFeatures(workspaceRoot);
		const dataFormats = await this.detectDataFormats(workspaceRoot);

		return {
			description,
			primaryFeatures,
			dataFormats
		};
	}

	/**
	 * Extract description from README or package.json
	 */
	private async extractDescription(workspaceRoot: vscode.Uri): Promise<string> {
		// Try package.json first
		try {
			const packageJsonUri = vscode.Uri.joinPath(workspaceRoot, 'package.json');
			const packageJsonContent = await vscode.workspace.fs.readFile(packageJsonUri);
			const pkg: PackageJson = JSON.parse(Buffer.from(packageJsonContent).toString('utf8'));

			if (pkg.description && pkg.description.trim().length > 0) {
				return pkg.description.trim();
			}
		} catch (error) {
			// Continue to README
		}

		// Try README.md
		try {
			const readmeUri = vscode.Uri.joinPath(workspaceRoot, 'README.md');
			const readmeContent = await vscode.workspace.fs.readFile(readmeUri);
			const readme = Buffer.from(readmeContent).toString('utf8');

			// Extract the first paragraph after the title
			const lines = readme.split('\n');
			let foundTitle = false;
			const descriptionLines: string[] = [];

			for (const line of lines) {
				const trimmed = line.trim();

				// Skip title
				if (trimmed.startsWith('#')) {
					foundTitle = true;
					continue;
				}

				// Skip empty lines before description
				if (!foundTitle || trimmed.length === 0) {
					continue;
				}

				// Stop at next heading or horizontal rule
				if (trimmed.startsWith('#') || trimmed.startsWith('---') || trimmed.startsWith('***')) {
					break;
				}

				descriptionLines.push(trimmed);

				// Stop after a good paragraph (at least 50 chars)
				if (descriptionLines.join(' ').length > 50 && trimmed.length === 0) {
					break;
				}
			}

			const description = descriptionLines.join(' ').trim();
			if (description.length > 0) {
				// Limit to first 200 characters
				return description.substring(0, 200);
			}
		} catch (error) {
			// No README found
		}

		return 'No description available';
	}

	/**
	 * Extract primary features from README
	 */
	private async extractPrimaryFeatures(workspaceRoot: vscode.Uri): Promise<string[]> {
		const features: string[] = [];

		try {
			const readmeUri = vscode.Uri.joinPath(workspaceRoot, 'README.md');
			const readmeContent = await vscode.workspace.fs.readFile(readmeUri);
			const readme = Buffer.from(readmeContent).toString('utf8');

			const lines = readme.split('\n');
			let inFeaturesSection = false;

			for (const line of lines) {
				const trimmed = line.trim();

				// Look for features section
				if (trimmed.match(/^##?\s+(Features|Capabilities|What it does|Key Features)/i)) {
					inFeaturesSection = true;
					continue;
				}

				// Stop at next major section
				if (inFeaturesSection && trimmed.match(/^##\s+/)) {
					break;
				}

				// Extract bullet points in features section
				if (inFeaturesSection) {
					// Match bullet points: -, *, +, or numbered lists
					const match = trimmed.match(/^[-*+]\s+(.+)$/) || trimmed.match(/^\d+\.\s+(.+)$/);
					if (match) {
						let feature = match[1].trim();
						// Remove markdown formatting
						feature = feature.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Remove links
						feature = feature.replace(/[*_`]/g, ''); // Remove bold, italic, code
						features.push(feature);

						// Limit to 5 features
						if (features.length >= 5) {
							break;
						}
					}
				}
			}
		} catch (error) {
			// No README or error parsing
		}

		return features;
	}

	/**
	 * Detect data formats from dependencies
	 */
	private async detectDataFormats(workspaceRoot: vscode.Uri): Promise<string[]> {
		const formats = new Set<string>();

		try {
			const packageJsonUri = vscode.Uri.joinPath(workspaceRoot, 'package.json');
			const packageJsonContent = await vscode.workspace.fs.readFile(packageJsonUri);
			const pkg: PackageJson = JSON.parse(Buffer.from(packageJsonContent).toString('utf8'));

			const deps = { ...pkg.dependencies, ...pkg.devDependencies };

			// JSON (always available in Node.js)
			formats.add('JSON');

			// YAML
			if (deps['yaml'] || deps['js-yaml'] || deps['gray-matter']) {
				formats.add('YAML');
			}

			// MDC (custom format with frontmatter)
			if (deps['gray-matter']) {
				formats.add('MDC');
			}

			// Markdown
			if (deps['marked'] || deps['markdown-it'] || deps['remark']) {
				formats.add('Markdown');
			}

			// CSV
			if (deps['csv-parser'] || deps['papaparse']) {
				formats.add('CSV');
			}

			// XML
			if (deps['xml2js'] || deps['fast-xml-parser']) {
				formats.add('XML');
			}

			// TOML
			if (deps['toml'] || deps['@iarna/toml']) {
				formats.add('TOML');
			}

			// Protocol Buffers
			if (deps['protobufjs']) {
				formats.add('Protocol Buffers');
			}

			// GraphQL
			if (deps['graphql']) {
				formats.add('GraphQL');
			}
		} catch (error) {
			// No package.json or error parsing
		}

		return Array.from(formats);
	}
}

