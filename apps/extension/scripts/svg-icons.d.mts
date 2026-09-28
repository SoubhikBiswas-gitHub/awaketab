export interface IAwaketabIconsPlugin {
  name: string;
  transformIndexHtml: { order: 'pre'; handler(html: string): string };
}

export function inlineIcons(html: string): string;
export function awaketabIcons(): IAwaketabIconsPlugin;
