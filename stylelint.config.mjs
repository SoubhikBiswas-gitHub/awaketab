// DESIGN.md §12.4, §12.8: radii come from the --at-r-* scale by name (4 · 8 · 12 · 16 · 20 · 28 · 999), never as
// raw values. Allowed: 0, 50 %, the tokens and calc() over them.
// tokens.css defines the scale and is exempt.
const RADIUS_TOKENS = /^(?:0|50%|inherit|calc\(|var\(--at-r-[a-z0-9]+\)|[\s()+-])+$/u;

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
    'declaration-property-value-allowed-list': [
      { '/^border(-[a-z]+)*-radius$/': [RADIUS_TOKENS] },
      { message: (prop, value) => `${prop}: ${value} is not a radius token; use var(--at-r-*) (DESIGN.md §12.4)` },
    ],
  },
  overrides: [{ files: ['**/styles/tokens.css'], rules: { 'declaration-property-value-allowed-list': null } }],
};
