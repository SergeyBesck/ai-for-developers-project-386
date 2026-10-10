import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['public/assets/**/*.js'],
    languageOptions: { globals: globals.browser, sourceType: 'script' },
  },
];