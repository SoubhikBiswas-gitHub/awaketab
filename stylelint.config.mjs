// DESIGN.md §12.4, §12.8: radii come from the --at-r-* scale by name (4 · 8 · 12 · 16 · 20 · 28 · 999), never as
// raw values. Allowed: 0, 50 %, the tokens and calc() over them (a nested corner may subtract --at-border).
// tokens.css defines the scale and is exempt.
const RADIUS_TOKENS = /^(?:0|50%|inherit|calc\(|var\(--at-r-[a-z0-9]+\)|var\(--at-border\)|[\s()+-])+$/u;
// DESIGN.md §12.8, from B2 on: rebuilt stylesheets (shell.css) take spacing, type and control heights by token only.
// Allowed: 0, auto, percentages, 1px borders, the tokens and calc() over them; --at-foot-* is the footer tilt clearance.
const SPACING_TOKENS =
  /^(?:0|auto|-?\d+%|calc\(|var\(--at-(?:s|gutter|section|card-pad|edge-min|dock-bottom|gap|h|border|icon|am|tl|foot)[a-z0-9-]*\)|[\s()*/+-]|\d+(?:\.\d+)?(?![\w%]))+$/u;
// --at-pg-type-* (pages.css), --at-am-type-* (ambient.css), --at-embed-type-* (embed.css) and --at-tl-* (the tool
// stylesheets) are named off-scale values, each defined once at the top of its file.
const TYPE_TOKENS = /^(?:inherit|var\(--at-(?:pg-|am-|embed-|tl-)?type-[a-z0-9-]+\))$/u;
// DESIGN.md §11.2: every border and outline width is --at-border (1 px hairline) or --at-ring (2 px focus), never a
// raw length. Drawings made of borders opt out in marked lines.
const LINE_PROPS = '/^(border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-width)?|outline(-width)?)$/';
const LINE_TOKENS = /^(?![\s\S]*(?<![\w.-])\d*\.?\d+(?:px|rem|em)(?![\w-]))[\s\S]*$/u;
// docs/05 §1.1: tool and shell colours come from the --at-* tokens (and color-mix over them), so every theme, colour
// theme and lamp stays AA. Masks only read alpha and are exempt; face art opts out in marked blocks.
const RAW_COLOUR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/iu;
const COLOUR_FILES = [
  'apps/web/src/styles/base.css',
  'apps/web/src/styles/shell.css',
  'apps/web/src/styles/footer.css',
  'apps/web/src/styles/header-menus.css',
  'apps/web/src/styles/update-banner.css',
  'apps/web/src/styles/icon-motion.css',
  'apps/web/src/styles/ambient.css',
  'apps/web/src/styles/tool*.css',
  'apps/web/src/tool/packs/**/*.css',
  'apps/web/public/assets/faces.css',
];
// docs/05 §1: the content, marketing and extension stylesheets take every colour from a var(--at-*) token. A mask
// reads alpha only, so it may name #000; drawings that keep fixed colours opt out in marked blocks.
const COLOUR_SHEETS = [
  '**/styles/content.css',
  '**/styles/article/*.css',
  '**/styles/hub.css',
  '**/styles/hub-gallery.css',
  '**/styles/pick-gallery.css',
  '**/styles/docs-hub.css',
  '**/styles/pages.css',
  '**/styles/pro.css',
  '**/styles/extension-page.css',
  '**/styles/home.css',
  '**/styles/home-*.css',
  '**/styles/tilt.css',
  '**/styles/icon-motion.css',
  '**/styles/page-404.css',
  '**/styles/embed.css',
  '**/styles/device-matrix.css',
  'apps/extension/src/styles/base.css',
  'apps/extension/entrypoints/*/*.css',
];

export default {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-use-logical-spec', './scripts/stylelint-button-geometry.mjs'],
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
      { '/^border(-[a-z]+)*-radius$/': [RADIUS_TOKENS], [LINE_PROPS]: [LINE_TOKENS] },
      {
        message: (prop, value) =>
          `${prop}: ${value} is not a token; use var(--at-r-*) for radii and var(--at-border) or var(--at-ring) for widths (DESIGN.md §11.2, §12.4)`,
      },
    ],
    'awaketab/button-geometry': true,
  },
  overrides: [
    { files: ['**/styles/tokens.css'], rules: { 'declaration-property-value-allowed-list': null } },
    {
      files: ['**/styles/shell.css', 'apps/extension/src/styles/base.css'],
      rules: { 'awaketab/button-geometry': null },
    },
    {
      files: COLOUR_FILES,
      rules: {
        'color-named': 'never',
        'declaration-property-value-disallowed-list': [
          { '/^(?!(-webkit-)?mask)/': [RAW_COLOUR] },
          {
            message: (prop, value) => `${prop}: ${value} uses a raw colour; use an --at-* colour token (docs/05 §1.1)`,
          },
        ],
      },
    },
    {
      // shell.css, content.css, the site pages, Pro, the embed page and the ambient modes. pages.css and ambient.css
      // name their few off-scale sizes once as --at-pg-* / --at-am-* custom properties and use them by name. The
      // pages.css drawings (kiosk screen, host page, state diagram) opt out in marked blocks (DESIGN.md §11.2).
      // The extension's four stylesheets name their off-scale values once at the top of each file (--at-ext-*).
      files: [
        '**/styles/shell.css',
        '**/styles/footer.css',
        '**/styles/header-menus.css',
        '**/styles/content.css',
        '**/styles/article/*.css',
        '**/styles/hub.css',
        '**/styles/docs-hub.css',
        '**/styles/hub-gallery.css',
        '**/styles/pick-gallery.css',
        '**/styles/home-*.css',
        '**/styles/home.css',
        '**/styles/device-matrix.css',
        '**/styles/pages.css',
        '**/styles/page-404.css',
        '**/styles/pro.css',
        '**/styles/extension-page.css',
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
            [LINE_PROPS]: [LINE_TOKENS],
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
    {
      files: COLOUR_SHEETS,
      rules: {
        'color-named': 'never',
        'declaration-property-value-disallowed-list': [
          { '/^(?!(?:-webkit-)?mask(?:-image)?$|--[\\w-]*mask$)/': [RAW_COLOUR] },
          {
            message: (prop, value) => `${prop}: ${value} is a raw colour; use a var(--at-*) colour token (docs/05 §1)`,
          },
        ],
      },
    },
  ],
};
