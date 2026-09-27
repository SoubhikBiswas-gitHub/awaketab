/** The few `chrome.*` calls the Playwright suite makes inside extension pages (see fixtures.ts). */
interface IE2eStorageArea {
  get(keys?: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

declare const chrome: {
  storage: { local: IE2eStorageArea; sync: IE2eStorageArea; session: IE2eStorageArea };
  action: { getBadgeText(details: Record<string, never>): Promise<string> };
};
