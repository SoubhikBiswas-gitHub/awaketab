import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const locales = ['en', 'es', 'pt-br', 'de', 'fr', 'ja', 'zh', 'hi'] as const;
const presets = ['p15', 'p30', 'p45', 'p60', 'p120', 'p240', 'pinf', 'custom', 'until'] as const;
const modes = ['standard', 'clock', 'focus', 'minimal', 'night', 'message', 'cook'] as const;
const browsers = ['chrome', 'edge', 'firefox', 'safari', 'samsung-internet', 'opera', 'brave'] as const;
const operatingSystems = ['windows', 'macos', 'linux', 'chromeos', 'android', 'ios', 'ipados'] as const;

const faq = z.object({
  q: z.string().max(120),
  a: z.string().min(40).max(600),
});

// Structured article blocks (docs/06 §22). Strings are inline Markdown (`code`, **strong**, [link](/path)); the
// Markdown body places each block on a line of its own: `::name` or `::name key`.
const text = z.string().min(1).max(700);
const lockStates = ['idle', 'requesting', 'held', 'lost', 'denied', 'unsupported', 'fallback'] as const;
const step = z
  .object({
    title: z.string().min(1).max(120),
    text,
    path: z.string().max(90).optional(),
    shot: z.string().max(120).optional(),
    short: z.string().max(40).optional(),
  })
  .strict();
const row = z
  .object({
    title: z.string().min(1).max(160),
    text: text.optional(),
    value: z.string().max(80).optional(),
    link: z
      .object({ label: z.string().max(80), href: z.string() })
      .strict()
      .optional(),
  })
  .strict();
const blocks = {
  lead: z.string().min(60).max(700).optional(),
  crumb: z.string().max(48).optional(),
  toc: z.record(z.string(), z.string().max(48)).optional(),
  facts: z
    .array(z.object({ label: z.string().max(40), value: z.string().max(40) }).strict())
    .max(4)
    .optional(),
  steps: z.array(step).min(2).max(8).optional(),
  stepsDone: z.string().max(200).optional(),
  figures: z
    .array(
      z
        .object({
          frame: z.enum(['phone', 'desktop']),
          label: z.string().max(40),
          alt: z.string().max(160),
          caption: z.string().max(160),
        })
        .strict(),
    )
    .max(2)
    .optional(),
  pills: z
    .array(z.object({ state: z.enum(lockStates), text }).strict())
    .min(2)
    .max(7)
    .optional(),
  checklist: z.array(z.string().min(1).max(200)).min(2).max(8).optional(),
  matrix: z
    .object({
      label: z.string().max(160),
      cols: z.tuple([z.string().max(24), z.string().max(24), z.string().max(24)]),
      rows: z
        .array(
          z
            .object({
              what: z.string().max(120),
              result: z.enum(['works', 'pauses', 'blocked', 'fallback', 'no', 'untested']),
              label: z.string().max(24),
              text,
            })
            .strict(),
        )
        .min(2)
        .max(12),
    })
    .strict()
    .optional(),
  rows: z.record(z.string(), z.array(row).min(1).max(10)).optional(),
  compare: z
    .object({
      label: z.string().max(160),
      what: z.string().max(24),
      cols: z
        .array(
          z
            .object({
              name: z.string().max(40),
              us: z.boolean().default(false),
            })
            .strict(),
        )
        .min(2)
        .max(3),
      rows: z
        .array(
          z
            .object({
              what: z.string().max(80),
              cells: z.array(z.string().max(300)).min(2).max(3),
              same: z.boolean().default(false),
            })
            .strict(),
        )
        .min(3)
        .max(12),
    })
    .strict()
    .optional(),
  picks: z
    .record(
      z.string(),
      z
        .array(z.object({ title: z.string().max(120), text }).strict())
        .min(1)
        .max(6),
    )
    .optional(),
  code: z
    .record(
      z.string(),
      z
        .object({
          lang: z.enum(['js', 'ts', 'html', 'sh', 'text']),
          text: z.string().min(1).max(2000),
        })
        .strict(),
    )
    .optional(),
  notes: z.record(z.string(), z.object({ kicker: z.string().max(40), text }).strict()).optional(),
  lifecycle: z
    .object({
      title: z.string().max(80),
      desc: z.string().max(400),
      edges: z
        .object({
          granted: z.string(),
          hidden: z.string(),
          visible: z.string(),
          noApi: z.string(),
          tap: z.string(),
        })
        .strict(),
      others: z.string().max(40),
      caption: z.string().max(200),
    })
    .strict()
    .optional(),
  toolNote: z.string().max(400).optional(),
};

const page = z
  .object({
    ...blocks,
    title: z.string().max(60),
    description: z.string().min(70).max(155),
    h1: z.string().max(70),
    intent: z.string().max(80),
    secondaryQueries: z.array(z.string()).max(8).default([]),
    preset: z.enum(presets).default('p30'),
    mode: z.enum(modes).default('standard'),
    locale: z.enum(locales),
    reviewed: z.boolean().default(false),
    translationOf: z.string().optional(),
    lastVerified: z.coerce.date().optional(),
    browsers: z.array(z.enum(browsers)).default([]),
    os: z.array(z.enum(operatingSystems)).default([]),
    faq: z.array(faq).min(3).max(5),
    honestLimit: z.string().min(60).max(400),
    related: z.array(z.string()).min(3).max(6),
    noindex: z.boolean().default(false),
    ogTitle: z.string().max(48).optional(),
    author: z.literal('soubhik').default('soubhik'),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
  })
  .refine((entry) => entry.title.endsWith(' — AwakeTab'), {
    message: 'title must end with " — AwakeTab"',
  });

const withVerified = page.refine((entry) => entry.lastVerified !== undefined, {
  message: 'lastVerified required',
});

const changelog = z
  .object({
    title: z.string().min(1).max(120),
    date: z.coerce.date(),
    release: z.string().optional(),
    type: z.enum(['new', 'fixed', 'changed']).optional(),
  })
  .strict();

export const collections = {
  changelog: defineCollection({
    loader: glob({ pattern: '*.md', base: '../../changelog' }),
    schema: changelog,
  }),
  for: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/for' }),
    schema: page,
  }),
  on: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/on' }),
    schema: withVerified,
  }),
  vs: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/vs' }),
    schema: withVerified,
  }),
  guides: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
    schema: withVerified,
  }),
  learn: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/learn' }),
    schema: page,
  }),
};
