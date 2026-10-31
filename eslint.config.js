
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Files and directories ESLint should ignore.
  {
    ignores: [
      'dist/**',
      'dist-ssr/**',
      'coverage/**',
      'node_modules/**',
    ],
  },

  // React and TypeScript application code.
  {
    files: ['**/*.{ts,tsx}'],

    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],

    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },

    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },

    rules: {
      // React Hooks rules.
      ...reactHooks.configs.recommended.rules,

      // Prevent incompatible component exports with React Fast Refresh.
      'react-refresh/only-export-components': [
        'warn',
        {
          allowConstantExport: true,
        },
      ],
    },
  },

  // Node.js configuration files.
  {
    files: [
      '**/*.config.{js,mjs,cjs,ts,mts,cts}',
      '**/vite.config.{js,mjs,cjs,ts,mts,cts}',
    ],

    languageOptions: {
      globals: globals.node,
    },
  }
);
