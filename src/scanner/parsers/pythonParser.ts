// Python Project Parser - Parse pyproject.toml, requirements.txt, setup.py
import * as vscode from 'vscode';
import * as path from 'path';
import { PythonProjectInfo, PythonDependency, ParserResult } from '../types';

/**
 * Parser for Python project files
 */
export class PythonParser {
	/**
	 * Parse Python projects in the workspace
	 */
	async parseProjects(workspaceRoot: vscode.Uri): Promise<ParserResult<PythonProjectInfo>> {
		const errors: string[] = [];
		let projectInfo: PythonProjectInfo = {
			dependencies: [],
			devDependencies: []
		};

		try {
			// Try pyproject.toml first (modern Python standard)
			const pyprojectPath = vscode.Uri.joinPath(workspaceRoot, 'pyproject.toml');
			if (await this.fileExists(pyprojectPath)) {
				try {
					projectInfo = await this.parsePyprojectToml(pyprojectPath);
				} catch (error) {
					errors.push(`Failed to parse pyproject.toml: ${error}`);
				}
			}

			// Try requirements.txt (traditional)
			const requirementsPath = vscode.Uri.joinPath(workspaceRoot, 'requirements.txt');
			if (await this.fileExists(requirementsPath)) {
				try {
					const deps = await this.parseRequirementsTxt(requirementsPath);
					if (deps.length > 0) {
						projectInfo.dependencies.push(...deps);
					}
				} catch (error) {
					errors.push(`Failed to parse requirements.txt: ${error}`);
				}
			}

			// Try requirements-dev.txt
			const requirementsDevPath = vscode.Uri.joinPath(workspaceRoot, 'requirements-dev.txt');
			if (await this.fileExists(requirementsDevPath)) {
				try {
					const deps = await this.parseRequirementsTxt(requirementsDevPath);
					if (deps.length > 0) {
						projectInfo.devDependencies.push(...deps);
					}
				} catch (error) {
					errors.push(`Failed to parse requirements-dev.txt: ${error}`);
				}
			}

			// Try runtime.txt for Python version
			const runtimePath = vscode.Uri.joinPath(workspaceRoot, 'runtime.txt');
			if (await this.fileExists(runtimePath)) {
				try {
					const version = await this.parseRuntimeTxt(runtimePath);
					if (version) {
						projectInfo.requiresPython = version;
					}
				} catch (error) {
					errors.push(`Failed to parse runtime.txt: ${error}`);
				}
			}
		} catch (error) {
			errors.push(`Failed to scan for Python projects: ${error}`);
		}

		return {
			success: errors.length === 0,
			data: projectInfo,
			errors
		};
	}

	/**
	 * Parse pyproject.toml file
	 */
	private async parsePyprojectToml(uri: vscode.Uri): Promise<PythonProjectInfo> {
		const content = await vscode.workspace.fs.readFile(uri);
		const text = Buffer.from(content).toString('utf8');

		const projectInfo: PythonProjectInfo = {
			dependencies: [],
			devDependencies: []
		};

		// Simple TOML parsing (for production, consider using a proper TOML parser)

		// Parse project.name
		const nameMatch = text.match(/^name\s*=\s*["'](.+?)["']/m);
		if (nameMatch) {
			projectInfo.name = nameMatch[1];
		}

		// Parse project.version
		const versionMatch = text.match(/^version\s*=\s*["'](.+?)["']/m);
		if (versionMatch) {
			projectInfo.version = versionMatch[1];
		}

		// Parse requires-python
		const requiresPythonMatch = text.match(/^requires-python\s*=\s*["'](.+?)["']/m);
		if (requiresPythonMatch) {
			projectInfo.requiresPython = requiresPythonMatch[1];
		}

		// Parse dependencies
		const dependenciesMatch = text.match(/\[project\.dependencies\](.*?)(?=\[|$)/s);
		if (dependenciesMatch) {
			const deps = this.parseDependencyList(dependenciesMatch[1]);
			projectInfo.dependencies = deps;
		}

		// Parse optional dependencies (treated as dev dependencies)
		const optionalDepsMatch = text.match(/\[project\.optional-dependencies\]/s);
		if (optionalDepsMatch) {
			const devDeps = text.match(/\[project\.optional-dependencies\.dev\](.*?)(?=\[|$)/s);
			if (devDeps) {
				const parsed = this.parseDependencyList(devDeps[1]);
				projectInfo.devDependencies.push(...parsed);
			}
		}

		// Parse build system
		const buildSystemMatch = text.match(/\[build-system\](.*?)(?=\[|$)/s);
		if (buildSystemMatch) {
			const backendMatch = buildSystemMatch[1].match(/requires\s*=\s*\[(.*?)\]/s);
			if (backendMatch) {
				projectInfo.buildSystem = backendMatch[1].replace(/["']/g, '').trim();
			}
		}

		return projectInfo;
	}

	/**
	 * Parse requirements.txt file
	 */
	private async parseRequirementsTxt(uri: vscode.Uri): Promise<PythonDependency[]> {
		const content = await vscode.workspace.fs.readFile(uri);
		const text = Buffer.from(content).toString('utf8');
		const dependencies: PythonDependency[] = [];

		const lines = text.split('\n');
		for (const line of lines) {
			const trimmed = line.trim();

			// Skip empty lines and comments
			if (!trimmed || trimmed.startsWith('#')) {
				continue;
			}

			// Parse dependency format: package==version, package>=version, etc.
			const dep = this.parseRequirementLine(trimmed);
			if (dep) {
				dependencies.push(dep);
			}
		}

		return dependencies;
	}

	/**
	 * Parse a single requirement line
	 */
	private parseRequirementLine(line: string): PythonDependency | null {
		// Remove comments
		const cleanLine = line.split('#')[0].trim();

		// Parse patterns: package==version, package>=version, package~=version, etc.
		const match = cleanLine.match(/^([a-zA-Z0-9_-]+[a-zA-Z0-9._-]*?)([><=!~]+)(.+?)$/);

		if (match) {
			return {
				name: match[1],
				version: match[3].trim()
			};
		}

		// Simple package name without version
		if (cleanLine.match(/^[a-zA-Z0-9_-]+[a-zA-Z0-9._-]*$/)) {
			return {
				name: cleanLine
			};
		}

		return null;
	}

	/**
	 * Parse dependency list from TOML array format
	 */
	private parseDependencyList(text: string): PythonDependency[] {
		const dependencies: PythonDependency[] = [];

		// Extract lines that look like dependencies
		const lines = text.split('\n');
		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) {
				continue;
			}

			// Match TOML array elements: "package==version" or 'package==version'
			const match = trimmed.match(/["'](.+?)["']/);
			if (match) {
				const dep = this.parseRequirementLine(match[1]);
				if (dep) {
					dependencies.push(dep);
				}
			}
		}

		return dependencies;
	}

	/**
	 * Parse runtime.txt for Python version
	 */
	private async parseRuntimeTxt(uri: vscode.Uri): Promise<string | undefined> {
		const content = await vscode.workspace.fs.readFile(uri);
		const text = Buffer.from(content).toString('utf8');

		const match = text.match(/^python-(.+)$/m);
		return match ? match[1] : undefined;
	}

	/**
	 * Check if file exists
	 */
	private async fileExists(uri: vscode.Uri): Promise<boolean> {
		try {
			await vscode.workspace.fs.stat(uri);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Get important dependencies
	 */
	getImportantDependencies(projectInfo: PythonProjectInfo): string[] {
		const dependencies: string[] = [];
		const seen = new Set<string>();

		const allDeps = [...projectInfo.dependencies, ...projectInfo.devDependencies];

		for (const dep of allDeps) {
			const depString = dep.version
				? `${dep.name} ${this.formatVersion(dep.version)}`
				: dep.name;

			if (!seen.has(depString)) {
				dependencies.push(depString);
				seen.add(depString);
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

