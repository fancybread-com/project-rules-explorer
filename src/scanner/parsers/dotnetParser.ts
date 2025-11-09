// .NET Project Parser - Parse .csproj, .sln, .fsproj files
import * as vscode from 'vscode';
import * as path from 'path';
import { DotNetProjectInfo, PackageReference, ParserResult } from '../types';

/**
 * Parser for .NET project files
 */
export class DotNetParser {
	/**
	 * Parse .NET projects in the workspace
	 */
	async parseProjects(workspaceRoot: vscode.Uri): Promise<ParserResult<DotNetProjectInfo[]>> {
		const errors: string[] = [];
		const projects: DotNetProjectInfo[] = [];

		try {
			// Find all .csproj and .fsproj files
			const projectFiles = await this.findProjectFiles(workspaceRoot);

			for (const projectFile of projectFiles) {
				try {
					const projectInfo = await this.parseProjectFile(projectFile);
					if (projectInfo) {
						projects.push(projectInfo);
					}
				} catch (error) {
					errors.push(`Failed to parse ${path.basename(projectFile.fsPath)}: ${error}`);
				}
			}
		} catch (error) {
			errors.push(`Failed to scan for .NET projects: ${error}`);
		}

		return {
			success: errors.length === 0,
			data: projects,
			errors
		};
	}

	/**
	 * Find all .NET project files in workspace
	 */
	private async findProjectFiles(workspaceRoot: vscode.Uri): Promise<vscode.Uri[]> {
		const projectFiles: vscode.Uri[] = [];

		try {
			const files = await vscode.workspace.fs.readDirectory(workspaceRoot);

			for (const [name, type] of files) {
				// Skip node_modules, .git, bin, obj directories
				if (type === vscode.FileType.Directory &&
					['node_modules', '.git', 'bin', 'obj', '.vs', '.idea'].includes(name)) {
					continue;
				}

				const uri = vscode.Uri.joinPath(workspaceRoot, name);

				if (type === vscode.FileType.File && name.endsWith('.csproj') || name.endsWith('.fsproj')) {
					projectFiles.push(uri);
				} else if (type === vscode.FileType.Directory) {
					// Recursively search subdirectories
					const subFiles = await this.searchDirectory(uri);
					projectFiles.push(...subFiles);
				}
			}
		} catch (error) {
			// If readDirectory fails, try to find project files with glob pattern
			// This is a fallback for when the directory is too large
		}

		return projectFiles;
	}

	/**
	 * Recursively search directory for project files
	 */
	private async searchDirectory(dir: vscode.Uri): Promise<vscode.Uri[]> {
		const projectFiles: vscode.Uri[] = [];

		try {
			// Limit depth to avoid excessive recursion
			const files = await vscode.workspace.fs.readDirectory(dir);

			for (const [name, type] of files) {
				// Skip common ignore directories
				if (type === vscode.FileType.Directory &&
					['node_modules', '.git', 'bin', 'obj', '.vs', '.idea', 'packages', 'node_modules'].includes(name)) {
					continue;
				}

				if (type === vscode.FileType.File && (name.endsWith('.csproj') || name.endsWith('.fsproj'))) {
					projectFiles.push(vscode.Uri.joinPath(dir, name));
				}
			}
		} catch (error) {
			// Silently ignore errors for subdirectories
		}

		return projectFiles;
	}

	/**
	 * Parse a single .NET project file
	 */
	private async parseProjectFile(uri: vscode.Uri): Promise<DotNetProjectInfo | null> {
		const content = await vscode.workspace.fs.readFile(uri);
		const text = Buffer.from(content).toString('utf8');

		const projectInfo: DotNetProjectInfo = {
			packages: [],
			isTestProject: false,
			isWebProject: false
		};

		// Check if this is a test project by filename or content
		const fileName = path.basename(uri.fsPath);
		projectInfo.isTestProject = fileName.toLowerCase().includes('test') ||
									 fileName.toLowerCase().includes('spec');

		// Parse XML content manually (simple regex-based parsing)
		// For production, consider using a proper XML parser

		// Extract TargetFramework or TargetFrameworks
		const targetFrameworkMatch = text.match(/<TargetFramework>(.*?)<\/TargetFramework>/s);
		if (targetFrameworkMatch) {
			projectInfo.targetFramework = targetFrameworkMatch[1].trim();
		}

		const targetFrameworksMatch = text.match(/<TargetFrameworks>(.*?)<\/TargetFrameworks>/s);
		if (targetFrameworksMatch) {
			projectInfo.targetFrameworks = targetFrameworksMatch[1].trim().split(';');
		}

		// Detect SDK type
		const sdkMatch = text.match(/Sdk=["'](.*?)["']/);
		if (sdkMatch) {
			projectInfo.sdk = sdkMatch[1];
		}

		// Detect web project
		projectInfo.isWebProject = text.includes('Microsoft.AspNetCore') ||
									text.includes('Microsoft.NET.Sdk.Web') ||
									text.includes('Microsoft.NET.Sdk.BlazorWebAssembly');

		// Detect test project from content
		if (text.includes('xunit') || text.includes('mstest') || text.includes('nunit')) {
			projectInfo.isTestProject = true;
		}

		// Extract PackageReference elements
		const packageRefMatches = text.matchAll(/<PackageReference[^>]*>/g);
		for (const match of packageRefMatches) {
			const refText = match[0];
			const nameMatch = refText.match(/Include=["'](.*?)["']/);
			const versionMatch = refText.match(/Version=["'](.*?)["']/);

			if (nameMatch) {
				const packageRef: PackageReference = {
					name: nameMatch[1]
				};

				if (versionMatch) {
					packageRef.version = versionMatch[1];
				}

				projectInfo.packages.push(packageRef);
			}
		}

		return projectInfo;
	}

	/**
	 * Get framework versions from project info
	 */
	getFrameworkVersions(projects: DotNetProjectInfo[]): string[] {
		const versions: string[] = [];
		const seen = new Set<string>();

		for (const project of projects) {
			if (project.targetFramework) {
				if (!seen.has(project.targetFramework)) {
					versions.push(project.targetFramework);
					seen.add(project.targetFramework);
				}
			}
			if (project.targetFrameworks) {
				for (const tf of project.targetFrameworks) {
					if (!seen.has(tf)) {
						versions.push(tf);
						seen.add(tf);
					}
				}
			}
		}

		return versions;
	}

	/**
	 * Get important dependencies from projects
	 */
	getImportantDependencies(projects: DotNetProjectInfo[]): string[] {
		const dependencies: string[] = [];
		const seen = new Set<string>();

		for (const project of projects) {
			for (const pkg of project.packages) {
				const depString = pkg.version
					? `${pkg.name} ${this.formatVersion(pkg.version)}`
					: pkg.name;

				if (!seen.has(depString)) {
					dependencies.push(depString);
					seen.add(depString);
				}
			}
		}

		return dependencies;
	}

	/**
	 * Format version string to major.x
	 */
	private formatVersion(version: string): string {
		const match = version.match(/^(\d+)\./);
		if (match) {
			return `${match[1]}.x`;
		}
		return version;
	}
}

