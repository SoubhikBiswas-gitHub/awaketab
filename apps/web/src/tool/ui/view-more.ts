import { dayDiff, hm, mins, when, words } from '../format.js';
import { t } from '../i18n.js';
import type { IToolState } from '../store.js';

export interface IMoreIn {
  s: IToolState;
  now: number;
  pre: string;
  untilAt: number;
  customSec: number;
  askLeft: number;
}

export function more({
  s,
  now,
  pre,
  untilAt,
  customSec,
  askLeft,
}: IMoreIn): [Record<string, string>, Record<string, string>] {
  const c24 = s.settings.ambient.clock24h;
  const w = when(untilAt, c24);
  const at = hm(untilAt, c24);
  const cw = words(customSec);
  const u = pre === 'until';
  const c = pre === 'custom';
  const chip = t('tool.chip.untilAt', { time: w });
  return [
    {
      untilLong: u ? chip : t('tool.preset.until'),
      untilShort: u ? t('tool.chip.untilAt', { time: at }) : t('tool.preset.until'),
      custom: c ? cw : t('tool.preset.custom'),
      more: t(u ? 'tool.chip.moreUntil' : c ? 'tool.chip.moreCustom' : 'tool.chip.more'),
      customWords: cw,
      ask: t('tool.extend.auto', { seconds: askLeft }),
      // Decision O-59: battery saver does not refuse the lock, so an unclassified denial lists the usual causes.
      cause: s.advice ? t(`tool.advice.${s.advice}`) : '',
      battBody: t('tool.battery.body', {
        percent: s.settings.battery.threshold,
      }),
      untilChip: chip,
      whenLine: t(dayDiff(untilAt, now) > 0 ? 'tool.until.isTomorrow' : 'tool.until.isToday', {
        time: at,
        length: mins(Math.round((untilAt - now) / 60_000)),
      }),
    },
    {
      askAria: t('tool.extend.autoSr', { seconds: askLeft }),
      untilAria: u ? t('tool.chip.untilChange', { time: w }) : t('tool.chip.untilAria'),
      customAria: c ? t('tool.chip.customChange', { length: cw }) : t('tool.chip.customAria'),
      moreAria:
        u || c
          ? t('tool.chip.moreNow', {
              now: u ? `${t('tool.meta.until')} ${w}` : cw,
            })
          : t('tool.chip.moreAria'),
      untilChip: chip,
    },
  ];
}
