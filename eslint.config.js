// ESLint 9 flat config format
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');

module.exports = [
	{
		files: ['src/**/*.ts'],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				ecmaVersion: 6,
				sourceType: 'module'
			}
		},
		plugins: {
			'@typescript-eslint': tseslint
		},
		rules: {
			'@typescript-eslint/naming-convention': [
				'warn',
				{
					selector: 'import',
					format: ['camelCase', 'PascalCase']
				}
			],
			'curly': 'warn',
			'eqeqeq': 'warn',
			'no-throw-literal': 'warn',
			'semi': ['warn', 'always']
		}
	},
	{
		ignores: ['out/**', 'dist/**', '**/*.d.ts', 'node_modules/**']
	}
];

