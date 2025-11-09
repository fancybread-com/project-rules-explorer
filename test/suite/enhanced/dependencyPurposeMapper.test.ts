// Unit tests for DependencyPurposeMapper
import * as assert from 'assert';
import * as vscode from 'vscode';
import { DependencyPurposeMapper } from '../../../src/scanner/enhanced/dependencyPurposeMapper';

describe('DependencyPurposeMapper Test Suite', () => {
	let mapper: DependencyPurposeMapper;
	let workspaceRoot: vscode.Uri;

	before(() => {
		mapper = new DependencyPurposeMapper();

		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (workspaceFolders && workspaceFolders.length > 0) {
			workspaceRoot = workspaceFolders[0].uri;
		}
	});

	it('should map dependencies with purposes', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const deps = await mapper.map(workspaceRoot);

		assert.ok(deps, 'Dependencies should be mapped');
		assert.ok(deps.byPurpose, 'should have byPurpose categorization');
		assert.ok(Array.isArray(deps.criticalPath), 'criticalPath should be an array');
		assert.ok(Array.isArray(deps.devOnly), 'devOnly should be an array');
	});

	it('should categorize parsing dependencies', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const deps = await mapper.map(workspaceRoot);

		// This project has gray-matter and yaml
		assert.ok(Array.isArray(deps.byPurpose.parsing), 'parsing should be an array');
		assert.ok(deps.byPurpose.parsing.length > 0, 'should have parsing dependencies');

		// Check for gray-matter
		const grayMatter = deps.byPurpose.parsing.find(d => d.name === 'gray-matter');
		assert.ok(grayMatter, 'should find gray-matter in parsing dependencies');
		assert.strictEqual(grayMatter?.purpose, 'Parse YAML frontmatter', 'should have correct purpose');
		assert.strictEqual(grayMatter?.critical, true, 'gray-matter should be critical');
	});

	it('should categorize testing dependencies', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const deps = await mapper.map(workspaceRoot);

		// This project has mocha
		assert.ok(Array.isArray(deps.byPurpose.testing), 'testing should be an array');

		if (deps.byPurpose.testing.length > 0) {
			const mocha = deps.byPurpose.testing.find(d => d.name === 'mocha');
			if (mocha) {
				assert.strictEqual(mocha.purpose, 'Test runner', 'should have correct purpose');
				assert.strictEqual(mocha.critical, false, 'mocha should not be critical');
			}
		}
	});

	it('should identify critical path dependencies', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const deps = await mapper.map(workspaceRoot);

		// Critical dependencies should not include dev-only
		assert.ok(Array.isArray(deps.criticalPath), 'criticalPath should be an array');

		// gray-matter and yaml are critical production dependencies
		const hasCritical = deps.criticalPath.some(name =>
			name === 'gray-matter' || name === 'yaml'
		);
		assert.ok(hasCritical, 'should have critical dependencies');
	});

	it('should separate dev-only dependencies', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const deps = await mapper.map(workspaceRoot);

		// Dev dependencies should include mocha, eslint, etc.
		assert.ok(Array.isArray(deps.devOnly), 'devOnly should be an array');
		assert.ok(deps.devOnly.length > 0, 'should have dev-only dependencies');

		// Common dev dependencies
		const hasDevDeps = deps.devOnly.some(name =>
			['mocha', 'eslint', 'typescript', '@types/vscode'].includes(name)
		);
		assert.ok(hasDevDeps, 'should include common dev dependencies');
	});

	it('should have all required category structures', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const deps = await mapper.map(workspaceRoot);

		// Check all category structures exist
		const categories = ['parsing', 'testing', 'build', 'platform', 'code-quality', 'utility', 'http', 'framework'];
		for (const category of categories) {
			assert.ok(Array.isArray(deps.byPurpose[category as keyof typeof deps.byPurpose]),
				`${category} should be an array`);
		}
	});

	it('should provide version information for dependencies', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const deps = await mapper.map(workspaceRoot);

		// Find any dependency and check structure
		const allDeps = [
			...deps.byPurpose.parsing,
			...deps.byPurpose.testing,
			...deps.byPurpose.build,
			...deps.byPurpose.platform
		];

		if (allDeps.length > 0) {
			const dep = allDeps[0];
			assert.ok(dep.name, 'Dependency should have name');
			assert.ok(dep.version, 'Dependency should have version');
			assert.ok(dep.purpose, 'Dependency should have purpose');
			assert.ok(typeof dep.critical === 'boolean', 'Dependency should have critical flag');
		}
	});
});

