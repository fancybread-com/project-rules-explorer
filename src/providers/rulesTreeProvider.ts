// Tree Provider for Rules and State visualization
import * as vscode from 'vscode';
import { Rule } from '../scanner/rulesScanner';
import { ProjectState } from '../scanner/stateScanner';
import { ProjectDefinition } from '../types/project';

export interface RulesTreeItem extends vscode.TreeItem {
	rule?: Rule;
	stateItem?: any;
	ruleType?: any;
	category?: 'rules' | 'state' | 'projects' | 'ruleType';
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
				if (this.projects.length === 0) {
					return [{
						label: 'No projects defined',
						collapsibleState: vscode.TreeItemCollapsibleState.None,
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
					item.description = project.active ? 'Active' : project.path;
					item.tooltip = `${project.name}\n${project.path}\n${project.description || 'No description'}`;
					item.iconPath = new vscode.ThemeIcon(project.active ? 'folder-opened' : 'folder');

					// Add context menu for projects
					item.contextValue = project.active ? 'activeProject' : 'inactiveProject';

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
					item.description = section.description;
					item.iconPath = new vscode.ThemeIcon(section.icon);

					// Set contextValue for Rules section to enable + button
					if (section.id === 'rules') {
						item.contextValue = 'rules';
					}

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
					description: 'Add rules to .cursor/rules directory'
				} as RulesTreeItem];
			}

			// Show all rules in a flat list
			return rules.map((rule: Rule) => {
				const item = new vscode.TreeItem(
					rule.fileName,
					vscode.TreeItemCollapsibleState.None
				) as RulesTreeItem;
				item.rule = rule;
				item.category = 'rules';
				item.project = element.project;
				item.tooltip = rule.metadata.description;
				item.contextValue = 'rule'; // Enable context menu for individual rules

				// Context-aware icon based on filename, content, and project context
				item.iconPath = new vscode.ThemeIcon(this.getContextAwareIcon(rule, element.project));

				// Open in editor instead of webview
				item.command = {
					command: 'vscode.open',
					title: 'Open Rule',
					arguments: [rule.uri]
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
					treeItem.tooltip = item;
					treeItem.iconPath = new vscode.ThemeIcon('symbol-misc');
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
					item.description = `${section.items.length} items`;
					item.stateItem = section;
					item.iconPath = new vscode.ThemeIcon(section.icon);
					return item;
				});
			}

			return [];
		} catch (error) {
			const errorItem = new vscode.TreeItem(
				`Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
				vscode.TreeItemCollapsibleState.None
			) as RulesTreeItem;
			errorItem.tooltip = error instanceof Error ? error.stack : String(error);
			return [errorItem];
		}
	}

	private getContextAwareIcon(rule: Rule, project?: ProjectDefinition): string {
		const description = rule.metadata.description.toLowerCase();
		const fileName = rule.fileName.toLowerCase();

		// Filename-based icon detection (higher priority)
		const filenameIconMappings: Array<[string[], string]> = [
			// Security files
			[['security', 'auth', 'authz'], 'shield'],
			// Testing files
			[['test', 'spec', 'testing'], 'beaker'],
			// Performance files
			[['performance', 'optimize', 'perf'], 'speedometer'],
			// Documentation files
			[['readme', 'docs', 'documentation'], 'book'],
			// Deployment files
			[['deploy', 'publish', 'ci-cd'], 'rocket'],
			// Database files
			[['database', 'db', 'sql'], 'database'],
			// API files
			[['api', 'endpoint', 'rest'], 'symbol-method'],
			// Component files (higher priority than UI)
			[['component'], 'symbol-component'],
			// UI/UX files
			[['ui', 'ux', 'interface'], 'symbol-interface'],
			// Error handling files
			[['error', 'exception', 'handling'], 'error'],
			// Extension files (higher priority than TypeScript)
			[['extension'], 'extensions'],
			// TypeScript files
			[['typescript', 'ts-config'], 'symbol-class'],
			// Project specific files
			[['project-specific', 'project-specific'], 'folder-library'],
			// React files
			[['react', 'component', 'jsx'], 'symbol-component'],
			// Node.js files
			[['node', 'server', 'express'], 'server'],
			// Git files
			[['git', 'version', 'vcs'], 'source-control'],
			// Configuration files
			[['config', 'settings', 'env'], 'settings-gear'],
			// VS Code Extension files
			[['vscode', 'extension'], 'extensions'],
			// Always files
			[['always'], 'star'],
			// Auto files
			[['auto'], 'wrench'],
			// Agent files
			[['agent'], 'symbol-function'],
			// Manual files
			[['manual'], 'symbol-keyword']
		];

		// Description-based icon detection (lower priority)
		const iconMappings: Array<[string[], string]> = [
			// Security
			[['security', 'auth', 'authentication', 'authorization'], 'shield'],
			// Testing
			[['test', 'testing', 'spec'], 'beaker'],
			// Performance
			[['performance', 'optimize', 'optimization'], 'speedometer'],
			// Documentation
			[['documentation', 'readme', 'changelog'], 'book'],
			// Publishing/Deployment
			[['publishing', 'deployment', 'deploy', 'ci/cd'], 'rocket'],
			// Database
			[['database', 'sql', 'db'], 'database'],
			// API
			[['api', 'endpoint', 'rest'], 'symbol-method'],
			// UI/UX
			[['ui/ux', 'user interface', 'user experience'], 'symbol-interface'],
			// Error handling
			[['error', 'exception'], 'error'],
			// TypeScript
			[['typescript', 'type safety'], 'symbol-class'],
			// Project specific
			[['specific rules', 'project specific'], 'folder-library'],
			// React
			[['react', 'component'], 'symbol-component'],
			// Node.js
			[['node.js', 'server'], 'server'],
			// Git
			[['git', 'version control'], 'source-control'],
			// Configuration
			[['configuration', 'settings', 'config'], 'settings-gear'],
			// VS Code Extension
			[['vscode', 'extension', 'vs code'], 'extensions'],
			// Always rules
			[['always'], 'star'],
			// Auto rules
			[['auto'], 'wrench'],
			// Agent rules
			[['agent'], 'symbol-function'],
			// Manual rules
			[['manual'], 'symbol-keyword']
		];

		// Check filename first for priority
		for (const [keywords, icon] of filenameIconMappings) {
			if (keywords.some(keyword => fileName.includes(keyword))) {
				return icon;
			}
		}

		// Then check description for additional matches
		for (const [keywords, icon] of iconMappings) {
			if (keywords.some(keyword => description.includes(keyword))) {
				return icon;
			}
		}

		// Project-specific icon adjustments for non-default projects
		if (project && !project.active) {
			// For inactive projects, use a slightly different icon to indicate they're not the active project
			// This helps distinguish rules from different projects
			if (fileName.includes('project-specific') || description.includes('project specific')) {
				return 'folder-library';
			}
			// Add a subtle indicator for non-active project rules
			return 'file-text';
		}

		// Default fallback icon
		return 'file-text';
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

}