module.exports = {
  extends: [require.resolve('@entrio/config/eslint/nest')],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
