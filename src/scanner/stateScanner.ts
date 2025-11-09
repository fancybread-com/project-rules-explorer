// State Scanner - Scan project for configuration files and patterns
import * as vscode from 'vscode';
import { DotNetParser } from './parsers/dotnetParser';
import { PythonParser } from './parsers/pythonParser';
import { CIParser } from './parsers/ciParser';
import { NodeParser } from './parsers/nodeParser';
import {
	InfrastructureInfo,
	SecurityInfo,
	APIInfo,
	DeploymentInfo,
	ProjectMetrics,
	DatabasePatterns,
	ORMPatterns,
	QueuePatterns,
	APIPatterns,
	AuthPatterns,
	VulnerabilityScanningPatterns,
	SecretsPatterns,
	OrchestrationPatterns
} from './types';
import { deduplicateArray, mergeAndDeduplicate } from '../utils/deduplicator';

// Enhanced detection imports
import { ProjectTypeDetector } from './enhanced/projectTypeDetector';
import { CapabilityExtractor } from './enhanced/capabilityExtractor';
import { MaturityDetector } from './enhanced/maturityDetector';
import { DependencyPurposeMapper } from './enhanced/dependencyPurposeMapper';
import { ArchitectureDetector } from './enhanced/architectureDetector';
import { VSCodeAnalyzer } from './enhanced/platforms/vscodeAnalyzer';
import { AgentGuidanceGenerator } from './enhanced/agentGuidanceGenerator';
import {
	ProjectIdentity,
	ProjectCapabilities,
	EnhancedArchitecture,
	EnhancedDependencies,
	PlatformContext,
	AgentGuidance
} from './enhanced/types';

export interface ProjectState {
	// Technology Stack
	languages: string[];
	frameworks: string[];
	dependencies: string[];

	// Development Environment
	buildTools: string[];
	testing: string[];
	codeQuality: string[];
	developmentTools: string[];

	// Project Structure
	architecture: string[];
	configuration: string[];
	documentation: string[];

	// Enhanced Detection (v0.3.3+)
	infrastructure?: InfrastructureInfo;
	security?: SecurityInfo;
	api?: APIInfo;
	deployment?: DeploymentInfo;
	projectMetrics?: ProjectMetrics;

	// Enhanced State Detection (v0.4.0+)
	identity?: ProjectIdentity;
	capabilities?: ProjectCapabilities;
	enhancedArchitecture?: EnhancedArchitecture;
	enhancedDependencies?: EnhancedDependencies;
	platformContext?: PlatformContext;
	agentGuidance?: AgentGuidance;
}

export class StateScanner {
	private dotnetParser: DotNetParser;
	private pythonParser: PythonParser;
	private ciParser: CIParser;
	private nodeParser: NodeParser;

	constructor(private workspaceRoot: vscode.Uri) {
		this.dotnetParser = new DotNetParser();
		this.pythonParser = new PythonParser();
		this.ciParser = new CIParser();
		this.nodeParser = new NodeParser();
	}

	async scanState(): Promise<ProjectState> {
		const state: ProjectState = {
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
		};

		try {
			// Technology Stack - Enhanced with parsers
			state.languages = await this.detectLanguages();
			state.frameworks = await this.detectFrameworks();
			// Note: Legacy dependencies field deprecated in favor of enhancedDependencies
			// state.dependencies is now populated from enhancedDependencies in detectEnhancedState()

			// Development Environment - Enhanced with parsers
			state.buildTools = await this.detectBuildTools();
			state.testing = await this.detectTesting();
			state.codeQuality = await this.detectCodeQuality();
			state.developmentTools = await this.detectDevelopmentTools();

			// Project Structure
			state.architecture = await this.detectArchitecture();
			state.configuration = await this.detectConfiguration();
			state.documentation = await this.detectDocumentation();

			// Enhanced Detection (v0.3.3+)
			// Only include sections with actual content
			const infrastructure = await this.detectDatabases();
			if (this.hasInfrastructureContent(infrastructure)) {
				state.infrastructure = infrastructure;
			}

			const security = await this.detectSecurity();
			if (this.hasSecurityContent(security)) {
				state.security = security;
			}

			const api = await this.detectAPIArchitecture();
			if (this.hasAPIContent(api)) {
				state.api = api;
			}

			const deployment = await this.detectDeployment();
			if (this.hasDeploymentContent(deployment)) {
				state.deployment = deployment;
			}

			state.projectMetrics = await this.detectProjectMetrics();

			// Enhanced State Detection (v0.4.0+)
			await this.detectEnhancedState(state);

			return state;
		} catch (error) {
			return state;
		}
	}

	/**
	 * Check if infrastructure info has any content
	 */
	private hasInfrastructureContent(info: InfrastructureInfo): boolean {
		return info.databases.length > 0 ||
			info.cache.length > 0 ||
			info.queues.length > 0 ||
			info.storage.length > 0 ||
			info.messaging.length > 0;
	}

	/**
	 * Check if security info has any content
	 */
	private hasSecurityContent(info: SecurityInfo): boolean {
		return info.authFrameworks.length > 0 ||
			info.encryption.length > 0 ||
			info.vulnerabilityScanning.length > 0 ||
			info.secretsManagement.length > 0;
	}

	/**
	 * Check if API info has any content
	 */
	private hasAPIContent(info: APIInfo): boolean {
		return info.type.length > 0 ||
			info.documentation.length > 0 ||
			info.authentication.length > 0 ||
			info.versioning.length > 0;
	}

	/**
	 * Check if deployment info has any content
	 */
	private hasDeploymentContent(info: DeploymentInfo): boolean {
		return info.environments.length > 0 ||
			info.platforms.length > 0 ||
			info.orchestration.length > 0;
	}

	/**
	 * Enhanced state detection (v0.4.0+)
	 */
	private async detectEnhancedState(state: ProjectState): Promise<void> {
		try {
			// Phase 1: Project Identity & Purpose
			const projectTypeDetector = new ProjectTypeDetector();
			state.identity = await projectTypeDetector.detect(this.workspaceRoot);

			// Phase 1: Capabilities
			const capabilityExtractor = new CapabilityExtractor();
			state.capabilities = await capabilityExtractor.extract(this.workspaceRoot);

			// Phase 2: Enhanced Dependencies
			const dependencyMapper = new DependencyPurposeMapper();
			state.enhancedDependencies = await dependencyMapper.map(this.workspaceRoot);

			// For backward compatibility, populate legacy dependencies field from enhanced dependencies
			state.dependencies = this.generateLegacyDependencies(state.enhancedDependencies);

			// Phase 3: Platform-specific analysis
			if (state.identity.projectType === 'vscode-extension') {
				try {
					const vscodeAnalyzer = new VSCodeAnalyzer();
					const vscodeContext = await vscodeAnalyzer.analyze(this.workspaceRoot);
					state.platformContext = { vscode: vscodeContext };
				} catch (error) {
					// Not a VS Code extension or error analyzing
				}
			}

			// Phase 4: Architecture Detection
			const architectureDetector = new ArchitectureDetector();
			state.enhancedArchitecture = await architectureDetector.detect(this.workspaceRoot);

			// Phase 5: Agent Guidance
			const guidanceGenerator = new AgentGuidanceGenerator();
			state.agentGuidance = guidanceGenerator.generate({
				identity: state.identity,
				capabilities: state.capabilities,
				architecture: state.enhancedArchitecture,
				dependencies: state.enhancedDependencies,
				platformContext: state.platformContext
			});
		} catch (error) {
			// Enhanced detection failed, but continue with basic state
			console.error('Enhanced state detection failed:', error);
		}
	}

	/**
	 * Generate legacy dependencies format from enhanced dependencies
	 * For backward compatibility only
	 */
	private generateLegacyDependencies(enhanced: EnhancedDependencies | undefined): string[] {
		if (!enhanced) {
			return [];
		}

		const legacyDeps: string[] = [];

		// Extract all dependencies from byPurpose
		for (const category of Object.values(enhanced.byPurpose)) {
			for (const dep of category) {
				legacyDeps.push(`${dep.name} (${dep.version})`);
			}
		}

		return legacyDeps;
	}

	private async detectLanguages(): Promise<string[]> {
		const languages: string[] = [];

		// Check for .NET projects with version detection
		const dotnetResult = await this.dotnetParser.parseProjects(this.workspaceRoot);
		if (dotnetResult.success && dotnetResult.data && dotnetResult.data.length > 0) {
			const frameworkVersions = this.dotnetParser.getFrameworkVersions(dotnetResult.data);
			if (frameworkVersions.length > 0) {
				languages.push(...frameworkVersions.map(v => `C# (${v})`));
			} else {
				languages.push('C#');
			}
		}

		// Check for Python projects with version detection
		if (await this.fileExists('requirements.txt') || await this.fileExists('pyproject.toml')) {
			const pythonResult = await this.pythonParser.parseProjects(this.workspaceRoot);
			if (pythonResult.success && pythonResult.data) {
				const pythonVersion = pythonResult.data.requiresPython || '';
				if (pythonVersion) {
					languages.push(`Python ${pythonVersion}`);
				} else {
					languages.push('Python');
				}
			} else {
				languages.push('Python');
			}
		}

		// Check for Node.js projects with version detection
		if (await this.fileExists('package.json')) {
			const nodeResult = await this.nodeParser.parseProject(this.workspaceRoot);
			if (nodeResult && nodeResult.engines && nodeResult.engines.node) {
				languages.push(`JavaScript/TypeScript (${nodeResult.engines.node})`);
			} else {
				languages.push('JavaScript/TypeScript');
			}
		}

		// Check for other language indicators
		if (await this.fileExists('Cargo.toml')) {languages.push('Rust');}
		if (await this.fileExists('go.mod')) {languages.push('Go');}
		if (await this.fileExists('composer.json')) {languages.push('PHP');}
		if (await this.fileExists('Gemfile')) {languages.push('Ruby');}
		if (await this.fileExists('pom.xml') || await this.fileExists('build.gradle')) {languages.push('Java');}

		return languages;
	}

	private async detectFrameworks(): Promise<string[]> {
		const frameworks: string[] = [];

		// Check for .NET frameworks with enhanced detection
		const dotnetResult = await this.dotnetParser.parseProjects(this.workspaceRoot);
		if (dotnetResult.success && dotnetResult.data && dotnetResult.data.length > 0) {
			for (const project of dotnetResult.data) {
				if (project.isWebProject) {
					frameworks.push('ASP.NET Core');
				}
				if (project.isTestProject) {
					frameworks.push('xUnit (testing)');
				}
				if (project.targetFramework) {
					frameworks.push(`.NET ${project.targetFramework}`);
				}
			}
		}

		// Check for Node.js frameworks with enhanced detection
		if (await this.fileExists('package.json')) {
			const nodeResult = await this.nodeParser.parseProject(this.workspaceRoot);
			if (nodeResult) {
				frameworks.push('Node.js');
				if (nodeResult.frameworks.length > 0) {
					frameworks.push(...nodeResult.frameworks);
				}
				if (nodeResult.cloudSDKs.length > 0) {
					frameworks.push(...nodeResult.cloudSDKs);
				}
			} else {
				frameworks.push('Node.js');
			}
		}

		// Check for Python frameworks
		if (await this.fileExists('requirements.txt') || await this.fileExists('pyproject.toml') || await this.fileExists('setup.py')) {
			frameworks.push('Python');

			if (await this.fileExists('requirements.txt')) {
				try {
					const content = await this.readFile('requirements.txt');
					if (content.includes('django')) {frameworks.push('Django');}
					if (content.includes('flask')) {frameworks.push('Flask');}
					if (content.includes('fastapi')) {frameworks.push('FastAPI');}
					if (content.includes('pytest')) {frameworks.push('Pytest');}
				} catch (error) {
				}
			}
		}

		// Check for other frameworks
		if (await this.fileExists('Cargo.toml')) {frameworks.push('Rust');}
		if (await this.fileExists('go.mod')) {frameworks.push('Go');}
		if (await this.fileExists('composer.json')) {frameworks.push('PHP');}
		if (await this.fileExists('Gemfile')) {frameworks.push('Ruby');}
		if (await this.fileExists('pom.xml')) {frameworks.push('Java');}
		if (await this.fileExists('build.gradle')) {frameworks.push('Java/Gradle');}

		return [...new Set(frameworks)]; // Remove duplicates
	}

	private async detectConfigFiles(): Promise<string[]> {
		const configFiles: string[] = [];

		const commonConfigs = [
			'.editorconfig',
			'.eslintrc.js', '.eslintrc.json', '.eslintrc.yml',
			'.prettierrc', '.prettierrc.js', '.prettierrc.json',
			'webpack.config.js', 'vite.config.js', 'rollup.config.js',
			'.env', '.env.local', '.env.example',
			'tailwind.config.js', 'postcss.config.js',
			'babel.config.js', '.babelrc',
			'jest.config.js', 'vitest.config.js',
			'.github/workflows', 'azure-pipelines.yml',
			'Makefile', 'CMakeLists.txt'
		];

		for (const config of commonConfigs) {
			if (await this.fileExists(config)) {
				configFiles.push(config);
			}
		}

		return configFiles;
	}

	private async detectArchitecture(): Promise<string[]> {
		const architecture: string[] = [];

		// Detect primary project structure
		const hasCommands = await this.directoryExists('src/commands');
		const hasProviders = await this.directoryExists('src/providers');
		const hasScanner = await this.directoryExists('src/scanner');
		const hasServices = await this.directoryExists('src/services');
		const hasUtils = await this.directoryExists('src/utils');

		// VS Code extension structure
		if (hasProviders && hasCommands) {
			architecture.push('VS Code extension architecture (providers + commands)');
		}

		// Check for common architecture patterns
		if (await this.directoryExists('src')) {
			const srcSubdirs = await this.getSubdirectories('src');
			if (srcSubdirs.length > 0) {
				architecture.push(`src/ structure with ${srcSubdirs.length} subdirectories (${srcSubdirs.slice(0, 5).join(', ')}${srcSubdirs.length > 5 ? '...' : ''})`);
			} else {
				architecture.push('src/ structure (flat)');
			}
		}
		if (await this.directoryExists('lib')) {architecture.push('lib/ structure (library code)');}
		if (await this.directoryExists('components')) {architecture.push('Component-based (React/Vue/Angular components)');}
		if (await this.directoryExists('pages')) {architecture.push('Page-based routing (Next.js/Nuxt/file-based routing)');}
		if (await this.directoryExists('api')) {architecture.push('API layer (RESTful or GraphQL endpoints)');}
		if (hasServices) {architecture.push('Service layer (business logic encapsulation)');}
		if (await this.directoryExists('models')) {architecture.push('Model layer (data models/schemas)');}
		if (await this.directoryExists('controllers')) {architecture.push('MVC pattern (controllers handle requests)');}
		if (await this.directoryExists('middleware')) {architecture.push('Middleware pattern (request/response processing)');}
		if (hasUtils) {architecture.push('Utility functions (helper/shared functions)');}
		if (await this.directoryExists('tests') || await this.directoryExists('__tests__')) {
			architecture.push('Test structure (organized test suite)');
		}

		// Check for specific framework patterns
		if (await this.fileExists('next.config.js')) {architecture.push('Next.js framework (React SSR/SSG)');}
		if (await this.fileExists('nuxt.config.js')) {architecture.push('Nuxt.js framework (Vue SSR/SSG)');}
		if (await this.fileExists('angular.json')) {architecture.push('Angular framework (component-based)');}

		return architecture;
	}

	/**
	 * Get subdirectories of a directory
	 */
	private async getSubdirectories(relativePath: string): Promise<string[]> {
		try {
			const dirUri = vscode.Uri.joinPath(this.workspaceRoot, relativePath);
			const entries = await vscode.workspace.fs.readDirectory(dirUri);
			return entries
				.filter(([_, type]) => type === vscode.FileType.Directory)
				.map(([name]) => name)
				.filter(name => !name.startsWith('.'));
		} catch {
			return [];
		}
	}

	private async detectKeyFiles(): Promise<string[]> {
		const keyFiles: string[] = [];

		const importantFiles = [
			'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
			'tsconfig.json', 'jsconfig.json',
			'index.js', 'index.ts', 'main.js', 'main.ts',
			'app.js', 'app.ts', 'server.js', 'server.ts',
			'index.html', 'index.php',
			'Dockerfile', 'docker-compose.yml',
			'.gitignore', '.gitattributes'
		];

		for (const file of importantFiles) {
			if (await this.fileExists(file)) {
				keyFiles.push(file);
			}
		}

		return keyFiles;
	}

	private async detectBuildTools(): Promise<string[]> {
		const buildTools: string[] = [];

		// Get .NET SDK from parsed projects
		const dotnetResult = await this.dotnetParser.parseProjects(this.workspaceRoot);
		if (dotnetResult.success && dotnetResult.data && dotnetResult.data.length > 0) {
			const frameworkVersions = this.dotnetParser.getFrameworkVersions(dotnetResult.data);
			if (frameworkVersions.length > 0) {
				buildTools.push(`.NET SDK ${frameworkVersions[0]}`);
			} else {
				buildTools.push('.NET SDK');
			}
		}

		// Get Python build system from parsed projects
		const pythonResult = await this.pythonParser.parseProjects(this.workspaceRoot);
		if (pythonResult.success && pythonResult.data && pythonResult.data.buildSystem) {
			buildTools.push(`Python Build: ${pythonResult.data.buildSystem}`);
		}

		// Detect CI/CD configurations
		const ciResult = await this.ciParser.parseConfigurations(this.workspaceRoot);
		if (ciResult.success && ciResult.data && ciResult.data.length > 0) {
			for (const workflow of ciResult.data) {
				buildTools.push(`${workflow.type} (${workflow.name})`);
			}
		}

		// Build tools (existing logic)
		if (await this.fileExists('webpack.config.js')) {buildTools.push('Webpack');}
		if (await this.fileExists('vite.config.js')) {buildTools.push('Vite');}
		if (await this.fileExists('rollup.config.js')) {buildTools.push('Rollup');}
		if (await this.fileExists('parcel.config.js')) {buildTools.push('Parcel');}
		if (await this.fileExists('esbuild.config.js')) {buildTools.push('ESBuild');}
		if (await this.fileExists('tsconfig.json')) {buildTools.push('TypeScript Compiler');}
		if (await this.fileExists('babel.config.js') || await this.fileExists('.babelrc')) {buildTools.push('Babel');}

		return buildTools;
	}

	private async detectTesting(): Promise<string[]> {
		const testing: string[] = [];

		// Get testing frameworks from Node.js parser
		if (await this.fileExists('package.json')) {
			const nodeResult = await this.nodeParser.parseProject(this.workspaceRoot);
			if (nodeResult && nodeResult.testingFrameworks.length > 0) {
				testing.push(...nodeResult.testingFrameworks);
			}
		}

		// .NET test projects
		const dotnetResult = await this.dotnetParser.parseProjects(this.workspaceRoot);
		if (dotnetResult.success && dotnetResult.data && dotnetResult.data.length > 0) {
			for (const project of dotnetResult.data) {
				if (project.isTestProject) {
					testing.push('xUnit framework');
				}
			}
		}

		// Testing frameworks (existing logic)
		if (await this.fileExists('jest.config.js')) {testing.push('Jest');}
		if (await this.fileExists('vitest.config.js')) {testing.push('Vitest');}
		if (await this.fileExists('cypress.config.js')) {testing.push('Cypress');}
		if (await this.fileExists('playwright.config.js')) {testing.push('Playwright');}
		if (await this.fileExists('pytest.ini')) {testing.push('Pytest');}
		if (await this.fileExists('test/') || await this.fileExists('__tests__/') || await this.fileExists('tests/')) {
			testing.push('Test directory structure');
		}

		return [...new Set(testing)]; // Remove duplicates
	}

	private async detectCodeQuality(): Promise<string[]> {
		const codeQuality: string[] = [];

		// Code quality tools
		// Check for ESLint configuration files (ordered by commonality for early exit optimization)
		if (await this.fileExistsAny([
			'.eslintrc.json',
			'.eslintrc.yaml',
			'.eslintrc.yml',
			'.eslintrc.js',
			'.eslintrc',
			'eslint.config.js',
			'eslint.config.mjs',
			'eslint.config.cjs'
		])) {
			codeQuality.push('ESLint');
		}
		if (await this.fileExists('.prettierrc') || await this.fileExists('prettier.config.js')) {codeQuality.push('Prettier');}
		if (await this.fileExists('.stylelintrc')) {codeQuality.push('Stylelint');}
		if (await this.fileExists('tsconfig.json')) {codeQuality.push('TypeScript');}
		if (await this.fileExists('.editorconfig')) {codeQuality.push('EditorConfig');}

		return codeQuality;
	}

	private async detectConfiguration(): Promise<string[]> {
		const configuration: string[] = [];

		// Configuration files
		const configFiles = [
			'.gitignore', '.gitattributes',
			'.env', '.env.local', '.env.example',
			'tailwind.config.js', 'postcss.config.js',
			'docker-compose.yml', 'Dockerfile',
			'.github/workflows', 'azure-pipelines.yml',
			'Makefile', 'CMakeLists.txt'
		];

		for (const config of configFiles) {
			if (await this.fileExists(config)) {
				configuration.push(config);
			}
		}

		return configuration;
	}

	private async detectDevelopmentTools(): Promise<string[]> {
		const tools: string[] = [];

		// Package managers
		if (await this.fileExists('package-lock.json')) {tools.push('npm');}
		if (await this.fileExists('yarn.lock')) {tools.push('yarn');}
		if (await this.fileExists('pnpm-lock.yaml')) {tools.push('pnpm');}
		if (await this.fileExists('bun.lockb')) {tools.push('bun');}

		// Version control
		if (await this.directoryExists('.git')) {tools.push('Git');}
		if (await this.fileExists('.gitignore')) {tools.push('Git ignore configured');}

		// Docker
		if (await this.fileExists('Dockerfile')) {tools.push('Docker');}
		if (await this.fileExists('docker-compose.yml')) {tools.push('Docker Compose');}

		return tools;
	}

	private async fileExists(relativePath: string): Promise<boolean> {
		try {
			const uri = vscode.Uri.joinPath(this.workspaceRoot, relativePath);
			await vscode.workspace.fs.stat(uri);
			return true;
		} catch {
			return false;
		}
	}

	private async fileExistsAny(relativePaths: string[]): Promise<boolean> {
		for (const path of relativePaths) {
			if (await this.fileExists(path)) {
				return true;
			}
		}
		return false;
	}

	private async directoryExists(relativePath: string): Promise<boolean> {
		try {
			const uri = vscode.Uri.joinPath(this.workspaceRoot, relativePath);
			const stat = await vscode.workspace.fs.stat(uri);
			return stat.type === vscode.FileType.Directory;
		} catch {
			return false;
		}
	}

	private async readFile(relativePath: string): Promise<string> {
		const uri = vscode.Uri.joinPath(this.workspaceRoot, relativePath);
		const content = await vscode.workspace.fs.readFile(uri);
		return Buffer.from(content).toString('utf8');
	}

	private async readJsonFile(relativePath: string): Promise<any> {
		const content = await this.readFile(relativePath);
		return JSON.parse(content);
	}

	private async detectDependencies(): Promise<string[]> {
		const dependencies: string[] = [];

		// Get .NET dependencies with enhanced parsing
		const dotnetResult = await this.dotnetParser.parseProjects(this.workspaceRoot);
		if (dotnetResult.success && dotnetResult.data && dotnetResult.data.length > 0) {
			const dotnetDeps = this.dotnetParser.getImportantDependencies(dotnetResult.data);
			dependencies.push(...dotnetDeps);
		}

		// Get Python dependencies with enhanced parsing
		if (await this.fileExists('requirements.txt') || await this.fileExists('pyproject.toml')) {
			const pythonResult = await this.pythonParser.parseProjects(this.workspaceRoot);
			if (pythonResult.success && pythonResult.data) {
				const pythonDeps = this.pythonParser.getImportantDependencies(pythonResult.data);
				dependencies.push(...pythonDeps);
			}
		}

		// Analyze package.json dependencies (existing logic as fallback)
		if (await this.fileExists('package.json')) {
			try {
				const packageJson = await this.readJsonFile('package.json');
				const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

				// Key libraries and tools
				const importantDeps = [
					// TypeScript & JavaScript tooling
					'typescript', 'eslint', 'prettier', '@typescript-eslint/parser', '@typescript-eslint/eslint-plugin',
					// Testing frameworks
					'jest', 'vitest', 'cypress', 'mocha', '@vscode/test-electron',
					// Utilities
					'axios', 'lodash', 'moment', 'dayjs', 'uuid', 'crypto',
					// State management
					'redux', 'zustand', 'mobx', 'apollo-client', 'graphql',
					// Styling
					'tailwindcss', 'styled-components', 'emotion', 'sass', 'less',
					// Build tools
					'webpack', 'vite', 'rollup', 'parcel', 'esbuild',
					// VS Code extension development
					'@types/vscode',
					// Parsing & file handling
					'gray-matter', 'yaml', 'js-yaml', 'csv-parser'
				];

				for (const dep of importantDeps) {
					if (deps[dep]) {
						dependencies.push(`${dep} (${deps[dep]})`);
					}
				}

				// Pattern-based detection for VS Code extensions and common @types packages
				for (const [depName, depVersion] of Object.entries(deps)) {
					// VS Code extension packages (always include)
					if (depName.startsWith('@vscode/')) {
						if (!dependencies.some(d => d.startsWith(depName))) {
							dependencies.push(`${depName} (${depVersion})`);
						}
					}

					// Common @types packages only (whitelist approach)
					const importantTypes = ['@types/node', '@types/vscode', '@types/mocha', '@types/jest'];
					if (depName.startsWith('@types/') && importantTypes.includes(depName)) {
						if (!dependencies.some(d => d.startsWith(depName))) {
							dependencies.push(`${depName} (${depVersion})`);
						}
					}
				}
			} catch (error) {
			}
		}

		return dependencies;
	}

	private async detectInfrastructure(): Promise<string[]> {
		const infrastructure: string[] = [];

		// Database indicators
		if (await this.fileExists('docker-compose.yml')) {
			try {
				const content = await this.readFile('docker-compose.yml');
				if (content.includes('postgres') || content.includes('postgresql')) {infrastructure.push('PostgreSQL');}
				if (content.includes('mysql')) {infrastructure.push('MySQL');}
				if (content.includes('redis')) {infrastructure.push('Redis');}
				if (content.includes('mongodb')) {infrastructure.push('MongoDB');}
				if (content.includes('elasticsearch')) {infrastructure.push('Elasticsearch');}
			} catch (error) {
			}
		}

		// Environment files
		if (await this.fileExists('.env') || await this.fileExists('.env.local')) {
			try {
				const envFiles = ['.env', '.env.local', '.env.example'];
				for (const envFile of envFiles) {
					if (await this.fileExists(envFile)) {
						const content = await this.readFile(envFile);
						if (content.includes('DATABASE_URL') || content.includes('DB_HOST')) {infrastructure.push('Database configured');}
						if (content.includes('REDIS_URL')) {infrastructure.push('Redis configured');}
						if (content.includes('AWS_')) {infrastructure.push('AWS services');}
						if (content.includes('GOOGLE_')) {infrastructure.push('Google services');}
						break;
					}
				}
			} catch (error) {
			}
		}

		// Docker
		if (await this.fileExists('Dockerfile')) {infrastructure.push('Docker');}
		if (await this.fileExists('docker-compose.yml')) {infrastructure.push('Docker Compose');}
		if (await this.fileExists('k8s') || await this.directoryExists('k8s')) {infrastructure.push('Kubernetes');}

		return infrastructure;
	}

	private async detectDocumentation(): Promise<string[]> {
		const docs: string[] = [];

		// Documentation files
		const docFiles = [
			'README.md', 'README.rst', 'README.txt', 'README.adoc',
			'CHANGELOG.md', 'CHANGELOG.rst', 'CHANGELOG.txt',
			'CONTRIBUTING.md', 'CONTRIBUTING.rst',
			'CODE_OF_CONDUCT.md', 'CODE_OF_CONDUCT.rst',
			'SECURITY.md', 'SECURITY.rst',
			'LICENSE', 'LICENSE.md', 'LICENSE.txt'
		];

		for (const doc of docFiles) {
			if (await this.fileExists(doc)) {
				docs.push(doc);
			}
		}

		// Documentation directories
		if (await this.directoryExists('docs')) {docs.push('docs/ directory');}
		if (await this.directoryExists('documentation')) {docs.push('documentation/ directory');}
		if (await this.directoryExists('wiki')) {docs.push('wiki/ directory');}

		// API documentation
		if (await this.fileExists('swagger.json') || await this.fileExists('swagger.yaml')) {docs.push('Swagger/OpenAPI');}
		if (await this.fileExists('api.md')) {docs.push('API documentation');}

		return docs;
	}

	// Enhanced Detection Methods (v0.3.3+)

	/**
	 * Detect database technologies and ORMs
	 * Phase 1 (v0.3.3): Database Detection
	 */
	private async detectDatabases(): Promise<InfrastructureInfo> {
		const databases: string[] = [];
		const cache: string[] = [];
		const queues: string[] = [];
		const storage: string[] = [];
		const messaging: string[] = [];

		// Check package.json for database drivers
		if (await this.fileExists('package.json')) {
			try {
				const packageJson = await this.readJsonFile('package.json');
				const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

				// PostgreSQL
				if (DatabasePatterns.postgres.some(pattern => deps[pattern])) {
					databases.push('PostgreSQL');
				}

				// MySQL/MariaDB
				if (DatabasePatterns.mysql.some(pattern => deps[pattern])) {
					databases.push('MySQL/MariaDB');
				}

				// MongoDB
				if (DatabasePatterns.mongodb.some(pattern => deps[pattern])) {
					databases.push('MongoDB');
				}

				// Redis
				if (DatabasePatterns.redis.some(pattern => deps[pattern])) {
					cache.push('Redis');
				}

				// SQLite
				if (DatabasePatterns.sqlite.some(pattern => deps[pattern])) {
					databases.push('SQLite');
				}

				// SQL Server
				if (DatabasePatterns.sqlserver.some(pattern => deps[pattern])) {
					databases.push('SQL Server');
				}

				// Elasticsearch
				if (DatabasePatterns.elasticsearch.some(pattern => deps[pattern])) {
					databases.push('Elasticsearch');
				}

				// DynamoDB
				if (DatabasePatterns.dynamodb.some(pattern => deps[pattern])) {
					databases.push('Amazon DynamoDB');
				}

				// Check for ORMs
				if (ORMPatterns.prisma.some(pattern => deps[pattern])) {
					databases.push('Prisma (ORM)');
				}
				if (ORMPatterns.sequelize.some(pattern => deps[pattern])) {
					databases.push('Sequelize (ORM)');
				}
				if (ORMPatterns.typeorm.some(pattern => deps[pattern])) {
					databases.push('TypeORM (ORM)');
				}
				if (ORMPatterns.mongoose.some(pattern => deps[pattern])) {
					databases.push('Mongoose (ODM)');
				}

				// Check for message queues
				if (QueuePatterns.rabbitmq.some(pattern => deps[pattern])) {
					queues.push('RabbitMQ');
				}
				if (QueuePatterns.kafka.some(pattern => deps[pattern])) {
					messaging.push('Apache Kafka');
				}
				if (QueuePatterns.sqs.some(pattern => deps[pattern])) {
					queues.push('Amazon SQS');
				}
				if (QueuePatterns.azureServiceBus.some(pattern => deps[pattern])) {
					queues.push('Azure Service Bus');
				}
				if (QueuePatterns.googlePubSub.some(pattern => deps[pattern])) {
					messaging.push('Google Pub/Sub');
				}
				if (QueuePatterns.redis.some(pattern => deps[pattern])) {
					queues.push('Redis Queue (Bull/BeeQueue)');
				}
			} catch (error) {
				// Silently fail and continue with other detection methods
			}
		}

		// Check Python dependencies
		if (await this.fileExists('requirements.txt')) {
			try {
				const content = await this.readFile('requirements.txt');

				// PostgreSQL
				if (DatabasePatterns.postgres.some(pattern => content.toLowerCase().includes(pattern))) {
					databases.push('PostgreSQL');
				}

				// MySQL
				if (DatabasePatterns.mysql.some(pattern => content.toLowerCase().includes(pattern))) {
					databases.push('MySQL/MariaDB');
				}

				// MongoDB
				if (DatabasePatterns.mongodb.some(pattern => content.toLowerCase().includes(pattern))) {
					databases.push('MongoDB');
				}

				// Redis
				if (DatabasePatterns.redis.some(pattern => content.toLowerCase().includes(pattern))) {
					cache.push('Redis');
				}

				// SQLAlchemy ORM
				if (ORMPatterns.sqlalchemy.some(pattern => content.toLowerCase().includes(pattern))) {
					databases.push('SQLAlchemy (ORM)');
				}

				// Django ORM
				if (ORMPatterns.django.some(pattern => content.toLowerCase().includes(pattern))) {
					databases.push('Django ORM');
				}

				// Message queues
				if (QueuePatterns.rabbitmq.some(pattern => content.toLowerCase().includes(pattern))) {
					queues.push('RabbitMQ');
				}
				if (QueuePatterns.kafka.some(pattern => content.toLowerCase().includes(pattern))) {
					messaging.push('Apache Kafka');
				}
			} catch (error) {
				// Continue with other detection methods
			}
		}

		// Check docker-compose.yml for database services
		if (await this.fileExists('docker-compose.yml') || await this.fileExists('docker-compose.yaml')) {
			try {
				const content = await this.readFile(await this.fileExists('docker-compose.yml') ? 'docker-compose.yml' : 'docker-compose.yaml');

				if (content.includes('postgres:') || content.includes('postgresql:')) {
					databases.push('PostgreSQL (Docker)');
				}
				if (content.includes('mysql:') || content.includes('mariadb:')) {
					databases.push('MySQL/MariaDB (Docker)');
				}
				if (content.includes('mongo:') || content.includes('mongodb:')) {
					databases.push('MongoDB (Docker)');
				}
				if (content.includes('redis:')) {
					cache.push('Redis (Docker)');
				}
				if (content.includes('rabbitmq:')) {
					queues.push('RabbitMQ (Docker)');
				}
				if (content.includes('kafka:')) {
					messaging.push('Apache Kafka (Docker)');
				}
				if (content.includes('elasticsearch:')) {
					databases.push('Elasticsearch (Docker)');
				}
			} catch (error) {
				// Continue with other detection methods
			}
		}

		// Check .env files for database connection strings
		const envFiles = ['.env', '.env.local', '.env.example'];
		for (const envFile of envFiles) {
			if (await this.fileExists(envFile)) {
				try {
					const content = await this.readFile(envFile);

					if (content.includes('postgres://') || content.includes('postgresql://')) {
						databases.push('PostgreSQL');
					}
					if (content.includes('mysql://') || content.includes('DATABASE_URL=mysql')) {
						databases.push('MySQL');
					}
					if (content.includes('mongodb://') || content.includes('MONGO_URL')) {
						databases.push('MongoDB');
					}
					if (content.includes('REDIS_URL') || content.includes('redis://')) {
						cache.push('Redis');
					}

					break; // Only check first available env file
				} catch (error) {
					continue;
				}
			}
		}

		return {
			databases: deduplicateArray(databases),
			cache: deduplicateArray(cache),
			queues: deduplicateArray(queues),
			storage: deduplicateArray(storage),
			messaging: deduplicateArray(messaging)
		};
	}

	/**
	 * Detect security-related frameworks and tools
	 * Phase 2 (v0.3.4): Security Detection
	 */
	private async detectSecurity(): Promise<SecurityInfo> {
		const authFrameworks: string[] = [];
		const encryption: string[] = [];
		const vulnerabilityScanning: string[] = [];
		const secretsManagement: string[] = [];

		// Check package.json for security libraries
		if (await this.fileExists('package.json')) {
			try {
				const packageJson = await this.readJsonFile('package.json');
				const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

				// Authentication frameworks
				if (AuthPatterns.jwt.some(pattern => deps[pattern])) {
					authFrameworks.push('JWT');
				}
				if (AuthPatterns.passport.some(pattern => deps[pattern])) {
					authFrameworks.push('Passport.js');
				}
				if (AuthPatterns.auth0.some(pattern => deps[pattern])) {
					authFrameworks.push('Auth0');
				}
				if (AuthPatterns.okta.some(pattern => deps[pattern])) {
					authFrameworks.push('Okta');
				}
				if (AuthPatterns.firebase.some(pattern => deps[pattern])) {
					authFrameworks.push('Firebase Auth');
				}
				if (AuthPatterns.cognito.some(pattern => deps[pattern])) {
					authFrameworks.push('AWS Cognito');
				}

				// Vulnerability scanning
				if (VulnerabilityScanningPatterns.snyk.some(pattern => deps[pattern])) {
					vulnerabilityScanning.push('Snyk');
				}

				// Secrets management
				if (SecretsPatterns.dotenv.some(pattern => deps[pattern])) {
					secretsManagement.push('dotenv');
				}
				if (SecretsPatterns.vault.some(pattern => deps[pattern])) {
					secretsManagement.push('HashiCorp Vault');
				}
			} catch (error) {
				// Continue with other detection methods
			}
		}

		// Check for vulnerability scanning setup
		if (await this.fileExists('.snyk') || await this.fileExists('snyk.json')) {
			vulnerabilityScanning.push('Snyk');
		}
		if (await this.fileExists('.github/dependabot.yml')) {
			vulnerabilityScanning.push('Dependabot');
		}

		// Check for secrets management
		if (await this.fileExists('.env')) {
			secretsManagement.push('.env files');
		}

		return {
			authFrameworks: deduplicateArray(authFrameworks),
			encryption: deduplicateArray(encryption),
			vulnerabilityScanning: deduplicateArray(vulnerabilityScanning),
			secretsManagement: deduplicateArray(secretsManagement)
		};
	}

	/**
	 * Detect API architecture and documentation
	 * Phase 3 (v0.3.5): API Architecture Detection
	 */
	private async detectAPIArchitecture(): Promise<APIInfo> {
		const type: string[] = [];
		const documentation: string[] = [];
		const authentication: string[] = [];
		const versioning: string[] = [];

		// Check package.json for API frameworks
		if (await this.fileExists('package.json')) {
			try {
				const packageJson = await this.readJsonFile('package.json');
				const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

				// API types
				if (APIPatterns.rest.some(pattern => deps[pattern])) {
					type.push('REST API');
				}
				if (APIPatterns.graphql.some(pattern => deps[pattern])) {
					type.push('GraphQL');
				}
				if (APIPatterns.grpc.some(pattern => deps[pattern])) {
					type.push('gRPC');
				}
				if (APIPatterns.websocket.some(pattern => deps[pattern])) {
					type.push('WebSocket');
				}

				// API documentation
				if (APIPatterns.swagger.some(pattern => deps[pattern])) {
					documentation.push('Swagger/OpenAPI');
				}
			} catch (error) {
				// Continue with other detection methods
			}
		}

		// Check for API documentation files
		if (await this.fileExists('swagger.json') || await this.fileExists('swagger.yaml') || await this.fileExists('swagger.yml')) {
			documentation.push('Swagger/OpenAPI');
		}
		if (await this.fileExists('openapi.json') || await this.fileExists('openapi.yaml') || await this.fileExists('openapi.yml')) {
			documentation.push('OpenAPI');
		}
		if (await this.fileExists('graphql.schema') || await this.fileExists('schema.graphql')) {
			type.push('GraphQL');
			documentation.push('GraphQL Schema');
		}

		return {
			type: deduplicateArray(type),
			documentation: deduplicateArray(documentation),
			authentication: deduplicateArray(authentication),
			versioning: deduplicateArray(versioning)
		};
	}

	/**
	 * Detect deployment platforms and orchestration
	 * Phase 3 (v0.3.5): Deployment Detection
	 */
	private async detectDeployment(): Promise<DeploymentInfo> {
		const environments: string[] = [];
		const platforms: string[] = [];
		const orchestration: string[] = [];

		// Check for Docker
		if (await this.fileExists('Dockerfile')) {
			orchestration.push('Docker');
		}
		if (await this.fileExists('docker-compose.yml') || await this.fileExists('docker-compose.yaml')) {
			orchestration.push('Docker Compose');
		}

		// Check for Kubernetes
		if (await this.directoryExists('k8s') || await this.directoryExists('kubernetes')) {
			orchestration.push('Kubernetes');
		}
		if (await this.fileExists('helm')) {
			orchestration.push('Helm');
		}

		// Check for cloud platforms from package.json
		if (await this.fileExists('package.json')) {
			try {
				const packageJson = await this.readJsonFile('package.json');
				const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

				if (OrchestrationPatterns.kubernetes.some(pattern => deps[pattern])) {
					orchestration.push('Kubernetes');
				}
				if (OrchestrationPatterns.ecs.some(pattern => deps[pattern])) {
					platforms.push('AWS ECS');
				}
				if (OrchestrationPatterns.aks.some(pattern => deps[pattern])) {
					platforms.push('Azure AKS');
				}
				if (OrchestrationPatterns.gke.some(pattern => deps[pattern])) {
					platforms.push('Google GKE');
				}
			} catch (error) {
				// Continue with other detection methods
			}
		}

		// Check for platform-specific files
		if (await this.fileExists('vercel.json')) {
			platforms.push('Vercel');
		}
		if (await this.fileExists('netlify.toml')) {
			platforms.push('Netlify');
		}
		if (await this.fileExists('heroku.yml') || await this.fileExists('Procfile')) {
			platforms.push('Heroku');
		}

		// Check for environment files
		if (await this.fileExists('.env.development')) {
			environments.push('development');
		}
		if (await this.fileExists('.env.staging')) {
			environments.push('staging');
		}
		if (await this.fileExists('.env.production')) {
			environments.push('production');
		}

		return {
			environments: deduplicateArray(environments),
			platforms: deduplicateArray(platforms),
			orchestration: deduplicateArray(orchestration)
		};
	}

	/**
	 * Calculate project metrics
	 * Phase 4 (v0.4.0): Project Metrics
	 */
	private async detectProjectMetrics(): Promise<ProjectMetrics> {
		let filesAnalyzed = 0;
		let estimatedSize: 'small' | 'medium' | 'large' = 'small';
		let complexity: 'low' | 'medium' | 'high' = 'low';

		try {
			// Count source files
			const patterns = ['**/*.ts', '**/*.js', '**/*.py', '**/*.cs', '**/*.java'];
			for (const pattern of patterns) {
				const files = await vscode.workspace.findFiles(
					new vscode.RelativePattern(this.workspaceRoot, pattern),
					'**/node_modules/**'
				);
				filesAnalyzed += files.length;
			}

			// Estimate size based on file count
			if (filesAnalyzed < 50) {
				estimatedSize = 'small';
			} else if (filesAnalyzed < 200) {
				estimatedSize = 'medium';
			} else {
				estimatedSize = 'large';
			}

			// Estimate complexity based on directory structure and technologies
			const hasTests = await this.directoryExists('test') || await this.directoryExists('tests') || await this.directoryExists('__tests__');
			const hasDocker = await this.fileExists('Dockerfile');
			const hasCI = await this.fileExists('.github/workflows') || await this.fileExists('azure-pipelines.yml');
			const hasMultipleLanguages = (await this.detectLanguages()).length > 1;

			const complexityScore =
				(hasTests ? 1 : 0) +
				(hasDocker ? 1 : 0) +
				(hasCI ? 1 : 0) +
				(hasMultipleLanguages ? 1 : 0) +
				(filesAnalyzed > 100 ? 1 : 0);

			if (complexityScore <= 1) {
				complexity = 'low';
			} else if (complexityScore <= 3) {
				complexity = 'medium';
			} else {
				complexity = 'high';
			}
		} catch (error) {
			// Use default values
		}

		return {
			estimatedSize,
			complexity,
			filesAnalyzed,
			lastAnalyzed: new Date().toISOString()
		};
	}
}
