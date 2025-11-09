// Project Management Commands
import * as vscode from 'vscode';
import { ProjectManager } from '../services/projectManager';
import { ProjectDefinition } from '../types/project';

export class ProjectCommands {
	static registerCommands(context: vscode.ExtensionContext): void {
		const projectManager = new ProjectManager(context);

		// Add Project command
		const addProject = vscode.commands.registerCommand('projectRules.addProject', async () => {
			try {
				// Get project name
				const name = await vscode.window.showInputBox({
					prompt: 'Project name',
					validateInput: (value) => {
						if (!value || value.trim().length === 0) {
							return 'Project name is required';
						}
						return null;
					}
				});
				if (!name) {return;}

				// Get project path
				const path = await vscode.window.showInputBox({
					prompt: 'Project path (absolute path to project directory)',
					validateInput: async (value) => {
						if (!value || value.trim().length === 0) {
							return 'Project path is required';
						}
						const isValid = await projectManager.validateProjectPath(value);
						if (!isValid) {
							return 'Path does not exist or is not a directory';
						}
						return null;
					}
				});
				if (!path) {return;}

				// Get optional description
				const description = await vscode.window.showInputBox({
					prompt: 'Project description (optional)',
					value: ''
				});

				// Add the project
				const project = await projectManager.addProject({
					name,
					path,
					description: description || undefined
				});

				vscode.window.showInformationMessage(`Project added: ${project.name}`);
			} catch (e: any) {
				vscode.window.showErrorMessage(`Failed to add project: ${e?.message || e}`);
			}
		});


		// Remove Project command
		const removeProject = vscode.commands.registerCommand('projectRules.removeProject', async (project: ProjectDefinition) => {
			try {
				const result = await vscode.window.showWarningMessage(
					`Are you sure you want to remove project "${project.name}"?`,
					'Yes', 'No'
				);

				if (result === 'Yes') {
					await projectManager.removeProject(project.id);
					vscode.window.showInformationMessage(`Project removed: ${project.name}`);

					// Refresh the tree view
					vscode.commands.executeCommand('projectRules.refresh');
				}
			} catch (e: any) {
				vscode.window.showErrorMessage(`Failed to remove project: ${e?.message || e}`);
			}
		});

		// Edit Project command
		const editProject = vscode.commands.registerCommand('projectRules.editProject', async (project: ProjectDefinition) => {
			try {
				// Get updated name
				const name = await vscode.window.showInputBox({
					prompt: 'Project name',
					value: project.name,
					validateInput: (value) => {
						if (!value || value.trim().length === 0) {
							return 'Project name is required';
						}
						return null;
					}
				});
				if (!name) {return;}

				// Get updated description
				const description = await vscode.window.showInputBox({
					prompt: 'Project description (optional)',
					value: project.description || ''
				});

				// Update the project
				await projectManager.updateProject(project.id, {
					name,
					description: description || undefined
				});

				vscode.window.showInformationMessage(`Project updated: ${name}`);

				// Refresh the tree view
				vscode.commands.executeCommand('projectRules.refresh');
			} catch (e: any) {
				vscode.window.showErrorMessage(`Failed to edit project: ${e?.message || e}`);
			}
		});

		// List Projects command
		const listProjects = vscode.commands.registerCommand('projectRules.listProjects', async () => {
			try {
				const projects = await projectManager.getProjects();
				const currentProject = await projectManager.getCurrentProject();

				if (projects.length === 0) {
					vscode.window.showInformationMessage('No projects defined');
					return;
				}

				const projectList = projects.map(p =>
					`${p.name}${p.id === currentProject?.id ? ' (current)' : ''}`
				).join('\n');

				const content = `# Project List

${projectList}

---
*Total: ${projects.length} projects*
*Current: ${currentProject?.name || 'None'}*
`;

				const doc = await vscode.workspace.openTextDocument({
					content,
					language: 'markdown'
				});
				await vscode.window.showTextDocument(doc);
			} catch (e: any) {
				vscode.window.showErrorMessage(`Failed to list projects: ${e?.message || e}`);
			}
		});

		// Export All Projects for Agent command
		const exportForAgent = vscode.commands.registerCommand('projectRules.exportForAgent', async () => {
			try {
				const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
				if (!workspaceRoot) {
					vscode.window.showErrorMessage('No workspace folder found');
					return;
				}

				const { RulesScanner } = await import('../scanner/rulesScanner');
				const { StateScanner } = await import('../scanner/stateScanner');

				const projects = await projectManager.getProjects();
				const currentProject = await projectManager.getCurrentProject();

				// Build comprehensive export
				const exportData: any = {
					exportedAt: new Date().toISOString(),
					totalProjects: projects.length + 1, // +1 for current workspace
					projects: []
				};

				// Add current workspace
				if (workspaceRoot) {
					const currentRulesScanner = new RulesScanner(workspaceRoot);
					const currentStateScanner = new StateScanner(workspaceRoot);
					const [rules, state] = await Promise.all([
						currentRulesScanner.scanRules(),
						currentStateScanner.scanState()
					]);

					exportData.projects.push({
						id: 'current-workspace',
						name: 'Current Workspace',
						path: workspaceRoot.fsPath,
						type: 'current-workspace',
						rules: rules.map(rule => ({
							fileName: rule.fileName,
							description: rule.metadata.description,
							globs: rule.metadata.globs || [],
							alwaysApply: rule.metadata.alwaysApply || false,
							content: rule.content
						})),
						state: {
							// Basic state
							languages: state.languages,
							frameworks: state.frameworks,
							dependencies: state.dependencies,
							buildTools: state.buildTools,
							testing: state.testing,
							codeQuality: state.codeQuality,
							developmentTools: state.developmentTools,
							architecture: state.architecture,
							configuration: state.configuration,
							documentation: state.documentation,
							// Enhanced detection (v0.3.3+)
							infrastructure: state.infrastructure,
							security: state.security,
							api: state.api,
							deployment: state.deployment,
							projectMetrics: state.projectMetrics,
							// Enhanced state (v0.4.0+)
							identity: state.identity,
							capabilities: state.capabilities,
							enhancedArchitecture: state.enhancedArchitecture,
							enhancedDependencies: state.enhancedDependencies,
							platformContext: state.platformContext,
							agentGuidance: state.agentGuidance
						}
					});
				}

				// Add stored projects
				for (const project of projects) {
					try {
						const projectUri = vscode.Uri.file(project.path);
						const projectRulesScanner = new RulesScanner(projectUri);
						const projectStateScanner = new StateScanner(projectUri);

						const [rules, state] = await Promise.all([
							projectRulesScanner.scanRules(),
							projectStateScanner.scanState()
						]);

						exportData.projects.push({
							id: project.id,
							name: project.name,
							path: project.path,
							description: project.description,
							type: 'stored-project',
							rules: rules.map(rule => ({
								fileName: rule.fileName,
								description: rule.metadata.description,
								globs: rule.metadata.globs || [],
								alwaysApply: rule.metadata.alwaysApply || false,
								content: rule.content
							})),
							state: {
								// Basic state
								languages: state.languages,
								frameworks: state.frameworks,
								dependencies: state.dependencies,
								buildTools: state.buildTools,
								testing: state.testing,
								codeQuality: state.codeQuality,
								developmentTools: state.developmentTools,
								architecture: state.architecture,
								configuration: state.configuration,
								documentation: state.documentation,
								// Enhanced detection (v0.3.3+)
								infrastructure: state.infrastructure,
								security: state.security,
								api: state.api,
								deployment: state.deployment,
								projectMetrics: state.projectMetrics,
								// Enhanced state (v0.4.0+)
								identity: state.identity,
								capabilities: state.capabilities,
								enhancedArchitecture: state.enhancedArchitecture,
								enhancedDependencies: state.enhancedDependencies,
								platformContext: state.platformContext,
								agentGuidance: state.agentGuidance
							}
						});
					} catch (error) {
						vscode.window.showErrorMessage(`Failed to scan project ${project.name}: ${error}`);
					}
				}

				// Write to .cursor directory
				const exportFileUri = vscode.Uri.joinPath(workspaceRoot, '.cursor', 'project-rules-export.json');
				const content = JSON.stringify(exportData, null, 2);
				await vscode.workspace.fs.writeFile(exportFileUri, Buffer.from(content, 'utf8'));

				vscode.window.showInformationMessage(`Exported ${exportData.totalProjects} projects to .cursor/project-rules-export.json`);
			} catch (e: any) {
				vscode.window.showErrorMessage(`Failed to export for agent: ${e?.message || e}`);
			}
		});

		context.subscriptions.push(addProject, removeProject, editProject, listProjects, exportForAgent);
	}
}
