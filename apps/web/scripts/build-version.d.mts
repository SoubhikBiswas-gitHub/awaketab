export interface IBuildVersion {
  date: string;
  commit: string;
}
export function buildVersion(env?: Record<string, string | undefined>, now?: Date): IBuildVersion;
export function versionDefines(env?: Record<string, string | undefined>, now?: Date): { __AT_VERSION__: string };
