// Project Manager - Handle multiple project definitions
import * as vscode from 'vscode';
import { ProjectDefinition, ProjectRegistry } from '../types/project';

export class ProjectManager {
	private static readonly STORAGE_KEY = 'projectRulesExplorer.projects';
	private static readonly CURRENT_PROJECT_KEY = 'projectRulesExplorer.currentProject';

	constructor(private context: vscode.ExtensionContext) {}

	async getProjects(): Promise<ProjectDefinition[]> {
		const registry = await this.getRegistry();
		return registry.projects;
	}

	async getCurrentProject(): Promise<ProjectDefinition | null> {
		const currentProjectId = this.context.workspaceState.get<string>(ProjectManager.CURRENT_PROJECT_KEY);
		if (!currentProjectId) {return null;}

		const projects = await this.getProjects();
		return projects.find(p => p.id === currentProjectId) || null;
	}

	async addProject(project: Omit<ProjectDefinition, 'id' | 'lastAccessed' | 'active'>): Promise<ProjectDefinition> {
		const projects = await this.getProjects();

		// Check if project with same path already exists
		const existing = projects.find(p => p.path === project.path);
		if (existing) {
			throw new Error(`Project with path "${project.path}" already exists`);
		}

		const newProject: ProjectDefinition = {
			...project,
			id: this.generateId(),
			lastAccessed: new Date(),
			active: false
		};

		projects.push(newProject);
		await this.saveProjects(projects);

		return newProject;
	}

	async removeProject(projectId: string): Promise<void> {
		const projects = await this.getProjects();
		const filtered = projects.filter(p => p.id !== projectId);
		await this.saveProjects(filtered);

		// If we removed the current project, clear it
		const currentProjectId = this.context.workspaceState.get<string>(ProjectManager.CURRENT_PROJECT_KEY);
		if (currentProjectId === projectId) {
			await this.setCurrentProject(null);
		}
	}

	async setCurrentProject(projectId: string | null): Promise<void> {
		if (projectId) {
			// Update last accessed time
			const projects = await this.getProjects();
			const project = projects.find(p => p.id === projectId);
			if (project) {
				project.lastAccessed = new Date();
				project.active = true;
				// Set all others to inactive
				projects.forEach(p => {
					if (p.id !== projectId) {p.active = false;}
				});
				await this.saveProjects(projects);
			}
		}

		await this.context.workspaceState.update(ProjectManager.CURRENT_PROJECT_KEY, projectId);
	}

	async updateProject(projectId: string, updates: Partial<ProjectDefinition>): Promise<ProjectDefinition> {
		const projects = await this.getProjects();
		const index = projects.findIndex(p => p.id === projectId);

		if (index === -1) {
			throw new Error(`Project with id "${projectId}" not found`);
		}

		projects[index] = { ...projects[index], ...updates };
		await this.saveProjects(projects);

		return projects[index];
	}

	async validateProjectPath(path: string): Promise<boolean> {
		try {
			const uri = vscode.Uri.file(path);
			const stat = await vscode.workspace.fs.stat(uri);
			return stat.type === vscode.FileType.Directory;
		} catch {
			return false;
		}
	}

	private async getRegistry(): Promise<ProjectRegistry> {
		const stored = this.context.workspaceState.get<ProjectRegistry>(ProjectManager.STORAGE_KEY);
		return stored || { projects: [] };
	}

	private async saveProjects(projects: ProjectDefinition[]): Promise<void> {
		const registry: ProjectRegistry = {
			projects,
			currentProject: this.context.workspaceState.get<string>(ProjectManager.CURRENT_PROJECT_KEY)
		};
		await this.context.workspaceState.update(ProjectManager.STORAGE_KEY, registry);
	}

	private generateId(): string {
		return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}
