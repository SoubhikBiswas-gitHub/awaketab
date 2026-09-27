export type TPowerLevel = 'display' | 'system';

export interface IExtEvent<TFn extends (...args: never[]) => unknown> {
  addListener(cb: TFn): void;
  removeListener(cb: TFn): void;
}

export interface IStorageChange {
  oldValue?: unknown;
  newValue?: unknown;
}

export interface IStorageAreaApi {
  get(keys?: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
}

export interface IAlarm {
  name: string;
  scheduledTime: number;
  periodInMinutes?: number;
}

export interface IAlarmInfo {
  when?: number;
  delayInMinutes?: number;
  periodInMinutes?: number;
}

export interface IPermissions {
  permissions?: string[];
  origins?: string[];
}

export interface INotificationOptions {
  type: 'basic';
  iconUrl: string;
  title: string;
  message: string;
  buttons?: Array<{ title: string }>;
  silent?: boolean;
  priority?: number;
}

export interface ITab {
  id?: number;
  url?: string;
  active?: boolean;
}

export interface IExtApi {
  power?: {
    requestKeepAwake(level: TPowerLevel): void;
    releaseKeepAwake(): void;
  };
  storage: {
    local: IStorageAreaApi;
    sync?: IStorageAreaApi;
    session?: IStorageAreaApi;
    onChanged: IExtEvent<(changes: Record<string, IStorageChange>, areaName: string) => void>;
  };
  alarms: {
    create(name: string, info: IAlarmInfo): Promise<void>;
    clear(name: string): Promise<boolean>;
    getAll(): Promise<IAlarm[]>;
    onAlarm: IExtEvent<(alarm: IAlarm) => void>;
  };
  action: {
    setBadgeText(details: { text: string }): Promise<void>;
    setBadgeBackgroundColor(details: { color: string }): Promise<void>;
    setBadgeTextColor?(details: { color: string }): Promise<void>;
    setTitle(details: { title: string }): Promise<void>;
  };
  notifications?: {
    create(id: string, options: INotificationOptions): Promise<string>;
    clear(id: string): Promise<boolean>;
    onButtonClicked: IExtEvent<(id: string, index: number) => void>;
    onClicked: IExtEvent<(id: string) => void>;
  };
  permissions: {
    contains(p: IPermissions): Promise<boolean>;
    request(p: IPermissions): Promise<boolean>;
    remove(p: IPermissions): Promise<boolean>;
    onAdded: IExtEvent<(p: IPermissions) => void>;
    onRemoved: IExtEvent<(p: IPermissions) => void>;
  };
  runtime: {
    id: string;
    getManifest(): { version: string };
    getURL(path: string): string;
    onStartup: IExtEvent<() => void>;
    onInstalled: IExtEvent<(details: { reason: string; previousVersion?: string }) => void>;
    onMessage: IExtEvent<(message: unknown, sender: unknown, sendResponse: (response: unknown) => void) => boolean | undefined>;
    sendMessage(message: unknown): Promise<unknown>;
    openOptionsPage(): Promise<void>;
  };
  commands: {
    onCommand: IExtEvent<(command: string) => void>;
    getAll(): Promise<Array<{ name?: string; shortcut?: string }>>;
  };
  tabs: {
    query(q: { url?: string[] }): Promise<ITab[]>;
    create(p: { url: string }): Promise<unknown>;
    onUpdated: IExtEvent<(tabId: number, change: { status?: string; url?: string }, tab: ITab) => void>;
    onRemoved: IExtEvent<(tabId: number) => void>;
  };
  i18n?: { getUILanguage(): string };
  extension?: { inIncognitoContext?: boolean };
}
