const js = require('@eslint/js');

module.exports = [
    js.configs.recommended,
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            parser: require('@typescript-eslint/parser'),
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module',
                project: './tsconfig.json'
            },
            globals: {
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                exports: 'writable',
                module: 'writable',
                require: 'readonly',
                global: 'readonly'
            }
        },
        plugins: {
            '@typescript-eslint': require('@typescript-eslint/eslint-plugin')
        },
        rules: {
            // Disable base ESLint rules that are covered by TypeScript
            'no-unused-vars': 'off',
            'no-undef': 'off',
            
            // TypeScript-specific rules
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_'
                }
            ],
            
            // General rules
            'no-console': 'off',
            'prefer-const': 'warn',
            'no-var': 'error',
            'semi': ['error', 'always']
        }
    },
    {
        ignores: [
            'out/**/*',
            'node_modules/**/*',
            '*.d.ts',
            '**/*.js.map',
            'eslint.config.js'
        ]
    }
];