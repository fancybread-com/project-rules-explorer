// State Scanner - Scan project for configuration files and patterns
import * as vscode from 'vscode';
import { DotNetParser } from './parsers/dotnetParser';
import { PythonParser } from './parsers/pythonParser';
import { CIParser } from './parsers/ciParser';
import { NodeParser } from './parsers/nodeParser';

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
			state.dependencies = await this.detectDependencies();

			// Development Environment - Enhanced with parsers
			state.buildTools = await this.detectBuildTools();
			state.testing = await this.detectTesting();
			state.codeQuality = await this.detectCodeQuality();
			state.developmentTools = await this.detectDevelopmentTools();

			// Project Structure
			state.architecture = await this.detectArchitecture();
			state.configuration = await this.detectConfiguration();
			state.documentation = await this.detectDocumentation();

			return state;
		} catch (error) {
			return state;
		}
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

		// Check for common architecture patterns
		if (await this.directoryExists('src')) {architecture.push('src/ structure');}
		if (await this.directoryExists('lib')) {architecture.push('lib/ structure');}
		if (await this.directoryExists('components')) {architecture.push('Component-based');}
		if (await this.directoryExists('pages')) {architecture.push('Page-based routing');}
		if (await this.directoryExists('api')) {architecture.push('API layer');}
		if (await this.directoryExists('services')) {architecture.push('Service layer');}
		if (await this.directoryExists('models')) {architecture.push('Model layer');}
		if (await this.directoryExists('controllers')) {architecture.push('MVC pattern');}
		if (await this.directoryExists('middleware')) {architecture.push('Middleware pattern');}
		if (await this.directoryExists('utils')) {architecture.push('Utility functions');}
		if (await this.directoryExists('tests') || await this.directoryExists('__tests__')) {architecture.push('Test structure');}

		// Check for specific patterns
		if (await this.fileExists('next.config.js')) {architecture.push('Next.js App Router');}
		if (await this.fileExists('app/')) {architecture.push('App Directory');}
		if (await this.fileExists('pages/')) {architecture.push('Pages Directory');}

		return architecture;
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
}
