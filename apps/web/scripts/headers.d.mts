export interface IParsedRule {
  readonly route: string;
  readonly headers: readonly string[];
}

export function generateHeaders(): string;
export function generateRedirects(): string;
export function parseRules(text: string): IParsedRule[];
export interface IHeaderRule {
  readonly route: string;
  readonly set: ReadonlyArray<readonly [string, string]>;
  readonly detach: readonly string[];
}
export function parseHeaderRules(text: string): IHeaderRule[];
export function resolveHeaders(text: string, pathname: string, host?: string): Map<string, string>;
export const PREVIEW_HOST_RULES: readonly string[];
export const BOOT_HASH: string;
