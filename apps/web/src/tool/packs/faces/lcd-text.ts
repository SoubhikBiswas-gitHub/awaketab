// DSEG draws every segment for "8" and a digit-wide blank for "!", so this string is the unlit glass behind the text.
export function ghost(text: string): string {
  return text.replace(/[0-9d]/gu, '8').replace(/ /gu, '!');
}
