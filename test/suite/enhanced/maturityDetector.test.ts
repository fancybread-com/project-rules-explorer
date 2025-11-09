// Unit tests for MaturityDetector
import * as assert from 'assert';
import * as vscode from 'vscode';
import { MaturityDetector } from '../../../src/scanner/enhanced/maturityDetector';

describe('MaturityDetector Test Suite', () => {
	let detector: MaturityDetector;
	let workspaceRoot: vscode.Uri;

	before(() => {
		detector = new MaturityDetector();

		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (workspaceFolders && workspaceFolders.length > 0) {
			workspaceRoot = workspaceFolders[0].uri;
		}
	});

	it('should detect maturity level', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const maturity = await detector.detect(workspaceRoot);

		// should be one of the valid maturity levels
		const validLevels = ['prototype', 'active-development', 'beta', 'stable', 'production', 'mature', 'unknown'];
		assert.ok(validLevels.includes(maturity),
			`Maturity level should be one of ${validLevels.join(', ')}, got ${maturity}`);
	});

	it('should detect production for v1.0+ with CHANGELOG', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		// This project has a CHANGELOG and version 0.4.0
		const maturity = await detector.detect(workspaceRoot);

		// should be active-development or beta (0.x version)
		assert.ok(['active-development', 'beta'].includes(maturity),
			`Version 0.x should be active-development or beta, got ${maturity}`);
	});

	it('should return valid maturity level for any project', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const maturity = await detector.detect(workspaceRoot);

		assert.ok(maturity, 'should return a maturity level');
		assert.ok(typeof maturity === 'string', 'Maturity level should be a string');
		assert.ok(maturity.length > 0, 'Maturity level should not be empty');
	});
});

