import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

const restrictNest = {
  regex: '^@nestjs/',
  message: 'The domain must not depend on NestJS. Keep it in src/infra.',
};
const restrictInfra = {
  regex: '(^@/|/)infra(/|$)',
  message:
    'The domain must not import infra. Define an interface (gateway) in the domain.',
};
const restrictPrisma = {
  regex: '(^@prisma/|/generated/prisma(/|$))',
  message: 'Prisma is only allowed in repository/ and factory/.',
};
const restrictInfraExceptDatabase = {
  regex: '(^@/|/)infra/(?!database(/|$))',
  message: 'repository/ and factory/ may only import the database infra.',
};

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-duplicate-imports': 'error',
    },
  },
  {
    files: ['src/modules/**/*.ts'],
    ignores: ['src/modules/**/repository/**', 'src/modules/**/factory/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [restrictNest, restrictInfra, restrictPrisma] },
      ],
    },
  },
  {
    files: [
      'src/modules/**/repository/**/*.ts',
      'src/modules/**/factory/**/*.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [restrictNest, restrictInfraExceptDatabase] },
      ],
    },
  },
  {
    ignores: [
      'eslint.config.mjs',
      'dist/',
      'node_modules/',
      'coverage/',
      'prisma/',
      '.github/',
      '.husky/',
      'src/infra/database/generated/',
    ],
  },
];
