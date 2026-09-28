// @vitest-environment node
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ICON_SIZES, ringPng } from '../../scripts/icons.mjs';
import { inlineIcons } from '../../scripts/svg-icons.mjs';
import {
  BG_KEYS,
  bgCatalogs,
  LOCALES,
  localeMessages,
  pageCatalog,
  readCatalog,
  readExtCatalog,
  tokensCss,
} from '../../scripts/i18n.mjs';
import config from '../../wxt.config';

const EXT = path.resolve('apps/extension');

async function sources(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await sources(full)));
    else if (/\.(ts|html)$/u.test(entry.name) && !entry.name.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

describe('manifest (docs/10 §2, FR-EXT-03)', () => {
  const manifest = config.manifest as Record<string, unknown>;

  it('declares only power, storage and alarms, optional notifications, and no host permissions', () => {
    expect(manifest.permissions).toEqual(['power', 'storage', 'alarms']);
    expect(manifest.optional_permissions).toEqual(['notifications']);
    expect(manifest.host_permissions).toEqual([]);
    expect(manifest.optional_host_permissions).toEqual(['https://*/*']);
    expect(manifest).not.toHaveProperty('content_scripts');
    expect(manifest).not.toHaveProperty('externally_connectable');
    expect(manifest).not.toHaveProperty('content_security_policy');
    expect(manifest.manifest_version ?? config.manifestVersion).toBe(3);
  });

  it('binds Alt+Shift+A to toggle and localises name, description and command', () => {
    expect(manifest.commands).toEqual({
      toggle: { suggested_key: { default: 'Alt+Shift+A' }, description: '__MSG_ext_command_toggle__' },
    });
    expect(manifest.name).toBe('__MSG_ext_name__');
    expect(manifest.default_locale).toBe('en');
  });

  it('takes the minimum Chrome version from support-matrix.json', async () => {
    const matrix = JSON.parse(await readFile(path.resolve('apps/web/src/data/support-matrix.json'), 'utf8')) as {
      extension: { minimumChromeVersion: string };
    };
    expect(manifest.minimum_chrome_version).toBe(matrix.extension.minimumChromeVersion);
  });
});

describe('i18n reuse (no duplicated English strings)', () => {
  it("every key the extension uses exists in the catalogs (web + the extension's own locales/) of all eight locales", async () => {
    const used = new Set<string>();
    for (const file of await sources(path.join(EXT, 'entrypoints')).then(async (a) => [
      ...a,
      ...(await sources(path.join(EXT, 'src'))),
    ])) {
      const text = await readFile(file, 'utf8');
      for (const m of text.matchAll(/data-i18n(?:-aria)?="([a-z][\w.-]+)"/gu)) used.add(m[1] ?? '');
      for (const m of text.matchAll(/\bt\(\s*'([a-z][\w.-]+)'/gu)) used.add(m[1] ?? '');
    }
    expect(used.size).toBeGreaterThan(80);
    for (const locale of LOCALES) {
      const page = pageCatalog(locale);
      const bg = bgCatalogs()[locale] ?? {};
      const missing = [...used].filter((key) => !(key in page) && !(key in bg));
      expect(missing, locale).toEqual([]);
    }
    for (const locale of LOCALES)
      for (const key of BG_KEYS) expect(readCatalog(locale), `${locale}:${key}`).toHaveProperty(key);
  });

  it('the extension catalog only adds ext.* keys, never shadows a web key, and every locale has the same keys and placeholders', () => {
    const en = readExtCatalog('en');
    const web = readCatalog('en');
    const placeholders = (v: string) => [...v.matchAll(/\{(\w+)/gu)].map((m) => m[1]).sort();
    expect(Object.keys(en).length).toBeGreaterThan(100);
    for (const key of Object.keys(en)) {
      expect(key.startsWith('ext.'), key).toBe(true);
      expect(web, `${key} is a web key`).not.toHaveProperty(key);
    }
    for (const locale of LOCALES) {
      const cat = readExtCatalog(locale);
      expect(Object.keys(cat).sort(), locale).toEqual(Object.keys(en).sort());
      for (const [key, value] of Object.entries(en)) {
        expect(placeholders(cat[key] ?? ''), `${locale}:${key}`).toEqual(placeholders(value));
        expect((cat[key] ?? '').trim(), `${locale}:${key}`).not.toBe('');
      }
    }
  });

  it('ships no English copy in its sources: no user-facing string literal of either catalog', async () => {
    const english = [...Object.values(readCatalog('en')), ...Object.values(readExtCatalog('en'))].filter(
      (v) => v.length > 12,
    );
    for (const file of await sources(EXT)) {
      if (
        file.includes('/test/') ||
        file.includes('/e2e/') ||
        file.includes('node_modules') ||
        file.includes('.output')
      )
        continue;
      const text = await readFile(file, 'utf8');
      for (const copy of english) {
        const literal = [`'${copy}'`, `"${copy}"`, `\`${copy}\``, `>${copy}<`].some((form) => text.includes(form));
        expect(literal, `${path.relative(EXT, file)} duplicates "${copy}"`).toBe(false);
      }
    }
  });

  it('writes _locales messages within Chrome limits for every locale', () => {
    const files = localeMessages();
    expect(files.map((f) => f.relativeDest)).toEqual([
      '_locales/en/messages.json',
      '_locales/es/messages.json',
      '_locales/pt_BR/messages.json',
      '_locales/de/messages.json',
      '_locales/fr/messages.json',
      '_locales/ja/messages.json',
      '_locales/zh_CN/messages.json',
      '_locales/hi/messages.json',
    ]);
    for (const file of files) {
      const messages = JSON.parse(file.contents) as Record<string, { message: string }>;
      // The store name is a product name, so it stays in English in every locale.
      expect(messages.ext_name?.message).toBe('AwakeTab: Keep Screen Awake');
      expect(messages.ext_name?.message.length).toBeLessThanOrEqual(75);
      expect(messages.ext_description?.message.length).toBeLessThanOrEqual(132);
      expect(messages.ext_command_toggle?.message).toBeTruthy();
    }
  });

  it('takes the --at-* tokens from the web stylesheet without the Tailwind layer', () => {
    const css = tokensCss();
    expect(css.startsWith(':root,\n[data-theme="light"]')).toBe(true);
    expect(css).toContain('--at-accent: #087b87;');
    // Clear Night (DESIGN.md §2.1, §12): the extension gets the new ground, raised and spacing tokens too.
    expect(css).toContain('--at-ground: #0a0e16;');
    expect(css).toContain('--at-raised: #26324b;');
    expect(css).toContain('--at-h-primary: 60px;');
    expect(css).toContain('[data-theme="oled"]');
    expect(css).not.toMatch(/@import|@theme|@apply|@layer/u);
  });
});

describe('fonts (DESIGN.md §3, D-R26)', () => {
  it('bundles Geist and Geist Mono with the OFL licence and requests no remote font', async () => {
    const files = await readdir(path.join(EXT, 'public/fonts'));
    expect(files.sort()).toEqual([
      'OFL-Geist.txt',
      'geist-latin-wght-normal.woff2',
      'geist-mono-latin-wght-normal.woff2',
    ]);
    const base = await readFile(path.join(EXT, 'src/styles/base.css'), 'utf8');
    expect(base).toContain('url("/fonts/geist-latin-wght-normal.woff2")');
    expect(base).toContain('font-family: "Geist Fallback"');
    for (const file of await sources(path.join(EXT, 'entrypoints'))) {
      expect(await readFile(file, 'utf8'), file).not.toMatch(/fonts\.(googleapis|gstatic)\.com/u);
    }
    expect(base).not.toMatch(/https?:\/\//u);
  });
});

describe('icons', () => {
  it('renders the ring icons byte-identically every time', () => {
    for (const size of ICON_SIZES) {
      const a = ringPng(size);
      const b = ringPng(size);
      expect(a.equals(b)).toBe(true);
      expect(a.readUInt32BE(16)).toBe(size);
      expect(a.subarray(1, 4).toString()).toBe('PNG');
    }
  });
});

describe('inline icons', () => {
  it('inlines Phosphor duotone icons with the lamp fill layer and keeps their viewBox', () => {
    const html = inlineIcons('<svg data-icon="gear-six" width="20" height="20" class="at-duo-bad" data-x></svg>');
    expect(html).toMatch(/^<svg class="at-duo at-duo-bad" width="20" height="20" viewBox="0 0 256 256"/u);
    expect(html).toContain(' data-x aria-hidden="true" focusable="false">');
    expect(html).toMatch(/<path d="[^"]+" class="at-duo-f"\/>/u);
    expect(html).not.toContain('opacity=');
  });

  it('inlines full-colour brand logos unaltered', () => {
    const html = inlineIcons('<svg data-logo="chrome" width="16" height="16"></svg>');
    expect(html).toContain('viewBox="0 0 256 256"');
    expect(html).toContain('fill="#1a73e8"');
    expect(html).not.toContain('currentColor');
  });

  it('fails the build on an unknown name or a missing size', () => {
    expect(() => inlineIcons('<svg data-icon="no-such-icon" width="16" height="16"></svg>')).toThrow();
    expect(() => inlineIcons('<svg data-logo="no-such-logo" width="16" height="16"></svg>')).toThrow();
    expect(() => inlineIcons('<svg data-icon="x" width="16"></svg>')).toThrow(/width and height/u);
  });

  it('leaves no placeholder in any extension page', async () => {
    for (const page of ['popup', 'options', 'welcome']) {
      const html = inlineIcons(await readFile(path.join(EXT, `entrypoints/${page}/index.html`), 'utf8'));
      expect(html, page).not.toMatch(/data-(?:icon|logo)=/u);
    }
  });
});
