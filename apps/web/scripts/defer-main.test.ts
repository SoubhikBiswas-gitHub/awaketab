import { describe, expect, it } from 'vitest';
import { deferMain } from './defer-main.mjs';

const ENTRY = '<script type="module" src="/_astro/ToolIsland.astro_astro_type_script_index_0_lang.abc.js"></script>';

describe('defer-main (tool entry starts after first paint)', () => {
  it('moves the entry onto #awaketab-tool[data-main] and removes the tag', () => {
    const out = deferMain(`<head>${ENTRY}</head><body><div id="awaketab-tool" class="at-island"></div></body>`);
    expect(out).not.toContain('<script type="module"');
    expect(out).toContain(
      '<div id="awaketab-tool" data-main="/_astro/ToolIsland.astro_astro_type_script_index_0_lang.abc.js" class="at-island">',
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
