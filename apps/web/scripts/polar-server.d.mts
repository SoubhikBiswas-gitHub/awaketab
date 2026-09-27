export type TPolarServer = 'sandbox' | 'production';
export const POLAR_SERVERS: readonly ['sandbox', 'production'];
export function polarServer(env?: Record<string, string | undefined>): TPolarServer;
export function polarDefines(env?: Record<string, string | undefined>): {
  __AT_POLAR_SERVER__: string;
  __AT_LICENSE_DEV_KEY__: string;
};
