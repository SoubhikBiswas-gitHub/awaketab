// DESIGN.md §12.4, §12.8: radii come from the --at-r-* scale by name (4 · 8 · 12 · 16 · 20 · 28 · 999), never as
// raw values. Allowed: 0, 50 %, the tokens and calc() over them (a nested corner may subtract --at-border).
// tokens.css defines the scale and is exempt.
const RADIUS_TOKENS = /^(?:0|50%|inherit|calc\(|var\(--at-r-[a-z0-9]+\)|var\(--at-border\)|[\s()+-])+$/u;
// DESIGN.md §12.8, from B2 on: rebuilt stylesheets (shell.css) take spacing, type and control heights by token only.
// Allowed: 0, auto, percentages, 1px borders, the tokens and calc() over them.
const SPACING_TOKENS =
  /^(?:0|auto|-?\d+%|calc\(|var\(--at-(?:s|gutter|section|card-pad|edge-min|dock-bottom|gap|h|border|icon|am|tl)[a-z0-9-]*\)|[\s()*/+-]|\d+(?:\.\d+)?(?![\w%]))+$/u;
// --at-pg-type-* (pages.css), --at-am-type-* (ambient.css), --at-embed-type-* (embed.css) and --at-tl-* (the tool
// stylesheets) are named off-scale values, each defined once at the top of its file.
const TYPE_TOKENS = /^(?:inherit|var\(--at-(?:pg-|am-|embed-|tl-)?type-[a-z0-9-]+\))$/u;

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
      // shell.css, content.css, the site pages, Pro, the embed page and the ambient modes. pages.css and ambient.css
      // name their few off-scale sizes once as --at-pg-* / --at-am-* custom properties and use them by name. The
      // pages.css drawings (kiosk screen, host page, state diagram) opt out in marked blocks (DESIGN.md §11.2).
      // The extension's four stylesheets name their off-scale values once at the top of each file (--at-ext-*).
      files: [
        '**/styles/shell.css',
        '**/styles/content.css',
        '**/styles/article/*.css',
        '**/styles/hub.css',
        '**/styles/hub-gallery.css',
        '**/styles/device-matrix.css',
        '**/styles/pages.css',
        '**/styles/page-404.css',
        '**/styles/pro.css',
        '**/styles/ambient.css',
        '**/styles/embed.css',
        'apps/extension/src/styles/base.css',
        'apps/extension/entrypoints/popup/popup.css',
        'apps/extension/entrypoints/options/options.css',
        'apps/extension/entrypoints/welcome/welcome.css',
        '**/styles/base.css',
        '**/styles/tool.css',
        '**/styles/tool-full.css',
        '**/styles/tool-embed.css',
        '**/styles/tool-more.css',
        '**/styles/tool-page.css',
        '**/styles/tool-until.css',
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
