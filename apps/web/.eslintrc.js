module.exports = {
  root: true,
  // require.resolve() bypasses ESLint's shareable-config name mangling, which would
  // otherwise rewrite "@entrio/config/eslint/next" to "@entrio/eslint-config-config/...".
  extends: [require.resolve('@entrio/config/eslint/next')],
};
