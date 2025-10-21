// MDC Parser - Parse and generate MDC format files
import * as vscode from 'vscode';
import matter from 'gray-matter';
import { RuleMetadata } from '../scanner/rulesScanner';

export class MDCParser {
	static async parseMDC(uri: vscode.Uri): Promise<{ metadata: RuleMetadata; content: string }> {
		try {
			const content = await vscode.workspace.fs.readFile(uri);
			const text = Buffer.from(content).toString('utf8');

			// Parse frontmatter using gray-matter
			const parsed = matter(text);

			// Extract metadata with defaults
			const metadata: RuleMetadata = {
				type: parsed.data.type || 'manual',
				description: parsed.data.description || 'No description',
				globs: parsed.data.globs || [],
				alwaysApply: parsed.data.alwaysApply || false
			};

			return {
				metadata,
				content: parsed.content.trim()
			};
		} catch (error) {
			console.error('Error parsing MDC file:', error);
			// Return default metadata if parsing fails
			return {
				metadata: {
					type: 'manual',
					description: 'Error parsing file'
				},
				content: 'Error reading file content'
			};
		}
	}

	static generateMDC(metadata: RuleMetadata, content: string): string {
		// Create frontmatter object
		const frontmatter: any = {
			type: metadata.type,
			description: metadata.description
		};

		// Add optional fields if they exist
		if (metadata.globs && metadata.globs.length > 0) {
			frontmatter.globs = metadata.globs;
		}

		if (metadata.alwaysApply !== undefined) {
			frontmatter.alwaysApply = metadata.alwaysApply;
		}

		// Generate MDC format using gray-matter
		return matter.stringify(content, frontmatter);
	}

	static validateMDC(text: string): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		try {
			const parsed = matter(text);

			// Check required fields
			if (!parsed.data.type) {
				errors.push('Missing required field: type');
			} else if (!['always', 'auto', 'agent', 'manual'].includes(parsed.data.type)) {
				errors.push('Invalid type. Must be one of: always, auto, agent, manual');
			}

			if (!parsed.data.description) {
				errors.push('Missing required field: description');
			}

			// Check optional fields
			if (parsed.data.globs && !Array.isArray(parsed.data.globs)) {
				errors.push('globs must be an array');
			}

			if (parsed.data.alwaysApply && typeof parsed.data.alwaysApply !== 'boolean') {
				errors.push('alwaysApply must be a boolean');
			}

			return {
				valid: errors.length === 0,
				errors
			};
		} catch (error) {
			return {
				valid: false,
				errors: [`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`]
			};
		}
	}
}
