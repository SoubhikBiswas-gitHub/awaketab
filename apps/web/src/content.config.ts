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

const page = z
  .object({
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
  changelog: defineCollection({ loader: glob({ pattern: '*.md', base: '../../changelog' }), schema: changelog }),
  for: defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/for' }), schema: page }),
  on: defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/on' }), schema: withVerified }),
  vs: defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/vs' }), schema: withVerified }),
  guides: defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/guides' }), schema: withVerified }),
  learn: defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/learn' }), schema: page }),
};
