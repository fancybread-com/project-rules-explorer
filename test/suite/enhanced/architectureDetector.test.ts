// Unit tests for ArchitectureDetector
import * as assert from 'assert';
import * as vscode from 'vscode';
import { ArchitectureDetector } from '../../../src/scanner/enhanced/architectureDetector';

describe('ArchitectureDetector Test Suite', () => {
	let detector: ArchitectureDetector;
	let workspaceRoot: vscode.Uri;

	before(() => {
		detector = new ArchitectureDetector();

		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (workspaceFolders && workspaceFolders.length > 0) {
			workspaceRoot = workspaceFolders[0].uri;
		}
	});

	it('should detect architecture', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const arch = await detector.detect(workspaceRoot);

		assert.ok(arch, 'Architecture should be detected');
		assert.ok(arch.style, 'should have architecture style');
		assert.ok(arch.organization, 'should have organization type');
		assert.ok(Array.isArray(arch.patterns), 'patterns should be an array');
		assert.ok(Array.isArray(arch.entryPoints), 'entryPoints should be an array');
	});

	it('should detect architecture style', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const arch = await detector.detect(workspaceRoot);

		// Valid architecture styles
		const validStyles = ['layered', 'modular', 'component-oriented', 'simple'];
		assert.ok(validStyles.includes(arch.style),
			`Architecture style should be one of ${validStyles.join(', ')}, got ${arch.style}`);
	});

	it('should detect organization pattern', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const arch = await detector.detect(workspaceRoot);

		// Valid organization patterns
		const validOrgs = ['src-based', 'feature-based', 'service-oriented', 'mvc', 'flat'];
		assert.ok(validOrgs.includes(arch.organization),
			`Organization should be one of ${validOrgs.join(', ')}, got ${arch.organization}`);
	});

	it('should detect design patterns', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const arch = await detector.detect(workspaceRoot);

		// This project uses Provider and Command patterns
		assert.ok(Array.isArray(arch.patterns), 'patterns should be an array');

		if (arch.patterns.length > 0) {
			// Check that detected patterns are valid
			const validPatterns = [
				'Provider Pattern', 'Command Pattern', 'Factory Pattern',
				'Singleton Pattern', 'Observer Pattern', 'Adapter Pattern',
				'Builder Pattern', 'Strategy Pattern', 'Middleware Pattern',
				'Decorator Pattern'
			];

			arch.patterns.forEach(pattern => {
				assert.ok(validPatterns.includes(pattern),
					`${pattern} should be a valid design pattern`);
			});
		}
	});

	it('should find entry points', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const arch = await detector.detect(workspaceRoot);

		// This project has src/extension.ts as entry point
		assert.ok(Array.isArray(arch.entryPoints), 'entryPoints should be an array');
		assert.ok(arch.entryPoints.length > 0, 'should have at least one entry point');
		assert.ok(arch.entryPoints.includes('src/extension.ts'),
			'should detect src/extension.ts as entry point');
	});

	it('should detect Provider Pattern', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const arch = await detector.detect(workspaceRoot);

		// This project has provider files
		const hasProvider = arch.patterns.includes('Provider Pattern');
		assert.ok(hasProvider, 'should detect Provider Pattern');
	});

	it('should detect Command Pattern', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const arch = await detector.detect(workspaceRoot);

		// This project has command files
		const hasCommand = arch.patterns.includes('Command Pattern');
		assert.ok(hasCommand, 'should detect Command Pattern');
	});

	it('should provide complete architecture info', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const arch = await detector.detect(workspaceRoot);

		// Verify all required fields
		assert.ok(typeof arch.style === 'string', 'style should be string');
		assert.ok(arch.style.length > 0, 'style should not be empty');
		assert.ok(typeof arch.organization === 'string', 'organization should be string');
		assert.ok(arch.organization.length > 0, 'organization should not be empty');
		assert.ok(Array.isArray(arch.patterns), 'patterns should be array');
		assert.ok(Array.isArray(arch.entryPoints), 'entryPoints should be array');
	});
});

