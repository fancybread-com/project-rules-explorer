// State Scanner - Scan project for configuration files and patterns
import * as vscode from 'vscode';

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
	constructor(private workspaceRoot: vscode.Uri) {}

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
			// Technology Stack
			state.languages = await this.detectLanguages();
			state.frameworks = await this.detectFrameworks();
			state.dependencies = await this.detectDependencies();

			// Development Environment
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

		// Check for language indicators
		if (await this.fileExists('package.json')) {languages.push('JavaScript/TypeScript');}
		if (await this.fileExists('requirements.txt') || await this.fileExists('pyproject.toml')) {languages.push('Python');}
		if (await this.fileExists('Cargo.toml')) {languages.push('Rust');}
		if (await this.fileExists('go.mod')) {languages.push('Go');}
		if (await this.fileExists('composer.json')) {languages.push('PHP');}
		if (await this.fileExists('Gemfile')) {languages.push('Ruby');}
		if (await this.fileExists('pom.xml') || await this.fileExists('build.gradle')) {languages.push('Java');}

		return languages;
	}

	private async detectFrameworks(): Promise<string[]> {
		const frameworks: string[] = [];

		// Check for package.json (Node.js/JavaScript)
		if (await this.fileExists('package.json')) {
			frameworks.push('Node.js');

			// Check for specific frameworks in package.json
			try {
				const packageJson = await this.readJsonFile('package.json');
				const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

				if (deps.react) {frameworks.push('React');}
				if (deps.vue) {frameworks.push('Vue');}
				if (deps.angular) {frameworks.push('Angular');}
				if (deps.next) {frameworks.push('Next.js');}
				if (deps.nuxt) {frameworks.push('Nuxt.js');}
				if (deps.express) {frameworks.push('Express');}
				if (deps.fastify) {frameworks.push('Fastify');}
				if (deps.koa) {frameworks.push('Koa');}
			} catch (error) {
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

		// Build tools
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

		// Testing frameworks
		if (await this.fileExists('jest.config.js')) {testing.push('Jest');}
		if (await this.fileExists('vitest.config.js')) {testing.push('Vitest');}
		if (await this.fileExists('cypress.config.js')) {testing.push('Cypress');}
		if (await this.fileExists('playwright.config.js')) {testing.push('Playwright');}
		if (await this.fileExists('pytest.ini')) {testing.push('Pytest');}
		if (await this.fileExists('test/') || await this.fileExists('__tests__/') || await this.fileExists('tests/')) {
			testing.push('Test directory structure');
		}

		return testing;
	}

	private async detectCodeQuality(): Promise<string[]> {
		const codeQuality: string[] = [];

		// Code quality tools
		if (await this.fileExists('.eslintrc') || await this.fileExists('eslint.config.js')) {codeQuality.push('ESLint');}
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

		// Analyze package.json dependencies
		if (await this.fileExists('package.json')) {
			try {
				const packageJson = await this.readJsonFile('package.json');
				const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

				// Key libraries and tools
				const importantDeps = [
					'typescript', 'eslint', 'prettier', 'jest', 'vitest', 'cypress',
					'axios', 'lodash', 'moment', 'dayjs', 'uuid', 'crypto',
					'redux', 'zustand', 'mobx', 'apollo-client', 'graphql',
					'tailwindcss', 'styled-components', 'emotion', 'sass', 'less',
					'webpack', 'vite', 'rollup', 'parcel', 'esbuild'
				];

				for (const dep of importantDeps) {
					if (deps[dep]) {
						dependencies.push(`${dep} (${deps[dep]})`);
					}
				}
			} catch (error) {
			}
		}

		// Python dependencies
		if (await this.fileExists('requirements.txt')) {
			try {
				const content = await this.readFile('requirements.txt');
				const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
				const importantPkgs = ['requests', 'numpy', 'pandas', 'django', 'flask', 'fastapi', 'sqlalchemy', 'pytest'];

				for (const line of lines) {
					const pkg = line.split('==')[0].split('>=')[0].split('<=')[0].split('~=')[0].split('!=')[0].trim();
					if (importantPkgs.includes(pkg.toLowerCase())) {
						dependencies.push(`Python: ${pkg}`);
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
