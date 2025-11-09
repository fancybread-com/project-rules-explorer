// Unit tests for ProjectTypeDetector
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { ProjectTypeDetector } from '../../../src/scanner/enhanced/projectTypeDetector';

describe('ProjectTypeDetector Test Suite', () => {
	let detector: ProjectTypeDetector;
	let workspaceRoot: vscode.Uri;

	before(() => {
		detector = new ProjectTypeDetector();

		// Use the actual workspace (this project) for testing
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (workspaceFolders && workspaceFolders.length > 0) {
			workspaceRoot = workspaceFolders[0].uri;
		}
	});

	it('should detect VS Code extension project type', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const identity = await detector.detect(workspaceRoot);

		assert.strictEqual(identity.projectType, 'vscode-extension',
			'should detect this project as a VS Code extension');
	});

	it('should detect developer-tools domain', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const identity = await detector.detect(workspaceRoot);

		// This project should be in developer-tools domain
		assert.strictEqual(identity.domain, 'developer-tools',
			'should detect developer-tools domain');
	});

	it('should detect TypeScript as primary language', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const identity = await detector.detect(workspaceRoot);

		assert.strictEqual(identity.primaryLanguage, 'TypeScript',
			'should detect TypeScript as primary language');
	});

	it('should detect maturity level', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const identity = await detector.detect(workspaceRoot);

		// should be one of the valid maturity levels
		const validLevels = ['prototype', 'active-development', 'beta', 'stable', 'production', 'mature', 'unknown'];
		assert.ok(validLevels.includes(identity.maturityLevel),
			`Maturity level should be one of ${validLevels.join(', ')}, got ${identity.maturityLevel}`);
	});

	it('should detect complete identity', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const identity = await detector.detect(workspaceRoot);

		// All fields should be populated
		assert.ok(identity.projectType, 'projectType should be populated');
		assert.ok(identity.domain, 'domain should be populated');
		assert.ok(identity.primaryLanguage, 'primaryLanguage should be populated');
		assert.ok(identity.maturityLevel, 'maturityLevel should be populated');
	});
});

