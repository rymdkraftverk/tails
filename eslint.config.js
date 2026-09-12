import globals from 'globals'
import prettier from 'eslint-config-prettier/flat'
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs'
import { configs, plugins } from 'eslint-config-airbnb-extended'
import tseslint from 'typescript-eslint'

const CONTROLLER = ['controller/**/*.{js,jsx,ts,tsx}']

const houseStyle = {
  name:  'tails/house-style',
  rules: {
    '@eslint-community/eslint-comments/no-unused-disable': 'error',
    '@stylistic/arrow-parens':                             [
      'error',
      'as-needed',
      { requireForBlockBody: true },
    ],
    '@stylistic/function-call-spacing':  ['error', 'never'],
    '@stylistic/member-delimiter-style': [
      'error',
      {
        multiline:  { delimiter: 'none' },
        singleline: { delimiter: 'comma' },
      },
    ],
    '@stylistic/key-spacing':                         ['error', { align: 'value' }],
    '@stylistic/max-len':                             ['error', { code: 100 }],
    '@stylistic/newline-per-chained-call':            ['error', { ignoreChainWithDepth: 1 }],
    '@stylistic/semi':                                ['error', 'never'],
    'import-x/no-cycle':                              'off',
    'import-x/no-rename-default':                     'off',
    'no-param-reassign':                              'off',
    '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
    '@typescript-eslint/no-use-before-define':        'off',
    'no-use-before-define':                           'off',
  },
}

export default [
  { ignores: ['**/dist/', '**/*.d.ts', 'game/public/', 'controller/public/'] },
  plugins.stylistic,
  plugins.importX,
  ...configs.base.typescript,
  ...tseslint.configs.recommended,
  comments.recommended,
  {
    name:            'tails/language',
    languageOptions: {
      ecmaVersion:   'latest',
      sourceType:    'module',
      parserOptions: { ecmaVersion: 'latest' },
    },
  },
  houseStyle,
  {
    name:            'tails/game',
    files:           ['game/**/*.{js,ts}'],
    languageOptions: { globals: { ...globals.browser, process: 'readonly' } },
    rules:           {
      'func-style':                     ['error', 'expression', { allowArrowFunctions: true }],
      'import-x/extensions':            ['error', 'never', { json: 'always' }],
      'import-x/prefer-default-export': 'off',
      'no-restricted-globals':          ['error', 'Text'],
    },
  },
  {
    name:  'tails/common',
    files: ['common/**/*.ts'],
    rules: {
      'func-style':             ['error', 'expression', { allowArrowFunctions: true }],
      'import-x/extensions':    ['error', 'never'],
      'import-x/no-unresolved': 'off',
    },
  },
  plugins.react,
  plugins.reactA11y,
  plugins.reactHooks,
  ...configs.react.recommended.map(config => ({ ...config, files: CONTROLLER })),
  {
    name:            'tails/controller',
    files:           CONTROLLER,
    languageOptions: { globals: { ...globals.browser, process: 'readonly' } },
    rules:           {
      'class-methods-use-this':                  'off',
      'import-x/extensions':                     ['error', 'never', { json: 'always' }],
      'jsx-a11y/click-events-have-key-events':   'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'react-hooks/exhaustive-deps':             'warn',
      'react-hooks/set-state-in-effect':         'warn',
      'react/destructuring-assignment':          'off',
      'react/jsx-filename-extension':            ['error', { extensions: ['.jsx', '.tsx'] }],
      'react/jsx-uses-react':                    'off',
      'react/react-in-jsx-scope':                'off',
      'react/sort-comp':                         'off',
      'react/require-default-props':             'off',
      'react/state-in-constructor':              'off',
    },
  },
  { name: 'tails/controller-formatting', files: CONTROLLER, ...prettier },
  {
    name:            'tails/tests',
    files:           ['**/test/**/*.{js,ts}', '**/*.test.{js,jsx,ts,tsx}'],
    languageOptions: { globals: globals.vitest },
    rules:           {
      '@stylistic/max-len':                  'off',
      'import-x/no-extraneous-dependencies': 'off',
      'no-var':                              'off',
      'vars-on-top':                         'off',
    },
  },
  {
    name:            'tails/node-scripts',
    files:           ['localIp.js'],
    languageOptions: { globals: globals.node },
    rules:           { 'no-console': 'off' },
  },
  {
    name:            'tails/config-files',
    files:           ['**/vite.config.js', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
    rules:           { 'import-x/no-extraneous-dependencies': 'off' },
  },
]
