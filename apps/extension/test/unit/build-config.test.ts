// @vitest-environment node
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ICON_SIZES, ringPng } from '../../scripts/icons.mjs';
import { BG_KEYS, bgCatalogs, LOCALES, localeMessages, pageCatalog, readCatalog, tokensCss } from '../../scripts/i18n.mjs';
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
    expect(manifest.commands).toEqual({ toggle: { suggested_key: { default: 'Alt+Shift+A' }, description: '__MSG_ext_command_toggle__' } });
    expect(manifest.name).toBe('__MSG_ext_name__');
    expect(manifest.default_locale).toBe('en');
  });

  it('takes the minimum Chrome version from support-matrix.json', async () => {
    const matrix = JSON.parse(await readFile(path.resolve('apps/web/src/data/support-matrix.json'), 'utf8')) as { extension: { minimumChromeVersion: string } };
    expect(manifest.minimum_chrome_version).toBe(matrix.extension.minimumChromeVersion);
  });
});

describe('i18n reuse (no duplicated English strings)', () => {
  it('every key the extension uses exists in the web catalogs of all eight locales', async () => {
    const used = new Set<string>();
    for (const file of await sources(path.join(EXT, 'entrypoints')).then(async (a) => [...a, ...(await sources(path.join(EXT, 'src')))])) {
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
    for (const locale of LOCALES) for (const key of BG_KEYS) expect(readCatalog(locale), `${locale}:${key}`).toHaveProperty(key);
  });

  it('ships no English copy of its own: extension sources hold no user-facing string literals of the catalog', async () => {
    const english = Object.values(readCatalog('en')).filter((v) => v.length > 12);
    for (const file of await sources(EXT)) {
      if (file.includes('/test/') || file.includes('/e2e/') || file.includes('node_modules') || file.includes('.output')) continue;
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
      expect(messages.ext_name?.message.length).toBeLessThanOrEqual(75);
      expect(messages.ext_description?.message.length).toBeLessThanOrEqual(132);
      expect(messages.ext_command_toggle?.message).toBeTruthy();
    }
  });

  it('takes the --at-* tokens from the web stylesheet without the Tailwind layer', () => {
    const css = tokensCss();
    expect(css.startsWith(':root,\n[data-theme="light"]')).toBe(true);
    expect(css).toContain('--at-accent: #087b87;');
    expect(css).toContain('[data-theme="oled"]');
    expect(css).not.toMatch(/@import|@theme|@apply|@layer/u);
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
