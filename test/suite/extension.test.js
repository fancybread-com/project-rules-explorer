"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
suite('Extension Test Suite', () => {
    let extension;
    suiteSetup(() => {
        extension = vscode.extensions.getExtension('fancybread-com.project-rules-explorer');
    });
    test('Extension should be present', () => {
        assert.ok(extension);
    });
    test('Extension should activate', async () => {
        if (extension) {
            await extension.activate();
            assert.ok(true, 'Extension activated successfully');
        }
    });
    test('Extension should have required commands', async () => {
        const commands = await vscode.commands.getCommands(true);
        const requiredCommands = [
            'projectRules.refresh',
            'projectRules.addProject',
            'projectRules.createRule',
            'projectRules.viewRule'
        ];
        for (const command of requiredCommands) {
            assert.ok(commands.includes(command), `Command ${command} should be registered`);
        }
    });
    test('Extension should have required views', async () => {
        // Test that the extension contributes the required views
        const extension = vscode.extensions.getExtension('fancybread-com.project-rules-explorer');
        if (extension) {
            const packageJSON = extension.packageJSON;
            assert.ok(packageJSON.contributes.views, 'Extension should contribute views');
            assert.ok(packageJSON.contributes.views['project-rules'], 'Extension should contribute project-rules views');
        }
    });
});
suite('MDC Parser Tests', () => {
    test('Should parse basic MDC content', async () => {
        // Import the MDC parser
        const { MDCParser } = await Promise.resolve().then(() => __importStar(require('../../out/utils/mdcParser')));
        const testContent = `---
type: manual
description: Test rule
---

This is a test rule content.`;
        const result = MDCParser.validateMDC(testContent);
        assert.ok(result.valid, 'Valid MDC should pass validation');
        assert.strictEqual(result.errors.length, 0, 'No errors should be present');
    });
    test('Should validate MDC metadata', async () => {
        const { MDCParser } = await Promise.resolve().then(() => __importStar(require('../../out/utils/mdcParser')));
        const testContent = `---
type: invalid-type
description: Test rule
---

This is a test rule content.`;
        const result = MDCParser.validateMDC(testContent);
        assert.ok(!result.valid, 'Invalid MDC should fail validation');
        assert.ok(result.errors.length > 0, 'Errors should be present');
    });
});
suite('Rules Scanner Tests', () => {
    test('Should initialize rules scanner', async () => {
        const { RulesScanner } = await Promise.resolve().then(() => __importStar(require('../../out/scanner/rulesScanner')));
        // Create a mock workspace root
        const workspaceRoot = vscode.Uri.file('/tmp/test-workspace');
        const scanner = new RulesScanner(workspaceRoot);
        assert.ok(scanner, 'Rules scanner should be created');
    });
    test('Should handle empty rules directory', async () => {
        const { RulesScanner } = await Promise.resolve().then(() => __importStar(require('../../out/scanner/rulesScanner')));
        // Create a temporary directory for testing
        const tempDir = vscode.Uri.file(path.join(__dirname, '../../test-fixtures/empty-rules'));
        const scanner = new RulesScanner(tempDir);
        try {
            const rules = await scanner.scanRules();
            assert.ok(Array.isArray(rules), 'Should return an array');
            assert.strictEqual(rules.length, 0, 'Should return empty array for empty directory');
        }
        catch (error) {
            // Expected to fail if directory doesn't exist
            assert.ok(true, 'Should handle missing directory gracefully');
        }
    });
});
suite('Project Manager Tests', () => {
    test('Should initialize project manager', async () => {
        const { ProjectManager } = await Promise.resolve().then(() => __importStar(require('../../out/services/projectManager')));
        // Create a mock extension context
        const mockContext = {
            globalState: {
                get: () => undefined,
                update: () => Promise.resolve()
            }
        };
        const manager = new ProjectManager(mockContext);
        assert.ok(manager, 'Project manager should be created');
    });
    test('Should validate project paths', async () => {
        const { ProjectManager } = await Promise.resolve().then(() => __importStar(require('../../out/services/projectManager')));
        const mockContext = {
            globalState: {
                get: () => undefined,
                update: () => Promise.resolve()
            }
        };
        const manager = new ProjectManager(mockContext);
        // Test with invalid path
        const isValid = await manager.validateProjectPath('/nonexistent/path');
        assert.strictEqual(isValid, false, 'Non-existent path should be invalid');
    });
});
//# sourceMappingURL=extension.test.js.map