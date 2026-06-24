/** ESLint config for the NestJS API. */
module.exports = {
  extends: [require.resolve('./base.js')],
  parserOptions: {
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
};
