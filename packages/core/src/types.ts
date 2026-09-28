export type TPlanType = 'indefinite' | 'duration' | 'until';
export type TPlan =
  { type: 'indefinite' } | { type: 'duration'; ms: number } | { type: 'until'; endsAt: number; wall: string };

export type TSessionStatus = 'inactive' | 'active' | 'paused' | 'completed' | 'aborted';
export type TEndReason = 'completed' | 'user' | 'lost_timeout' | 'denied' | 'battery' | 'error';
export type TPresetId = 'p15' | 'p30' | 'p45' | 'p60' | 'p120' | 'p240' | 'pinf' | 'custom' | 'until';
export type TAmbientMode = 'standard' | 'clock' | 'focus' | 'minimal' | 'night' | 'message' | 'cook' | 'breathe';
export type TTheme = 'auto' | 'light' | 'dark' | 'oled';
export type TFace =
  'ring' | 'bold' | 'horizon' | 'tide' | 'flip' | 'rolling' | 'analog' | 'rings' | 'word' | 'nixie' | 'lcd' | 'matrix';
export type TPalette =
  'clear-night' | 'paper' | 'nord' | 'solarized' | 'midnight' | 'forest' | 'sunset' | 'mono' | 'contrast';
export type TPattern = 'none' | 'grain' | 'dots' | 'grid' | 'topo' | 'waves' | 'aurora' | 'stars' | 'drift';
export type TFocusSound = 'none' | 'brown' | 'pink' | 'white' | 'rain' | 'cafe' | 'fire' | 'lofi' | `track:${string}`;
export type TEndBehaviour = 'stop' | 'prompt_extend';
export type TSessionSource = 'web' | 'pwa' | 'pip' | 'ext' | 'embed';

export type TPlanId = 'pro_yearly' | 'pro_lifetime' | 'biz_embed_site_yearly' | 'biz_kiosk_site' | 'biz_kiosk_5';

export type TFeatureGate =
  | 'ambient.packs'
  | 'ambient.message'
  | 'ambient.logo'
  | 'schedules'
  | 'sounds.custom'
  | 'stats.history'
  | 'stats.export'
  | 'pip.pro'
  | 'ext.autostart'
  | 'ext.schedules'
  | 'ads.free'
  | 'embed.noattrib'
  | 'kiosk.branding';

export interface ISession {
  v: 1;
  id: string;
  plan: TPlan;
  presetId: TPresetId;
  mode: TAmbientMode;
  startedAt: number;
  endsAt: number | null;
  status: TSessionStatus;
  pausedAt: number | null;
  pausedMs: number;
  endedAt: number | null;
  endReason: TEndReason | null;
  awakeSeconds: number;
  modeState: Record<string, unknown>;
  source: TSessionSource;
}

export interface ISettings {
  v: 1;
  theme: TTheme;
  accent: string;
  face: TFace;
  defaultPreset: TPresetId;
  lastCustomMs: number;
  lastUntilWall: string | null;
  autostart: boolean;
  sound: {
    id: 'chime' | 'bell' | 'soft' | 'digital' | 'birds' | 'none' | `custom:${string}`;
    volume: number;
  };
  notifications: boolean;
  endBehaviour: TEndBehaviour;
  battery: { autoStop: boolean; threshold: number; chargingReminder: boolean };
  ambient: {
    mode: TAmbientMode;
    message: string;
    clock24h: boolean | null;
    showSeconds: boolean;
    pixelShift: boolean;
    autoHideMs: number;
    focus: { workMin: number; breakMin: number; cycles: number };
  };
  locale: string | null;
  telemetry: boolean;
  keyboardShortcuts: boolean;
  keyboardHints: boolean;
  reduceMotion: 'system' | 'on' | 'off';
  faceStyles: Partial<Record<TFace, string>>;
  palette: TPalette;
  pattern: TPattern;
  vibrate: boolean;
  tick: boolean;
  focusSound: { kind: TFocusSound; volume: number; mix: Partial<Record<TFocusSound, number>>; stopAtEnd: boolean };
  intention: string;
  worldClock: string | null;
  pomodoro: { autoCycle: boolean; longBreakMin: number };
  // Absent until chosen; reads as '478'.
  breathe?: '478' | 'box';
}

export interface IStats {
  v: 1;
  days: Record<string, number>;
  totalMinutes: number;
  sessions: number;
  longestStreakDays: number;
  currentStreakDays: number;
  lastSessionAt: number | null;
  daySessions?: Record<string, number>;
  dayFocus?: Record<string, number>;
}

export interface ILicenseRecord {
  v: 1;
  token: string;
  plan: TPlanId;
  features: TFeatureGate[];
  exp: number;
  lastValidatedAt: number;
  deviceId: string;
  deviceLabel: string;
}

export interface IMeta {
  v: 1;
  installedAt: number;
  sessionCount: number;
  // rearmAt: sessionCount at which a 'later' answer asks again (docs/05 §3.22: after 10 more sessions).
  ratingPrompt: {
    shownAt: number | null;
    action: 'rated' | 'later' | 'never' | null;
    stars?: number;
    rearmAt?: number;
  };
  lastSeenVersion: string;
  pwa: { installed: boolean; promptShownAt: number | null };
  secondTabWarnedAt: number | null;
}

export interface IOnboarding {
  v: 1;
  dismissedTips: string[];
}

export const PRESET_MS: Record<Exclude<TPresetId, 'pinf' | 'custom' | 'until'>, number> = {
  p15: 15 * 60_000,
  p30: 30 * 60_000,
  p45: 45 * 60_000,
  p60: 60 * 60_000,
  p120: 120 * 60_000,
  p240: 240 * 60_000,
};

export const DEFAULT_SETTINGS: ISettings = {
  v: 1,
  theme: 'auto',
  accent: '#087B87',
  face: 'ring',
  defaultPreset: 'pinf',
  lastCustomMs: 90 * 60_000,
  lastUntilWall: null,
  autostart: true,
  sound: { id: 'chime', volume: 0.6 },
  notifications: false,
  endBehaviour: 'prompt_extend',
  battery: { autoStop: false, threshold: 15, chargingReminder: true },
  ambient: {
    mode: 'standard',
    message: '',
    clock24h: null,
    showSeconds: false,
    pixelShift: true,
    autoHideMs: 3000,
    focus: { workMin: 25, breakMin: 5, cycles: 4 },
  },
  locale: null,
  telemetry: true,
  keyboardShortcuts: true,
  keyboardHints: true,
  reduceMotion: 'system',
  faceStyles: {},
  palette: 'clear-night',
  pattern: 'none',
  vibrate: true,
  tick: false,
  focusSound: { kind: 'none', volume: 0.5, mix: {}, stopAtEnd: true },
  intention: '',
  worldClock: null,
  pomodoro: { autoCycle: false, longBreakMin: 15 },
};

export const DEFAULT_STATS: IStats = {
  v: 1,
  days: {},
  totalMinutes: 0,
  sessions: 0,
  longestStreakDays: 0,
  currentStreakDays: 0,
  lastSessionAt: null,
};

export const DEFAULT_META: IMeta = {
  v: 1,
  installedAt: 0,
  sessionCount: 0,
  ratingPrompt: { shownAt: null, action: null },
  lastSeenVersion: '',
  pwa: { installed: false, promptShownAt: null },
  secondTabWarnedAt: null,
};

export const DEFAULT_ONBOARDING: IOnboarding = { v: 1, dismissedTips: [] };
