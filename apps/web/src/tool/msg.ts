export function sanitizeMsg(raw: string): string {
  const clean = raw
    .normalize('NFC')
    .replace(/[\p{Cc}\u202a-\u202e\u2066-\u2069]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  return Array.from(clean).slice(0, 80).join('');
}
