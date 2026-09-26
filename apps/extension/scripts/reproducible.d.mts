export function buildZip(outDir: string): Promise<Buffer>;
export function checkReproducible(): Promise<{ same: boolean; first: string; second: string; bytes: number }>;
