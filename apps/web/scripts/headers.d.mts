export interface IParsedRule {
  readonly route: string;
  readonly headers: readonly string[];
}

export function generateHeaders(): string;
export function generateRedirects(): string;
export function parseRules(text: string): IParsedRule[];
