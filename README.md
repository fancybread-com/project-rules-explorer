# Project Rules Explorer

A VS Code extension for visualizing and managing Cursor rules and project state. This extension provides a tree view of all `.cursor/rules` directories in your workspace, allowing you to easily view, create, edit, and manage your Cursor rules.

## Features

- **Rules Visualization**: Tree view of all `.cursor/rules` directories
- **Rule Viewer**: Markdown preview with syntax highlighting
- **Rule Editor**: Create/edit rules with template scaffolding
- **Auto-refresh**: Watch file system for changes
- **Rule Management**: Visual indicators and management tools for rules
- **Enhanced State Detection** (v0.4.0):
  - **Database Detection**: PostgreSQL, MySQL, MongoDB, Redis, and more
  - **Security Analysis**: Auth frameworks, encryption, vulnerability scanning
  - **API Architecture**: REST, GraphQL, gRPC, WebSocket detection
  - **Deployment Info**: Docker, Kubernetes, cloud platforms
  - **Project Metrics**: Size, complexity, and file analysis
- **Multi-Project Support**: Add and manage multiple projects to reference their rules
- **Agent Export**: Export all projects, rules, and state to `.cursor/project-rules-export.json` for agent consumption

## Installation

1. Install the extension from the VS Code marketplace
2. Open a workspace with `.cursor/rules` directories
3. The "Project Rules" view will appear in the Explorer sidebar

> **Note**: The CD pipeline for marketplace deployment is currently disabled. The extension is in development and not yet ready for public release.

## Usage

### Viewing Rules
- Open the "Project Rules" view in the Explorer sidebar
- Browse through your rules organized by directory
- Click on any rule to view its content in a markdown preview

### Managing Rules
- Use the context menu on rules to edit, copy, or delete them
- Click the "+" button to create new rules
- Use the refresh button to manually update the view

### Exporting for Agent Consumption
- Click the "Export" button in the Project Rules Explorer view
- This creates `.cursor/project-rules-export.json` with all rules and state from all projects
- Agents in Cursor can now read this file to understand all your project rules across multiple projects

### Enhanced State Detection (v0.4.0)

The extension now provides **intelligent project analysis** designed specifically for AI agents, with comprehensive understanding of what your project is, how it works, and what agents should know when working on it.

#### Phase 1: Project Identity & Purpose
**What is this project?**
- **Project Type Detection**: Automatically identifies VS Code extensions, web apps, CLI tools, libraries, API servers, and more
- **Domain Classification**: Categorizes projects (developer-tools, ui-components, backend-services, frontend-applications, testing-tools, cli-tools, libraries, data-tools)
- **Primary Language**: Detects TypeScript, JavaScript, Python, C#, Go, Rust, Java, etc.
- **Maturity Level**: Assesses project stage (prototype, active-development, beta, stable, production, mature)

**What can this project do?**
- **Description**: Extracts from README.md and package.json
- **Primary Features**: Automatically extracts feature list from README
- **Data Formats**: Detects MDC, YAML, JSON, Markdown, CSV, XML, TOML, Protocol Buffers, GraphQL support

#### Phase 2: Enhanced Dependencies
**Why do dependencies exist?**
- **Purpose-Based Categorization**: Groups dependencies by their purpose:
  - **Parsing**: gray-matter, yaml, marked, csv-parser, xml2js
  - **Testing**: mocha, jest, vitest, cypress, playwright
  - **Build**: TypeScript, webpack, vite, rollup, esbuild
  - **Platform**: VS Code API, React, Vue, Angular
  - **Code Quality**: ESLint, Prettier, TypeScript
  - **Utility**: lodash, date-fns, axios
  - **HTTP**: axios, node-fetch, got
  - **Framework**: Express, Fastify, React, Vue
- **Critical Path**: Identifies dependencies essential to core functionality
- **Development-Only**: Separates dev dependencies from production

#### Phase 3: Platform-Specific Intelligence
**Deep VS Code Extension Analysis**:
- **Extension Type**: productivity, language-support, theme, debugger, snippets
- **Contribution Points**: Commands, views, configuration, menus, languages, themes
- **Capabilities**: Inferred from package.json (e.g., "Adds custom views to sidebar", "User-configurable settings")
- **Minimum VS Code Version**: Compatibility tracking
- **Activation Events**: When the extension activates

#### Phase 4: Architecture Detection
**How is it structured?**
- **Architecture Style**: layered, modular, component-oriented, MVC
- **Organization**: src-based, feature-based, service-oriented
- **Design Patterns**: Automatically detects:
  - Provider Pattern, Command Pattern, Factory Pattern
  - Singleton, Observer, Adapter, Builder, Strategy
  - Middleware Pattern, Decorator Pattern
- **Entry Points**: Identifies src/extension.ts, src/index.ts, src/main.ts, etc.

#### Phase 5: AI Agent Guidance
**Context-aware suggestions for AI agents**:
- **Suggested Approach**: Custom guidance based on project type
  - *VS Code Extension*: "Modifications should maintain VS Code API compatibility, properly dispose resources..."
  - *Web App*: "Consider component reusability, state management patterns..."
  - *Library*: "Maintain backwards compatibility, consider API stability..."
- **Critical Files**: Identifies files that are essential to understand (package.json, entry points, providers, etc.)
- **Common Tasks**: Suggests typical development tasks for this project type
- **Watch-Outs**: Project-specific warnings and best practices
  - *VS Code*: "Dispose resources properly in deactivate()", "Use vscode.workspace.fs for file operations"
  - *Production projects*: "Maintain backwards compatibility", "Update CHANGELOG for all changes"

#### Database & Infrastructure Detection
- **Databases**: PostgreSQL, MySQL, MongoDB, Redis, SQLite, SQL Server, Elasticsearch, DynamoDB
- **ORMs**: Prisma, Sequelize, TypeORM, Mongoose, SQLAlchemy, Django ORM
- **Message Queues**: RabbitMQ, Apache Kafka, Amazon SQS, Azure Service Bus, Google Pub/Sub

#### Security Analysis
- **Authentication**: JWT, Passport.js, Auth0, Okta, Firebase Auth, AWS Cognito
- **Vulnerability Scanning**: Snyk, Dependabot
- **Secrets Management**: dotenv, HashiCorp Vault, AWS Secrets Manager, GCP Secret Manager

#### API Architecture & Deployment
- **API Types**: REST, GraphQL, gRPC, WebSocket
- **Documentation**: Swagger/OpenAPI, GraphQL Schema
- **Containers**: Docker, Docker Compose
- **Orchestration**: Kubernetes, Helm
- **Platforms**: AWS, Azure, GCP, Vercel, Netlify, Heroku

#### Project Metrics
- **Size**: Small (<50 files), Medium (50-200 files), Large (>200 files)
- **Complexity**: Low, Medium, High based on structure, testing, CI/CD, languages
- **File Counts**: Detailed analysis of source files
- **Timestamp**: Last analyzed date/time

### Export Format

All detected information is automatically included in `.cursor/project-rules-export.json` with the following structure:

```json
{
  "identity": {
    "projectType": "vscode-extension",
    "domain": "developer-tools",
    "primaryLanguage": "TypeScript",
    "maturityLevel": "active-development"
  },
  "capabilities": {
    "description": "VS Code extension for managing project rules...",
    "primaryFeatures": ["Parse MDC files", "Display rules in tree view", ...],
    "dataFormats": ["MDC", "YAML", "JSON"]
  },
  "enhancedDependencies": {
    "byPurpose": {
      "parsing": [{"name": "gray-matter", "purpose": "Parse YAML frontmatter", ...}],
      "testing": [...],
      "platform": [...]
    },
    "criticalPath": ["gray-matter", "yaml"],
    "devOnly": ["mocha", "eslint"]
  },
  "platformContext": {
    "vscode": {
      "extensionType": "productivity",
      "capabilities": ["Provides custom commands", "Adds custom views"],
      ...
    }
  },
  "enhancedArchitecture": {
    "style": "layered",
    "patterns": ["Provider Pattern", "Command Pattern"],
    "entryPoints": ["src/extension.ts"]
  },
  "agentGuidance": {
    "suggestedApproach": "This is a VS Code extension. Modifications should...",
    "criticalFiles": ["package.json", "src/extension.ts", ...],
    "commonTasks": ["Adding new commands", "Enhancing tree view", ...],
    "watchOuts": ["Dispose resources properly", "Use vscode.workspace.fs", ...]
  }
}
```

This comprehensive analysis helps AI agents understand your project deeply and provide more contextually appropriate suggestions.

## MDC Format

This extension works with Cursor's MDC (Markdown with Cursor) format, which includes:
- YAML frontmatter with metadata
- Markdown content body
- Support for file references (e.g., `@service-template.ts`)

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch

# Run tests
npm test
```

## Deployment

The CD pipeline for marketplace deployment is currently **disabled**. To enable it when ready for public release:

1. **Configure Marketplace Secrets**:
   - Add `VSCE_PAT` secret to GitHub repository settings
   - Create a Personal Access Token with marketplace publishing permissions

2. **Enable CD Pipeline**:
   - Uncomment the workflow triggers in `.github/workflows/cd.yml`
   - Remove the `if: false` condition from the disabled job

3. **Test Deployment**:
   - Create a release to trigger marketplace publishing
   - Verify extension appears in VS Code marketplace

## License

MIT License - see LICENSE file for details.
