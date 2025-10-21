// Tree Provider for Rules and State visualization
import * as vscode from 'vscode';
import { Rule } from '../scanner/rulesScanner';
import { ProjectState } from '../scanner/stateScanner';
import { ProjectDefinition } from '../types/project';

interface RulesTreeItem extends vscode.TreeItem {
	rule?: Rule;
	stateItem?: any;
	category?: 'rules' | 'state' | 'projects';
	directory?: string;
	project?: ProjectDefinition;
}

export class RulesTreeProvider implements vscode.TreeDataProvider<RulesTreeItem> {
	private _onDidChangeTreeData = new vscode.EventEmitter<void>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	constructor(
		private projectData: Map<string, { rules: Rule[], state: ProjectState }> = new Map(),
		private projects: ProjectDefinition[] = [],
		private currentProject: ProjectDefinition | null = null
	) {}

	refresh(): void {
		console.log('Tree provider refresh called');
		this._onDidChangeTreeData.fire();
	}

	dispose(): void {
		this._onDidChangeTreeData.dispose();
	}

	updateData(
		projectData: Map<string, { rules: Rule[], state: ProjectState }>,
		projects: ProjectDefinition[],
		currentProject: ProjectDefinition | null
	): void {
		console.log(`Tree provider updateData: ${projects.length} projects, ${projectData.size} project data entries`);
		this.projectData = projectData;
		this.projects = projects;
		this.currentProject = currentProject;
	}

	getTreeItem(element: RulesTreeItem): RulesTreeItem {
		return element;
	}

	async getChildren(element?: RulesTreeItem): Promise<RulesTreeItem[]> {
		try {
			if (!element) {
				// Root level: show all projects
				console.log(`Tree provider getChildren: ${this.projects.length} projects`);
				if (this.projects.length === 0) {
					console.log('No projects found, showing "No projects defined" message');
					return [{
						label: 'No projects defined',
						collapsibleState: vscode.TreeItemCollapsibleState.None,
						iconPath: new vscode.ThemeIcon('info'),
						description: 'Add a project to get started',
						command: {
							command: 'projectRules.addProject',
							title: 'Add Project'
						}
					} as RulesTreeItem];
				}

				return this.projects.map((project) => {
					const item = new vscode.TreeItem(
						project.name,
						project.active ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed
					) as RulesTreeItem;
					item.project = project;
					item.category = 'projects';
					item.iconPath = new vscode.ThemeIcon(
						project.active ? 'folder-opened' : 'folder'
					);
					item.description = project.active ? 'Active' : project.path;
					item.tooltip = `${project.name}\n${project.path}\n${project.description || 'No description'}`;

					// Add context menu for non-active projects
					if (!project.active) {
						item.contextValue = 'inactiveProject';
					}

					return item;
				});
			} else if (element.category === 'projects' && element.project) {
				// Project level: show Rules and State for this specific project
				const project = element.project;

				// Show Rules and State sections for all projects
				const currentProjectData = this.projectData.get(project.id);
				const rulesCount = currentProjectData?.rules.length || 0;
				const stateCount = currentProjectData?.state ?
					currentProjectData.state.languages.length +
					currentProjectData.state.frameworks.length +
					currentProjectData.state.dependencies.length +
					currentProjectData.state.buildTools.length +
					currentProjectData.state.testing.length +
					currentProjectData.state.codeQuality.length +
					currentProjectData.state.developmentTools.length +
					currentProjectData.state.architecture.length +
					currentProjectData.state.configuration.length +
					currentProjectData.state.documentation.length : 0;

				const sections = [
					{ name: 'Rules', id: 'rules', icon: 'book', description: `${rulesCount} rules found` },
					{ name: 'State', id: 'state', icon: 'database', description: `${stateCount} items` }
				];

				// Add a switch project option for non-active projects
				const items = sections.map((section) => {
					const item = new vscode.TreeItem(section.name, vscode.TreeItemCollapsibleState.Collapsed) as RulesTreeItem;
					item.category = section.id as 'rules' | 'state';
					item.project = project;
					item.iconPath = new vscode.ThemeIcon(section.icon);
					item.description = section.description;
					return item;
				});

				// No switch option needed - users can expand any project to see its rules and state

				return items;
			} else if (element.category === 'rules' && element.project) {
				// Rules section for specific project
				const projectData = this.projectData.get(element.project.id);
				const rules = projectData?.rules || [];

				if (rules.length === 0) {
					return [{
						label: 'No rules found',
						collapsibleState: vscode.TreeItemCollapsibleState.None,
						iconPath: new vscode.ThemeIcon('info'),
						description: 'Add rules to .cursor/rules directory'
					} as RulesTreeItem];
				}

				// Rules section: show all rules flattened (no folder grouping)
				return rules.map((rule) => {
					const item = new vscode.TreeItem(
						rule.fileName,
						vscode.TreeItemCollapsibleState.None
					) as RulesTreeItem;
					item.rule = rule;
					item.category = 'rules';
					item.project = element.project;
					item.iconPath = this.getRuleIcon(rule.metadata.type);
					item.description = rule.metadata.type;
					item.tooltip = rule.metadata.description;
					item.command = {
						command: 'projectRules.viewRule',
						title: 'View Rule',
						arguments: [rule]
					};
					return item;
				});
			} else if (element.category === 'state' && element.stateItem && element.project) {
				// State item level: show individual items for a specific section
				const section = element.stateItem;
				return section.items.map((item: string) => {
					const treeItem = new vscode.TreeItem(
						item,
						vscode.TreeItemCollapsibleState.None
					) as RulesTreeItem;
					treeItem.category = 'state';
					treeItem.project = element.project;
					treeItem.iconPath = new vscode.ThemeIcon('symbol-key');
					treeItem.tooltip = item;
					return treeItem;
				});
			} else if (element.category === 'state' && element.project && !element.stateItem) {
				// State section for specific project - show categories
				const projectData = this.projectData.get(element.project.id);
				const state = projectData?.state;

				if (!state) {
					return [{
						label: 'No state data available',
						collapsibleState: vscode.TreeItemCollapsibleState.None,
						iconPath: new vscode.ThemeIcon('info'),
						description: 'State not scanned yet'
					} as RulesTreeItem];
				}

				const stateItems = [
					// Technology Stack
					{ name: 'Languages', items: state.languages, icon: 'symbol-text' },
					{ name: 'Frameworks', items: state.frameworks, icon: 'package' },
					{ name: 'Dependencies', items: state.dependencies, icon: 'library' },

					// Development Environment
					{ name: 'Build Tools', items: state.buildTools, icon: 'tools' },
					{ name: 'Testing', items: state.testing, icon: 'beaker' },
					{ name: 'Code Quality', items: state.codeQuality, icon: 'check' },
					{ name: 'Development Tools', items: state.developmentTools, icon: 'gear' },

					// Project Structure
					{ name: 'Architecture', items: state.architecture, icon: 'symbol-structure' },
					{ name: 'Configuration', items: state.configuration, icon: 'settings-gear' },
					{ name: 'Documentation', items: state.documentation, icon: 'book' }
				];

				return stateItems.map((section) => {
					const item = new vscode.TreeItem(
						section.name,
						vscode.TreeItemCollapsibleState.Collapsed
					) as RulesTreeItem;
					item.category = 'state';
					item.project = element.project;
					item.iconPath = new vscode.ThemeIcon(section.icon);
					item.description = `${section.items.length} items`;
					item.stateItem = section;
					return item;
				});
			}

			return [];
		} catch (error) {
			console.error('Error loading tree data:', error);
			const errorItem = new vscode.TreeItem(
				`Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
				vscode.TreeItemCollapsibleState.None
			) as RulesTreeItem;
			errorItem.iconPath = new vscode.ThemeIcon('error');
			errorItem.tooltip = error instanceof Error ? error.stack : String(error);
			return [errorItem];
		}
	}

	private groupRulesByDirectory(rules: Rule[]): Record<string, Rule[]> {
		const groups: Record<string, Rule[]> = {};

		for (const rule of rules) {
			// Extract directory from URI path relative to workspace
			const relativePath = vscode.workspace.asRelativePath(rule.uri);
			const directory = relativePath.includes('/')
				? relativePath.substring(0, relativePath.lastIndexOf('/'))
				: '';

			if (!groups[directory]) {
				groups[directory] = [];
			}
			groups[directory].push(rule);
		}

		return groups;
	}

	private getRuleIcon(type: string): vscode.ThemeIcon {
		switch (type) {
			case 'always': return new vscode.ThemeIcon('symbol-constant');
			case 'auto': return new vscode.ThemeIcon('symbol-variable');
			case 'agent': return new vscode.ThemeIcon('symbol-method');
			case 'manual': return new vscode.ThemeIcon('symbol-parameter');
			default: return new vscode.ThemeIcon('book');
		}
	}
}