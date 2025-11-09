// Unit tests for VSCodeAnalyzer
import * as assert from 'assert';
import * as vscode from 'vscode';
import { VSCodeAnalyzer } from '../../../src/scanner/enhanced/platforms/vscodeAnalyzer';

describe('VSCodeAnalyzer Test Suite', () => {
	let analyzer: VSCodeAnalyzer;
	let workspaceRoot: vscode.Uri;

	before(() => {
		analyzer = new VSCodeAnalyzer();

		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (workspaceFolders && workspaceFolders.length > 0) {
			workspaceRoot = workspaceFolders[0].uri;
		}
	});

	it('should analyze VS Code extension', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const context = await analyzer.analyze(workspaceRoot);

		assert.ok(context, 'should return VS Code context');
		assert.ok(context.extensionType, 'should have extension type');
		assert.ok(context.category, 'should have category');
		assert.ok(context.minVersion, 'should have minimum version');
	});

	it('should detect productivity extension type', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const context = await analyzer.analyze(workspaceRoot);

		// This project is a productivity extension (has commands and views)
		assert.strictEqual(context.extensionType, 'productivity',
			'should be productivity extension');
	});

	it('should count contribution points', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const context = await analyzer.analyze(workspaceRoot);

		// This project has commands, views, configuration, and menus
		assert.ok(context.contributes, 'should have contributes');
		assert.ok(context.contributes.commands > 0, 'should have commands');
		assert.ok(context.contributes.views > 0, 'should have views');
		assert.strictEqual(context.contributes.configuration, true, 'should have configuration');
		assert.strictEqual(context.contributes.menus, true, 'should have menus');
	});

	it('should infer capabilities', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const context = await analyzer.analyze(workspaceRoot);

		// Check capabilities array
		assert.ok(Array.isArray(context.capabilities), 'capabilities should be an array');
		assert.ok(context.capabilities.length > 0, 'should have capabilities');

		// should include relevant capabilities
		const hasCommands = context.capabilities.includes('Provides custom commands');
		const hasViews = context.capabilities.includes('Adds custom views to sidebar');
		const hasConfig = context.capabilities.includes('User-configurable settings');

		assert.ok(hasCommands || hasViews || hasConfig,
			'should have at least one capability');
	});

	it('should track activation events', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const context = await analyzer.analyze(workspaceRoot);

		assert.ok(Array.isArray(context.activation), 'activation should be an array');
		// This project has activation events
		if (context.activation.length > 0) {
			assert.ok(context.activation.some(e => e.includes('projectRules') || e.includes('onView')),
				'should have project-specific activation events');
		}
	});

	it('should detect minimum VS Code version', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const context = await analyzer.analyze(workspaceRoot);

		// should have a version string
		assert.ok(context.minVersion, 'should have minimum version');
		assert.ok(context.minVersion.includes('1.'), 'Version should be 1.x');
	});

	it('should handle extension category', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const context = await analyzer.analyze(workspaceRoot);

		assert.ok(context.category, 'should have category');
		assert.ok(typeof context.category === 'string', 'Category should be string');
	});

	it('should provide complete extension context', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const context = await analyzer.analyze(workspaceRoot);

		// Verify complete structure
		assert.ok(context.extensionType, 'extensionType should exist');
		assert.ok(context.category, 'category should exist');
		assert.ok(context.minVersion, 'minVersion should exist');
		assert.ok(Array.isArray(context.activation), 'activation should be array');
		assert.ok(context.contributes, 'contributes should exist');
		assert.ok(typeof context.contributes.commands === 'number', 'commands should be number');
		assert.ok(typeof context.contributes.views === 'number', 'views should be number');
		assert.ok(typeof context.contributes.configuration === 'boolean', 'configuration should be boolean');
		assert.ok(typeof context.contributes.menus === 'boolean', 'menus should be boolean');
		assert.ok(typeof context.contributes.languages === 'number', 'languages should be number');
		assert.ok(typeof context.contributes.themes === 'number', 'themes should be number');
		assert.ok(Array.isArray(context.capabilities), 'capabilities should be array');
	});
});

