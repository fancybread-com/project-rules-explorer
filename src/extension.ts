// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import { RulesTreeProvider } from './providers/rulesTreeProvider';
import { RulesScanner } from './scanner/rulesScanner';
import { StateScanner } from './scanner/stateScanner';
import { RuleCommands } from './commands/ruleCommands';
import { StateCommands } from './commands/stateCommands';
import { ProjectCommands } from './commands/projectCommands';
import { RulePreviewEditor } from './commands/rulePreviewEditor';
import { ProjectManager } from './services/projectManager';
import { ProjectDefinition } from './types/project';
import { Rule } from './scanner/rulesScanner';
import { ProjectState } from './scanner/stateScanner';

let treeProvider: RulesTreeProvider;
let rulesScanner: RulesScanner;
let stateScanner: StateScanner;
let projectManager: ProjectManager;
let fileWatcher: vscode.FileSystemWatcher | undefined;
let outputChannel: vscode.OutputChannel;
let isActivated = false;

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	// Prevent multiple activations
	if (isActivated) {
		return;
	}
	isActivated = true;

	// Create output channel for better logging visibility
	outputChannel = vscode.window.createOutputChannel('Project Rules Explorer');
	outputChannel.show();
	outputChannel.appendLine('=== Project Rules Explorer extension activated ===');

	const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;

	// Initialize services
	outputChannel.appendLine('Initializing ProjectManager...');
	projectManager = new ProjectManager(context);

	// Initialize scanners only if we have a workspace
	if (workspaceRoot) {
		outputChannel.appendLine(`Workspace root found: ${workspaceRoot.fsPath}`);
		rulesScanner = new RulesScanner(workspaceRoot);
		stateScanner = new StateScanner(workspaceRoot);
	} else {
		outputChannel.appendLine('No workspace root found');
	}

	// Initialize tree provider
	outputChannel.appendLine('Initializing tree provider...');
	treeProvider = new RulesTreeProvider(new Map(), [], null);

	// Register tree data provider
	const treeProviderRegistration = vscode.window.createTreeView('projectRulesExplorer', {
		treeDataProvider: treeProvider
	});

	// Register commands
	outputChannel.appendLine('Registering commands...');
	try {
		RuleCommands.registerCommands(context);
		outputChannel.appendLine('RuleCommands registered');
		StateCommands.registerCommands(context);
		outputChannel.appendLine('StateCommands registered');
		ProjectCommands.registerCommands(context);
		outputChannel.appendLine('ProjectCommands registered');
		RulePreviewEditor.registerCommands(context);
		outputChannel.appendLine('RulePreviewEditor registered');
		outputChannel.appendLine('All commands registered successfully');
	} catch (error) {
		outputChannel.appendLine(`Error registering commands: ${error}`);
	}

	// Register refresh command
	const refreshCommand = vscode.commands.registerCommand('projectRules.refresh', async () => {
		outputChannel.appendLine('Manual refresh triggered');
		await refreshData();
	});

	// Set up file watcher (only if we have a workspace)
	if (workspaceRoot) {
		outputChannel.appendLine('Setting up file watcher...');
		setupFileWatcher();
	}

	// Initial data load (non-blocking)
	outputChannel.appendLine('Starting initial data load...');
	refreshData().then(() => {
		outputChannel.appendLine('Initial data load completed successfully');
	}).catch(error => {
		outputChannel.appendLine(`Error during initial data load: ${error}`);
	});

	// Add subscriptions
	context.subscriptions.push(
		treeProviderRegistration,
		refreshCommand,
		fileWatcher!,
		outputChannel
	);

	outputChannel.appendLine('Project Rules Explorer extension setup complete');
}

// This method is called when your extension is deactivated
export function deactivate() {
	isActivated = false;
	if (fileWatcher) {
		fileWatcher.dispose();
	}
	if (outputChannel) {
		outputChannel.dispose();
	}
	if (treeProvider) {
		treeProvider.dispose();
	}
}

async function refreshData() {
	try {
		outputChannel.appendLine('Refreshing project rules and state...');

		// Always scan the current workspace first
		const currentWorkspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
		const projectData = new Map<string, { rules: Rule[], state: ProjectState }>();

		if (currentWorkspaceRoot) {
			outputChannel.appendLine(`Scanning current workspace: ${currentWorkspaceRoot.fsPath}`);

			// Scan current workspace rules and state
			const [currentRules, currentState] = await Promise.all([
				rulesScanner?.scanRules() || Promise.resolve([]),
				stateScanner?.scanState() || Promise.resolve({ languages: [], frameworks: [], dependencies: [], buildTools: [], testing: [], codeQuality: [], developmentTools: [], architecture: [], configuration: [], documentation: [] })
			]);

			// Use workspace path as the key for current workspace
			const workspaceKey = 'current-workspace';
			projectData.set(workspaceKey, { rules: currentRules, state: currentState });

			const logMessage = `Scanned current workspace: ${currentRules.length} rules, ${currentState.languages.length + currentState.frameworks.length + currentState.dependencies.length + currentState.buildTools.length + currentState.testing.length + currentState.codeQuality.length + currentState.developmentTools.length + currentState.architecture.length + currentState.configuration.length + currentState.documentation.length} state items`;
			outputChannel.appendLine(logMessage);
		}

		// Get stored projects and scan them as additional projects
		const [projects, currentProject] = await Promise.all([
			projectManager.getProjects(),
			projectManager.getCurrentProject()
		]);

		// Scan additional stored projects (excluding current workspace)
		for (const project of projects) {
			// Skip if this project is the current workspace
			if (currentWorkspaceRoot && project.path === currentWorkspaceRoot.fsPath) {
				continue;
			}

			try {
				const projectUri = vscode.Uri.file(project.path);
				const projectRulesScanner = new RulesScanner(projectUri);
				const projectStateScanner = new StateScanner(projectUri);

				// Scan rules and state for this project
				const [rules, state] = await Promise.all([
					projectRulesScanner.scanRules(),
					projectStateScanner.scanState()
				]);

				projectData.set(project.id, { rules, state });
				const logMessage = `Scanned project ${project.name}: ${rules.length} rules, ${state.languages.length + state.frameworks.length + state.dependencies.length + state.buildTools.length + state.testing.length + state.codeQuality.length + state.developmentTools.length + state.architecture.length + state.configuration.length + state.documentation.length} state items`;
				outputChannel.appendLine(logMessage);
			} catch (error) {
				const errorMessage = `Error scanning project ${project.name}: ${error}`;
				outputChannel.appendLine(errorMessage);
				// Add empty data for failed projects
				projectData.set(project.id, {
					rules: [],
					state: {
						// Technology Stack
						languages: [],
						frameworks: [],
						dependencies: [],

						// Development Environment
						buildTools: [],
						testing: [],
						codeQuality: [],
						developmentTools: [],

						// Project Structure
						architecture: [],
						configuration: [],
						documentation: []
					}
				});
			}
		}

		// Update tree provider with all project data
		// Create a virtual project for the current workspace
		const allProjects = [...projects];
		if (currentWorkspaceRoot) {
			allProjects.unshift({
				id: 'current-workspace',
				name: 'Current Workspace',
				path: currentWorkspaceRoot.fsPath,
				description: 'Current workspace',
				lastAccessed: new Date(),
				active: true
			});
		}

		const finalCurrentProject = allProjects.find(p => p.active) || allProjects[0] || null;
		treeProvider.updateData(projectData, allProjects, finalCurrentProject);

		// Refresh the tree view
		treeProvider.refresh();

		const successMessage = `Refreshed ${allProjects.length} projects (including current workspace)`;
		outputChannel.appendLine(successMessage);
	} catch (error) {
		const errorMessage = `Error refreshing data: ${error}`;
		outputChannel.appendLine(errorMessage);
		vscode.window.showErrorMessage(`Failed to refresh data: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

function setupFileWatcher() {
	const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri;
	if (!workspaceRoot) {return;}

	// Watch for changes in .cursor/rules directories
	const pattern = new vscode.RelativePattern(workspaceRoot, '**/.cursor/rules/**/*.{mdc,md}');
	fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

	fileWatcher.onDidCreate(() => {
		outputChannel.appendLine('Rule file created, refreshing...');
		refreshData();
	});

	fileWatcher.onDidChange(() => {
		outputChannel.appendLine('Rule file changed, refreshing...');
		refreshData();
	});

	fileWatcher.onDidDelete(() => {
		outputChannel.appendLine('Rule file deleted, refreshing...');
		refreshData();
	});
}
