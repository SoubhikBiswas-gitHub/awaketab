import { describe, expect, it } from 'vitest';
import { deferMain } from './defer-main.mjs';

const ENTRY = '<script type="module" src="/_astro/ToolIsland.astro_astro_type_script_index_0_lang.abc.js"></script>';

describe('defer-main (module entries start after first paint)', () => {
  it('moves the entry onto #awaketab-tool[data-main] and removes the tag', () => {
    const out = deferMain(`<head>${ENTRY}</head><body><div id="awaketab-tool" class="at-island"></div></body>`);
    expect(out).not.toContain('<script type="module"');
    expect(out).toContain(
      '<div id="awaketab-tool" data-main="/_astro/ToolIsland.astro_astro_type_script_index_0_lang.abc.js" class="at-island">',
    );
  });

  it('moves the content-page entry onto main.at-cp[data-main] next to the tool entry', () => {
    const content =
      '<script type="module" src="/_astro/ContentLayout.astro_astro_type_script_index_0_lang.c1.js"></script>';
    const out = deferMain(
      `<head>${content}${ENTRY}</head><body><main class="at-cp"><div id="awaketab-tool" class="at-island"></div></main></body>`,
    );
    expect(out).not.toContain('<script type="module"');
    expect(out).toContain(
      '<main class="at-cp" data-main="/_astro/ContentLayout.astro_astro_type_script_index_0_lang.c1.js">',
    );
    expect(out).toContain(
      '<div id="awaketab-tool" data-main="/_astro/ToolIsland.astro_astro_type_script_index_0_lang.abc.js"',
    );
  });

  it('defers the content-page entry on pages without the tool', () => {
    const content =
      '<script type="module" src="/_astro/ContentLayout.astro_astro_type_script_index_0_lang.c1.js"></script>';
    expect(deferMain(`${content}<main class="at-cp"></main>`)).toBe(
      '<main class="at-cp" data-main="/_astro/ContentLayout.astro_astro_type_script_index_0_lang.c1.js"></main>',
    );
  });

  it('leaves pages without the entry or without the island root untouched', () => {
    expect(deferMain('<div id="awaketab-tool"></div>')).toBeNull();
    expect(deferMain(`${ENTRY}<main id="awaketab-pip"></main>`)).toBeNull();
    expect(
      deferMain('<script type="module" src="/_astro/pip.astro_astro_type_script.js"></script><div id="awaketab-tool">'),
    ).toBeNull();
  });
});
