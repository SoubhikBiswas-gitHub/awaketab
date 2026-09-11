export default {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-use-logical-spec'],
  rules: {
    'at-rule-no-unknown': [
      true,
      { ignoreAtRules: ['theme', 'custom-variant', 'slot', 'apply', 'utility', 'variant', 'source', 'plugin'] },
    ],
    'at-rule-prelude-no-invalid': [true, { ignoreAtRules: ['apply', 'custom-variant', 'theme'] }],
    'custom-property-empty-line-before': 'never',
    'import-notation': 'string',
    'liberty/use-logical-spec': [
      'always',
      {
        except: ['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height'],
      },
    ],
  },
};
