// Integration tests for Enhanced State Detection
import * as assert from 'assert';
import * as vscode from 'vscode';
import { StateScanner } from '../../../src/scanner/stateScanner';

describe('Enhanced State Integration Test Suite', () => {
	let scanner: StateScanner;
	let workspaceRoot: vscode.Uri;

	before(() => {
		// Use the actual workspace (this project) for testing
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (workspaceFolders && workspaceFolders.length > 0) {
			workspaceRoot = workspaceFolders[0].uri;
			scanner = new StateScanner(workspaceRoot);
		}
	});

	it('should scan complete enhanced state', async () => {
		if (!scanner) {
			assert.fail('No workspace root available');
		}

		const state = await scanner.scanState();

		// Basic state should exist
		assert.ok(state, 'State should exist');
		assert.ok(Array.isArray(state.languages), 'languages should be an array');
		assert.ok(Array.isArray(state.frameworks), 'frameworks should be an array');

		// Enhanced state should exist
		assert.ok(state.identity, 'identity should exist');
		assert.ok(state.capabilities, 'capabilities should exist');
		assert.ok(state.enhancedDependencies, 'enhancedDependencies should exist');
		assert.ok(state.enhancedArchitecture, 'enhancedArchitecture should exist');
		assert.ok(state.agentGuidance, 'agentGuidance should exist');
	});

	it('should detect VS Code extension identity', async () => {
		if (!scanner) {
			assert.fail('No workspace root available');
		}

		const state = await scanner.scanState();

		assert.strictEqual(state.identity?.projectType, 'vscode-extension',
			'should detect VS Code extension');
		assert.strictEqual(state.identity?.primaryLanguage, 'TypeScript',
			'should detect TypeScript');
		assert.ok(state.identity?.maturityLevel, 'should have maturity level');
	});

	it('should have VS Code platform context', async () => {
		if (!scanner) {
			assert.fail('No workspace root available');
		}

		const state = await scanner.scanState();

		assert.ok(state.platformContext?.vscode, 'should have VS Code platform context');
		assert.strictEqual(state.platformContext.vscode.extensionType, 'productivity',
			'should be productivity extension');
		assert.ok(state.platformContext.vscode.contributes.commands > 0,
			'should have commands');
		assert.ok(state.platformContext.vscode.contributes.views > 0,
			'should have views');
	});

	it('should categorize dependencies by purpose', async () => {
		if (!scanner) {
			assert.fail('No workspace root available');
		}

		const state = await scanner.scanState();

		const deps = state.enhancedDependencies;
		assert.ok(deps, 'Enhanced dependencies should exist');
		assert.ok(deps.byPurpose, 'byPurpose should exist');

		// This project has parsing dependencies (gray-matter, yaml)
		assert.ok(deps.byPurpose.parsing.length > 0, 'should have parsing dependencies');

		// should have critical path
		assert.ok(Array.isArray(deps.criticalPath), 'criticalPath should be an array');
	});

	it('should detect architecture patterns', async () => {
		if (!scanner) {
			assert.fail('No workspace root available');
		}

		const state = await scanner.scanState();

		const arch = state.enhancedArchitecture;
		assert.ok(arch, 'Enhanced architecture should exist');
		assert.ok(arch.style, 'should have architecture style');
		assert.ok(arch.organization, 'should have organization type');
		assert.ok(Array.isArray(arch.patterns), 'patterns should be an array');
		assert.ok(Array.isArray(arch.entryPoints), 'entryPoints should be an array');

		// This project has src/extension.ts as entry point
		assert.ok(arch.entryPoints.includes('src/extension.ts'),
			'should detect src/extension.ts as entry point');
	});

	it('should generate agent guidance', async () => {
		if (!scanner) {
			assert.fail('No workspace root available');
		}

		const state = await scanner.scanState();

		const guidance = state.agentGuidance;
		assert.ok(guidance, 'Agent guidance should exist');
		assert.ok(guidance.suggestedApproach, 'should have suggested approach');
		assert.ok(Array.isArray(guidance.criticalFiles), 'criticalFiles should be an array');
		assert.ok(Array.isArray(guidance.commonTasks), 'commonTasks should be an array');
		assert.ok(Array.isArray(guidance.watchOuts), 'watchOuts should be an array');

		// Guidance should be relevant to VS Code extensions
		assert.ok(guidance.suggestedApproach.includes('VS Code'),
			'Approach should mention VS Code');
		assert.ok(guidance.watchOuts.length > 0, 'should have watch-outs');
	});

	it('should have comprehensive capabilities', async () => {
		if (!scanner) {
			assert.fail('No workspace root available');
		}

		const state = await scanner.scanState();

		const caps = state.capabilities;
		assert.ok(caps, 'Capabilities should exist');
		assert.ok(caps.description.length > 0, 'should have description');
		assert.ok(Array.isArray(caps.primaryFeatures), 'primaryFeatures should be an array');
		assert.ok(Array.isArray(caps.dataFormats), 'dataFormats should be an array');

		// This project handles MDC, YAML, JSON
		assert.ok(caps.dataFormats.includes('MDC') || caps.dataFormats.includes('YAML'),
			'should detect MDC or YAML support');
	});
});

