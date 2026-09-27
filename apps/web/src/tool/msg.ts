export function sanitizeMsg(raw: string): string {
  const nfc = raw.normalize('NFC');
  const stripped = Array.from(nfc)
    .filter((ch) => {
      const c = ch.codePointAt(0) ?? 0;
      if (c < 32 || (c >= 127 && c < 160)) return false;
      if (c >= 0x202a && c <= 0x202e) return false;
      if (c >= 0x2066 && c <= 0x2069) return false;
      return true;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  return Array.from(stripped).slice(0, 80).join('');
}
