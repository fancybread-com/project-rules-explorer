# Project Rules Explorer - Test Suite

This directory contains comprehensive unit tests for the Project Rules Explorer VS Code extension, covering all major functionality including rule management, project state detection, tree view operations, and extension lifecycle.

## Test Structure

### Core Logic Tests
- **`coreLogic.test.ts`** - Tests core business logic without VS Code dependencies
- **`mdcParser.test.ts`** - Tests MDC (Markdown with YAML frontmatter) parsing and generation
- **`stateScanner.test.ts`** - Tests project state detection and analysis
- **`rulesScanner.test.ts`** - Tests rule file scanning and parsing

### Extension Integration Tests
- **`extension.test.ts`** - Tests extension activation and command registration
- **`extensionLifecycle.test.ts`** - Tests extension lifecycle, activation, deactivation, and resource management
- **`integration.test.ts`** - End-to-end integration tests covering complete workflows

### UI and Tree View Tests
- **`ruleLabels.test.ts`** - Tests rule display in tree view, label removal, and context-aware icons
- **`iconDetection.test.ts`** - Tests context-aware icon assignment for rules based on content
- **`fileWatcher.test.ts`** - Tests file system watching and change detection

### Command and Project Management Tests
- **`ruleCommands.test.ts`** - Tests rule management commands (create, copy, paste, delete, rename)
- **`projectCommands.test.ts`** - Tests project management commands and operations

## Running Tests

### All Tests
```bash
npm test
```

### Compile Tests Only
```bash
npm run compile:test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

## Test Categories

### 1. Core Logic Tests
Tests basic functionality without VS Code environment:
- **MDC Parser**: Content validation, YAML frontmatter parsing, structure validation
- **State Scanner**: Language detection, framework identification, dependency analysis
- **Rules Scanner**: Rule file scanning, MDC format validation, file operations
- **Core Logic**: Business logic validation, data structures, utility functions

### 2. Extension Integration Tests
Tests extension loading and activation:
- **Extension Lifecycle**: Activation, deactivation, resource management, error recovery
- **Command Registration**: All commands properly registered and functional
- **Integration Workflows**: Complete user workflows from start to finish
- **Error Handling**: Graceful error recovery and user feedback

### 3. UI and Tree View Tests
Tests user interface and tree view functionality:
- **Rule Display**: Individual rule display without labels, proper grouping
- **Context-Aware Icons**: Dynamic icon assignment based on rule content and filename
- **Tree Structure**: Proper hierarchy, categorization, and navigation
- **File Watching**: Real-time updates when files change

### 4. Command and Project Management Tests
Tests user commands and project operations:
- **Rule Commands**: Create, copy, paste, delete, rename operations
- **Project Commands**: Project creation, editing, removal, switching
- **Context Menus**: Right-click functionality and command availability
- **Input Validation**: User input validation and error handling

## Test Coverage

The comprehensive test suite covers:

### ✅ **Core Functionality**
- MDC parsing and generation
- Project state detection and analysis
- Rule file scanning and management
- File system operations and watching

### ✅ **Extension Lifecycle**
- Extension activation and deactivation
- Command registration and execution
- Resource management and cleanup
- Error handling and recovery

### ✅ **User Interface**
- Tree view structure and display
- Context-aware icon assignment
- Rule labeling and grouping
- File watching and real-time updates

### ✅ **User Commands**
- Rule management (create, copy, paste, delete, rename)
- Project management (create, edit, remove, switch)
- Context menu functionality
- Input validation and user feedback

### ✅ **Integration Workflows**
- Complete project setup workflows
- Rule management workflows
- State scanning and analysis
- File system integration

## Test Fixtures

The test suite includes comprehensive test data:
- **Sample Rule Files**: Valid and invalid MDC files for testing
- **Project Configurations**: Various project setups and structures
- **Mock Data**: VS Code API mocks and test utilities
- **Edge Cases**: Error conditions and boundary testing

## Troubleshooting

### Common Issues

1. **VS Code Module Not Found**: Tests that require VS Code modules must run in the VS Code test environment
2. **TypeScript Compilation Errors**: Ensure all dependencies are properly typed
3. **Test Timeout**: Some tests may timeout if VS Code environment is not properly initialized
4. **Mock Configuration**: Ensure VS Code mocks are properly configured for each test

### Debug Mode

To run tests with verbose output:
```bash
node ./out/test/runTest.js --reporter spec
```

### Test-Specific Debugging

For specific test categories:
```bash
# Run only core logic tests
npm test -- --grep "Core Logic"

# Run only UI tests
npm test -- --grep "Rule Display"

# Run only command tests
npm test -- --grep "Rule Commands"
```

## Adding New Tests

When adding new tests:

1. **Follow naming convention**: `*.test.ts`
2. **Use descriptive test names**: Clear, specific test descriptions
3. **Include comprehensive coverage**: Positive, negative, and edge cases
4. **Test error conditions**: Ensure proper error handling
5. **Update this README**: Document new test categories
6. **Mock VS Code APIs**: Use proper mocks for VS Code dependencies
7. **Test isolation**: Ensure tests don't interfere with each other

## Test Dependencies

- **Mocha**: Test framework and runner
- **TypeScript**: Compilation and type checking
- **VS Code Test API**: Extension testing framework
- **Assert**: Assertion library for test validation
- **Custom Mocks**: VS Code API mocks and test utilities

## Test Architecture

### Mock Strategy
- **VS Code APIs**: Comprehensive mocks for all VS Code dependencies
- **File System**: Mock file operations for testing
- **User Interface**: Mock tree view and command interactions
- **Extension Context**: Mock extension lifecycle and resource management

### Test Organization
- **Unit Tests**: Individual component testing
- **Integration Tests**: Cross-component workflow testing
- **End-to-End Tests**: Complete user scenario testing
- **Error Testing**: Edge cases and error condition validation

## Current Test Status

**Total Test Files**: 12
**Test Categories**: 4 (Core Logic, Extension Integration, UI/Tree View, Commands/Projects)
**Coverage Areas**: 15+ major functionality areas
**Test Quality**: Comprehensive with positive, negative, and edge case testing

The test suite provides robust coverage of all extension functionality, ensuring reliability and maintainability of the Project Rules Explorer extension.