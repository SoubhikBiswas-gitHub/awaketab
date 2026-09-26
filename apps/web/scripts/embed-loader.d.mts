export const LOADER_OUT: string;
export const APP_OUT: string;
export function frameTitles(): Promise<Record<string, string>>;
export function buildLoader(): Promise<string>;
export function buildApp(): Promise<string>;
