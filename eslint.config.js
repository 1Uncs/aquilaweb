import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import reactCompiler from 'eslint-plugin-react-compiler';

export default [
  js.configs.recommended,
  {
    ignores: [
      'metro.config.cjs',
      'babel.config.js',
      'scripts/',
      'app/',
      'features/',
      'components/',
      'constants/',
      'hooks/',
      'lib/',
      'types/',
      'dist/',
      'node_modules/',
    ],
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        React: 'readonly',
        window: 'readonly',
        document: 'readonly',
        HTMLElement: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        AbortController: 'readonly',
        process: 'readonly',
        console: 'readonly',
        __DEV__: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-compiler': reactCompiler,
    },
    rules: {
      ...tsPlugin.configs['recommended'].rules,
      'react/no-unstable-nested-components': 'off',
      'react-hooks/exhaustive-deps': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      'react-compiler/react-compiler': 'off',
      'react-compiler/no-disallowed-names': 'off',
      'react-compiler/no-unstable-invariant-access': 'off',
      'react-compiler/no-leaked-side-effects': 'off',
      'react-compiler/no-unstable-interfaces': 'off',
      'react-compiler/no-unstable-dev-values': 'off',
      'react-compiler/no-unstable-symbol-access': 'off',
      'react-compiler/no-unstable-render': 'off',
      'react-compiler/no-mutation': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
];
