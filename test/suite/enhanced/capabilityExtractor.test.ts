// Unit tests for CapabilityExtractor
import * as assert from 'assert';
import * as vscode from 'vscode';
import { CapabilityExtractor } from '../../../src/scanner/enhanced/capabilityExtractor';

describe('CapabilityExtractor Test Suite', () => {
	let extractor: CapabilityExtractor;
	let workspaceRoot: vscode.Uri;

	before(() => {
		extractor = new CapabilityExtractor();

		// Use the actual workspace (this project) for testing
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (workspaceFolders && workspaceFolders.length > 0) {
			workspaceRoot = workspaceFolders[0].uri;
		}
	});

	it('should extract description', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const capabilities = await extractor.extract(workspaceRoot);

		// should have a description (from package.json or README)
		assert.ok(capabilities.description, 'should have a description');
		assert.ok(capabilities.description.length > 0, 'Description should not be empty');
		assert.notStrictEqual(capabilities.description, 'No description available',
			'should have a real description');
	});

	it('should extract data formats', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const capabilities = await extractor.extract(workspaceRoot);

		// This project uses YAML and MDC formats
		assert.ok(Array.isArray(capabilities.dataFormats), 'dataFormats should be an array');
		assert.ok(capabilities.dataFormats.includes('YAML'), 'should detect YAML format');
		assert.ok(capabilities.dataFormats.includes('MDC'), 'should detect MDC format');
		assert.ok(capabilities.dataFormats.includes('JSON'), 'should detect JSON format');
	});

	it('should extract primary features', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		const capabilities = await extractor.extract(workspaceRoot);

		// Features should be an array (may be empty if no README features section)
		assert.ok(Array.isArray(capabilities.primaryFeatures), 'primaryFeatures should be an array');
	});

	it('should handle projects without README', async () => {
		if (!workspaceRoot) {
			assert.fail('No workspace root available');
		}

		// Even without README, should return valid structure
		const capabilities = await extractor.extract(workspaceRoot);

		assert.ok(capabilities.description !== undefined, 'description should be defined');
		assert.ok(Array.isArray(capabilities.primaryFeatures), 'primaryFeatures should be an array');
		assert.ok(Array.isArray(capabilities.dataFormats), 'dataFormats should be an array');
	});
});

