import { dtf, mins } from '../../format.js';
import { t } from '../../i18n.js';

// Used where Intl.supportedValuesOf is missing (Safari before 15.4): one busy city per common offset.
const FALLBACK = [
  'UTC',
  'Pacific/Honolulu',
  'America/Anchorage',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Toronto',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Lisbon',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Athens',
  'Europe/Istanbul',
  'Europe/Moscow',
  'Africa/Lagos',
  'Africa/Cairo',
  'Africa/Nairobi',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Kathmandu',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Australia/Perth',
  'Australia/Sydney',
  'Pacific/Auckland',
];

// Names people type that no zone id or generic name contains.
const ALIASES: Record<string, string> = {
  'Asia/Kolkata': 'india mumbai delhi bengaluru bangalore chennai hyderabad ist',
  'Asia/Calcutta': 'kolkata india mumbai delhi bengaluru bangalore chennai hyderabad ist',
  'Asia/Katmandu': 'kathmandu nepal',
  'Asia/Saigon': 'ho chi minh vietnam',
  'Europe/Kiev': 'kyiv ukraine',
  'Asia/Rangoon': 'yangon myanmar',
  'Europe/London': 'uk united kingdom britain england gmt bst',
  'America/New_York': 'nyc usa boston washington miami est edt',
  'America/Los_Angeles': 'san francisco seattle california pst pdt',
  'America/Chicago': 'texas dallas houston cst',
  'Asia/Shanghai': 'china beijing',
  'Asia/Tokyo': 'japan jst',
  'Asia/Seoul': 'korea',
  'Europe/Berlin': 'germany cet',
  'Europe/Paris': 'france',
  'Australia/Sydney': 'australia melbourne aest',
  'Asia/Dubai': 'uae abu dhabi',
  'Asia/Singapore': 'sgt',
  UTC: 'coordinated universal time gmt zulu',
};

export function validZone(zone: unknown): zone is string {
  if (typeof zone !== 'string' || !zone || zone.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

export function allZones(): string[] {
  try {
    const list = (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('timeZone');
    if (list?.length) return list.includes('UTC') ? list : ['UTC', ...list];
  } catch {
    // older engines
  }
  return FALLBACK;
}

// Chrome lists some zones by their older names; people know the cities by the current ones.
const RENAMED: Record<string, string> = {
  'Asia/Calcutta': 'Kolkata',
  'Asia/Katmandu': 'Kathmandu',
  'Asia/Saigon': 'Ho Chi Minh City',
  'Europe/Kiev': 'Kyiv',
  'Asia/Rangoon': 'Yangon',
};

export const cityOf = (zone: string): string => RENAMED[zone] ?? (zone.split('/').pop() ?? zone).replaceAll('_', ' ');
export const regionOf = (zone: string): string => (zone.includes('/') ? (zone.split('/')[0] ?? '') : '');

// Minutes east of UTC for `zone` at `at`.
export function zoneOffset(zone: string, at: number): number {
  const parts = dtf(
    {
      timeZone: zone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    },
    'en-US',
  ).formatToParts(at);
  const n = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const wall = Date.UTC(n('year'), n('month') - 1, n('day'), n('hour') % 24, n('minute'));
  return Math.round((wall - Math.floor(at / 60_000) * 60_000) / 60_000);
}

// The zone's clock against this device's: minutes ahead (positive) or behind.
export const diffMin = (zone: string, at: number): number => zoneOffset(zone, at) + new Date(at).getTimezoneOffset();

export function diffText(d: number): string {
  if (!d) return t('tool.world.same');
  const a = Math.abs(d);
  return `${d > 0 ? '+' : '−'}${String(Math.floor(a / 60))}:${String(a % 60).padStart(2, '0')}`;
}

export function diffWords(d: number): string {
  if (!d) return t('tool.world.sameWords');
  return t(d > 0 ? 'tool.world.ahead' : 'tool.world.behind', { length: mins(Math.abs(d)) });
}

// "3:15 PM", or "1:15 AM tomorrow" when the other zone's calendar day is not today here.
export function zoneTime(zone: string, at: number, c24: boolean | null): string {
  const time = dtf({
    timeZone: zone,
    hour: 'numeric',
    minute: '2-digit',
    ...(c24 === null ? {} : { hour12: !c24 }),
  }).format(at);
  const day = (tz?: string) =>
    dtf({ timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }, 'en-CA').format(at);
  const there = day(zone);
  const here = day();
  if (there === here) return time;
  return t(there > here ? 'tool.world.tomorrow' : 'tool.world.yesterday', { time });
}

let generic: Map<string, string> | undefined;

// "Pacific Time", "India Standard Time": the browser's own name for the zone, for the list and for search.
export function zoneName(zone: string): string {
  generic ??= new Map();
  let name = generic.get(zone);
  if (name === undefined) {
    try {
      name =
        dtf({ timeZone: zone, timeZoneName: 'longGeneric' })
          .formatToParts(0)
          .find((p) => p.type === 'timeZoneName')?.value ?? '';
    } catch {
      name = '';
    }
    generic.set(zone, name);
  }
  return name;
}

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[_/]+/gu, ' ');

export function searchZones(list: readonly string[], query: string, limit = 40): string[] {
  const q = fold(query).trim();
  if (!q) return FALLBACK.filter(validZone).slice(0, limit);
  const words = q.split(/\s+/u);
  const scored: Array<[number, string]> = [];
  for (const zone of list) {
    const city = fold(cityOf(zone));
    const hay = `${city} ${fold(zone)} ${fold(zoneName(zone))} ${ALIASES[zone] ?? ''}`;
    if (!words.every((w) => hay.includes(w))) continue;
    scored.push([city.startsWith(q) ? 0 : hay.includes(` ${q}`) || hay.startsWith(q) ? 1 : 2, zone]);
  }
  scored.sort((a, b) => a[0] - b[0] || a[1].localeCompare(b[1]));
  return scored.slice(0, limit).map(([, z]) => z);
}
