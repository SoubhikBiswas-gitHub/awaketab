// DESIGN.md §12.4, §12.8: radii come from the --at-r-* scale by name (4 · 8 · 12 · 16 · 20 · 28 · 999), never as
// raw values. Allowed: 0, 50 %, the tokens and calc() over them.
// tokens.css defines the scale and is exempt.
const RADIUS_TOKENS = /^(?:0|50%|inherit|calc\(|var\(--at-r-[a-z0-9]+\)|[\s()+-])+$/u;
// DESIGN.md §12.8, from B2 on: rebuilt stylesheets (shell.css) take spacing, type and control heights by token only.
// Allowed: 0, auto, percentages, 1px borders, the tokens and calc() over them.
const SPACING_TOKENS =
  /^(?:0|auto|-?\d+%|calc\(|var\(--at-(?:s|gutter|section|card-pad|edge-min|dock-bottom|gap|h|border|icon)[a-z0-9-]*\)|[\s()*/+-]|\d+(?:\.\d+)?(?![\w%]))+$/u;
// --at-pg-type-* are pages.css's named off-scale roles (display numerals, code, the mocks), defined once at its top.
const TYPE_TOKENS = /^(?:inherit|var\(--at-(?:pg-)?type-[a-z0-9-]+\))$/u;

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
  overrides: [
    { files: ['**/styles/tokens.css'], rules: { 'declaration-property-value-allowed-list': null } },
    {
      // shell.css (B2), content.css (B5), pages.css (B6, the site pages) and pro.css (B7). pages.css names its few
      // off-scale sizes once as --at-pg-* custom properties and uses them by name; its two illustrations (the kiosk
      // screen, the host page) and the state diagram opt out in marked blocks, as DESIGN.md §11.2 exempts drawings and mocks.
      files: [
        '**/styles/shell.css',
        '**/styles/content.css',
        '**/styles/article/*.css',
        '**/styles/hub.css',
        '**/styles/device-matrix.css',
        '**/styles/pages.css',
        '**/styles/page-404.css',
        '**/styles/pro.css',
      ],
      rules: {
        'declaration-property-value-allowed-list': [
          {
            '/^border(-[a-z]+)*-radius$/': [RADIUS_TOKENS],
            '/^(padding|margin|gap|row-gap|column-gap)(-[a-z]+)*$/': [SPACING_TOKENS],
            '/^(min-|max-)?(block|inline)-size$/': [
              /^(?!.*\d+(?:\.\d+)?(?:px|rem|em)\b).*$/u,
              /^(?:26px|6px|4px|36px)$/u,
            ],
            '/^font$/': [TYPE_TOKENS],
            '/^(font-size|line-height)$/': [/^$/u],
          },
          {
            message: (prop, value) => `${prop}: ${value} is not a token; use var(--at-*) (DESIGN.md §12)`,
          },
        ],
      },
    },
  ],
};
