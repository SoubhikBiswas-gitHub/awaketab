type TVars = Record<string, string | number>;

// Filled at boot from the page's embedded <script type="application/json" data-i18n-catalog> (ToolPanel.astro
// renders the full locale catalog server-side), so no strings ship in the critical JS chunk.
let catalog: Record<string, string> = {};

const PLURAL = /\{(\w+), plural, one \{([^}]*)\} other \{([^}]*)\}\}/g;
const TOKEN = /\{(\w+)\}/g;

export function setCatalog(next: Record<string, string>): void {
  catalog = { ...catalog, ...next };
}

export function t(key: string, vars?: TVars): string {
  const raw = catalog[key] ?? key;
  if (!vars) return raw;
  const withPlural = raw.replace(PLURAL, (_m, name: string, one: string, other: string) => {
    const n = Number(vars[name] ?? 0);
    const picked = n === 1 ? one : other;
    return picked.replaceAll('#', String(n));
  });
  return withPlural.replace(TOKEN, (_m, name: string) => String(vars[name] ?? ''));
}
