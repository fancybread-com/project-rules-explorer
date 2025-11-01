# Project Rules Explorer

A VS Code extension for visualizing and managing Cursor rules and project state. This extension provides a tree view of all `.cursor/rules` directories in your workspace, allowing you to easily view, create, edit, and manage your Cursor rules.

## Features

- **Rules Visualization**: Tree view of all `.cursor/rules` directories
- **Rule Viewer**: Markdown preview with syntax highlighting
- **Rule Editor**: Create/edit rules with template scaffolding
- **Auto-refresh**: Watch file system for changes
- **Rule Management**: Visual indicators and management tools for rules
- **Project State**: Detect and display project configuration patterns
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
