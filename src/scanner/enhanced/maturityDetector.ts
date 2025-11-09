// Maturity Detector - Detects project maturity level
import * as vscode from 'vscode';

interface PackageJson {
	version?: string;
}

/**
 * Detects project maturity level based on version, changelog, and releases
 */
export class MaturityDetector {
	/**
	 * Detect maturity level
	 */
	async detect(workspaceRoot: vscode.Uri): Promise<string> {
		const version = await this.getVersion(workspaceRoot);
		const hasChangelog = await this.hasChangelog(workspaceRoot);
		const releaseCount = await this.countReleases(workspaceRoot);

		return this.calculateMaturity(version, hasChangelog, releaseCount);
	}

	/**
	 * Get version from package.json
	 */
	private async getVersion(workspaceRoot: vscode.Uri): Promise<string> {
		try {
			const packageJsonUri = vscode.Uri.joinPath(workspaceRoot, 'package.json');
			const packageJsonContent = await vscode.workspace.fs.readFile(packageJsonUri);
			const pkg: PackageJson = JSON.parse(Buffer.from(packageJsonContent).toString('utf8'));
			return pkg.version || '0.0.0';
		} catch (error) {
			return '0.0.0';
		}
	}

	/**
	 * Check if project has a CHANGELOG
	 */
	private async hasChangelog(workspaceRoot: vscode.Uri): Promise<boolean> {
		const changelogFiles = [
			'CHANGELOG.md',
			'CHANGELOG.rst',
			'CHANGELOG.txt',
			'CHANGELOG',
			'HISTORY.md',
			'RELEASES.md'
		];

		for (const file of changelogFiles) {
			if (await this.fileExists(workspaceRoot, file)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Count releases/tags (if git is available)
	 */
	private async countReleases(workspaceRoot: vscode.Uri): Promise<number> {
		// Check if .git directory exists
		try {
			const gitDir = vscode.Uri.joinPath(workspaceRoot, '.git');
			await vscode.workspace.fs.stat(gitDir);

			// For now, we'll just check if git exists
			// In a future iteration, we could execute git commands
			// to count tags, but that requires more complex logic
			return 0; // Placeholder
		} catch {
			return 0;
		}
	}

	/**
	 * Calculate maturity level based on indicators
	 */
	private calculateMaturity(version: string, hasChangelog: boolean, releaseCount: number): string {
		// Parse version
		const versionMatch = version.match(/^(\d+)\.(\d+)\.(\d+)/);
		if (!versionMatch) {
			return 'unknown';
		}

		const [, major, minor] = versionMatch;
		const majorNum = parseInt(major, 10);
		const minorNum = parseInt(minor, 10);

		// Prototype: 0.0.x
		if (majorNum === 0 && minorNum === 0) {
			return 'prototype';
		}

		// Active development: 0.x with no changelog
		if (majorNum === 0 && !hasChangelog) {
			return 'active-development';
		}

		// Active development: 0.x with changelog
		if (majorNum === 0 && hasChangelog) {
			return 'beta';
		}

		// Stable: 1.x+ with no changelog
		if (majorNum >= 1 && !hasChangelog) {
			return 'stable';
		}

		// Production: 1.x+ with changelog
		if (majorNum >= 1 && hasChangelog) {
			return 'production';
		}

		// Mature: 2.x+ with changelog
		if (majorNum >= 2 && hasChangelog) {
			return 'mature';
		}

		return 'active-development';
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
}

