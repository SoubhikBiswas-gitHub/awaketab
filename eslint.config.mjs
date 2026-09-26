import eslint from '@eslint/js';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/dist-*/**',
      '**/.astro/**',
      '**/.output/**',
      '**/.output-test/**',
      '**/.wxt/**',
      '**/node_modules/**',
      'apps/web/public/**',
      // Agent/editor git worktrees are full repo copies; lint the checkout, not its clones.
      '.claude/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...astro.configs['flat/recommended'],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-deprecated': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'interface', format: ['PascalCase'], prefix: ['I'] },
        { selector: 'typeAlias', format: ['PascalCase'], prefix: ['T'] },
        // Astro derives Astro.props from a local `Props`; renaming it drops prop typing.
        { selector: 'interface', filter: { regex: '^Props$', match: true }, format: null },
        { selector: 'typeParameter', format: ['PascalCase'] },
      ],
      'no-restricted-globals': ['error', 'alert', 'confirm', 'prompt'],
      'no-restricted-syntax': [
        'error',
        { selector: 'TSEnumDeclaration', message: 'Use string-literal unions or `as const` maps; enums emit runtime code.' },
      ],
    },
  },
  {
    files: [
      'packages/**/test/**',
      'packages/**/src/adapters/**',
      'packages/**/*.d.ts',
      'apps/web/test/**',
      'apps/web/functions/**',
      '**/*.astro',
    ],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['**/*.mjs', '**/*.config.ts', '**/wxt.config.ts'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: [
      'apps/web/src/tool/**',
      'apps/web/src/components/ToolIsland.astro',
      'apps/web/src/layouts/BaseLayout.astro',
      'apps/web/src/pages/index.astro',
      'apps/web/src/pages/[preset].astro',
      'apps/web/src/pages/until/**',
      'apps/web/src/pages/pip.astro',
      'apps/web/src/pages/404.astro',
      'apps/web/src/pages/embed/**',
      'apps/web/src/pages/kiosk.astro',
      'apps/web/src/pages/library.astro',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/lib/ads', '**/ads'],
              message: 'Ad code may only be imported from ContentLayout.astro.',
            },
          ],
        },
      ],
    },
  },
);
