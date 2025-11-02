// CI/CD Parser - Parse GitHub Actions, Azure Pipelines, GitLab CI
import * as vscode from 'vscode';
import { CIWorkflowInfo, ParserResult } from '../types';

/**
 * Parser for CI/CD configuration files
 */
export class CIParser {
	/**
	 * Parse CI/CD configurations in the workspace
	 */
	async parseConfigurations(workspaceRoot: vscode.Uri): Promise<ParserResult<CIWorkflowInfo[]>> {
		const errors: string[] = [];
		const workflows: CIWorkflowInfo[] = [];

		try {
			// Parse GitHub Actions workflows
			const githubWorkflows = await this.parseGitHubActions(workspaceRoot);
			if (githubWorkflows.success && githubWorkflows.data) {
				workflows.push(...githubWorkflows.data);
			}
			if (githubWorkflows.errors.length > 0) {
				errors.push(...githubWorkflows.errors);
			}

			// Parse Azure Pipelines
			const azurePipelines = await this.parseAzurePipelines(workspaceRoot);
			if (azurePipelines.success && azurePipelines.data) {
				workflows.push(...azurePipelines.data);
			}
			if (azurePipelines.errors.length > 0) {
				errors.push(...azurePipelines.errors);
			}

			// Parse GitLab CI
			const gitlabCI = await this.parseGitLabCI(workspaceRoot);
			if (gitlabCI.success && gitlabCI.data) {
				workflows.push(...gitlabCI.data);
			}
			if (gitlabCI.errors.length > 0) {
				errors.push(...gitlabCI.errors);
			}
		} catch (error) {
			errors.push(`Failed to scan for CI/CD configurations: ${error}`);
		}

		// Return success if we found any workflows, even if there were some errors
		return {
			success: workflows.length > 0 || errors.length === 0,
			data: workflows,
			errors
		};
	}

	/**
	 * Parse GitHub Actions workflows
	 */
	private async parseGitHubActions(workspaceRoot: vscode.Uri): Promise<ParserResult<CIWorkflowInfo[]>> {
		const errors: string[] = [];
		const workflows: CIWorkflowInfo[] = [];

		try {
			const workflowsDir = vscode.Uri.joinPath(workspaceRoot, '.github', 'workflows');

			if (await this.directoryExists(workflowsDir)) {
				const files = await vscode.workspace.fs.readDirectory(workflowsDir);

				for (const [name, type] of files) {
					if (type === vscode.FileType.File && (name.endsWith('.yml') || name.endsWith('.yaml'))) {
						const uri = vscode.Uri.joinPath(workflowsDir, name);

						try {
							const workflow = await this.parseGitHubWorkflow(uri, name);
							if (workflow) {
								workflows.push(workflow);
							}
						} catch (error) {
							errors.push(`Failed to parse ${name}: ${error}`);
						}
					}
				}
			}
		} catch (error) {
			errors.push(`Failed to scan GitHub Actions: ${error}`);
		}

		return {
			success: errors.length === 0,
			data: workflows,
			errors
		};
	}

	/**
	 * Parse a single GitHub Actions workflow file
	 */
	private async parseGitHubWorkflow(uri: vscode.Uri, fileName: string): Promise<CIWorkflowInfo | null> {
		try {
			const content = await vscode.workspace.fs.readFile(uri);
			const text = Buffer.from(content).toString('utf8');

			const workflow: CIWorkflowInfo = {
				type: 'github-actions',
				name: fileName.replace(/\.(yml|yaml)$/, ''),
				onEvents: [],
				jobs: []
			};

			// Parse on: events with improved error handling
			try {
				const onMatch = text.match(/on:\s*\n((?:\s+[^:]+:\s*(?:true|\[.*?\]|.*\n?))+)/s);
				if (onMatch) {
					const onSection = onMatch[1];
					const eventMatches = onSection.matchAll(/(\w+):/g);
					for (const match of eventMatches) {
						if (match[1] && !match[1].startsWith('-')) {
							workflow.onEvents?.push(match[1]);
						}
					}
				}
			} catch (error) {
				// Continue parsing even if on: events parsing fails
			}

			// Parse jobs with improved error handling
			try {
				const jobsMatch = text.match(/jobs:\s*\n((?:\s+\w+:\s*\n(?:\s+.*\n?)+)+)/s);
				if (jobsMatch) {
					const jobsSection = jobsMatch[1];
					const jobMatches = jobsSection.matchAll(/(\w+):\s*\n/s);
					for (const match of jobMatches) {
						if (match[1]) {
							workflow.jobs?.push(match[1]);
						}
					}
				}
			} catch (error) {
				// Continue parsing even if jobs parsing fails
			}

			return workflow;
		} catch (error) {
			// Return null if file can't be read, but don't throw
			return null;
		}
	}

	/**
	 * Parse Azure Pipelines configuration
	 */
	private async parseAzurePipelines(workspaceRoot: vscode.Uri): Promise<ParserResult<CIWorkflowInfo[]>> {
		const errors: string[] = [];
		const workflows: CIWorkflowInfo[] = [];

		try {
			const pipelineFiles = [
				vscode.Uri.joinPath(workspaceRoot, 'azure-pipelines.yml'),
				vscode.Uri.joinPath(workspaceRoot, 'azure-pipelines.yaml')
			];

			for (const uri of pipelineFiles) {
				if (await this.fileExists(uri)) {
					try {
						const pipeline = await this.parseAzurePipeline(uri);
						if (pipeline) {
							workflows.push(pipeline);
						}
					} catch (error) {
						errors.push(`Failed to parse ${uri.path}: ${error}`);
					}
				}
			}
		} catch (error) {
			errors.push(`Failed to scan Azure Pipelines: ${error}`);
		}

		return {
			success: errors.length === 0,
			data: workflows,
			errors
		};
	}

	/**
	 * Parse a single Azure Pipeline file
	 */
	private async parseAzurePipeline(uri: vscode.Uri): Promise<CIWorkflowInfo | null> {
		const content = await vscode.workspace.fs.readFile(uri);
		const text = Buffer.from(content).toString('utf8');

		const pipeline: CIWorkflowInfo = {
			type: 'azure-pipelines',
			name: 'azure-pipelines',
			jobs: []
		};

		// Parse stages (jobs in Azure Pipelines)
		const stagesMatch = text.match(/stages:\s*\n((?:\s*-\s*stage:\s*\n(?:\s+.*\n?)+)+)/s);
		if (stagesMatch) {
			const stagesSection = stagesMatch[1];
			const stageMatches = stagesSection.matchAll(/displayName:\s*['"](.*?)['"]/g);
			for (const match of stageMatches) {
				if (match[1]) {
					pipeline.jobs?.push(match[1]);
				}
			}
		}

		return pipeline;
	}

	/**
	 * Parse GitLab CI configuration
	 */
	private async parseGitLabCI(workspaceRoot: vscode.Uri): Promise<ParserResult<CIWorkflowInfo[]>> {
		const errors: string[] = [];
		const workflows: CIWorkflowInfo[] = [];

		try {
			const ciConfig = vscode.Uri.joinPath(workspaceRoot, '.gitlab-ci.yml');

			if (await this.fileExists(ciConfig)) {
				try {
					const pipeline = await this.parseGitLabPipeline(ciConfig);
					if (pipeline) {
						workflows.push(pipeline);
					}
				} catch (error) {
					errors.push(`Failed to parse .gitlab-ci.yml: ${error}`);
				}
			}
		} catch (error) {
			errors.push(`Failed to scan GitLab CI: ${error}`);
		}

		return {
			success: errors.length === 0,
			data: workflows,
			errors
		};
	}

	/**
	 * Parse a GitLab CI configuration file
	 */
	private async parseGitLabPipeline(uri: vscode.Uri): Promise<CIWorkflowInfo | null> {
		const content = await vscode.workspace.fs.readFile(uri);
		const text = Buffer.from(content).toString('utf8');

		const pipeline: CIWorkflowInfo = {
			type: 'gitlab-ci',
			name: 'gitlab-ci',
			jobs: []
		};

		// Parse jobs
		const jobMatches = text.matchAll(/^(\w+):\s*$/gm);
		for (const match of jobMatches) {
			if (match[1] && !['image', 'services', 'before_script', 'after_script'].includes(match[1])) {
				pipeline.jobs?.push(match[1]);
			}
		}

		return pipeline;
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
	 * Check if directory exists
	 */
	private async directoryExists(uri: vscode.Uri): Promise<boolean> {
		try {
			const stat = await vscode.workspace.fs.stat(uri);
			return stat.type === vscode.FileType.Directory;
		} catch {
			return false;
		}
	}
}

