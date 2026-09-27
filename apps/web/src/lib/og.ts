import { Resvg } from '@resvg/resvg-js';
import type { ReactNode } from 'react';
import satori from 'satori';

export interface IOgFont {
  name: string;
  data: ArrayBuffer;
}

export interface IOgInput {
  title: string;
  eyebrow: string;
  locale: string;
  footer?: string;
  fonts: IOgFont[];
}

const FULL_WIDTH = /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]/u;

export function titleFontSize(title: string): number {
  let width = 0;
  for (const char of title) width += FULL_WIDTH.test(char) ? 2 : 1;
  if (width <= 36) return 68;
  if (width <= 56) return 58;
  return 50;
}

export async function renderOgPng(input: IOgInput): Promise<Uint8Array> {
  const element = {
    type: 'div',
    props: {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '72px',
        background: '#FAF7F2',
        color: '#14161C',
        fontFamily: input.fonts.map((font) => font.name).join(', '),
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', width: '790px', gap: '24px' },
            children: [
              {
                type: 'div',
                props: {
                  style: { color: '#5B6475', fontSize: '28px', fontWeight: 700, letterSpacing: '0.04em' },
                  children: input.eyebrow,
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: `${String(titleFontSize(input.title))}px`, fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.03em', textWrap: 'balance' },
                  children: input.title,
                },
              },
              {
                type: 'div',
                props: { style: { color: '#5B6475', fontSize: '28px' }, children: input.footer ?? `awaketab.com · ${input.locale}` },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              width: '250px',
              height: '250px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '18px solid #D9DDE5',
              borderTopColor: '#4A68FF',
              borderRadius: '999px',
              color: '#4A68FF',
              fontSize: '72px',
              fontWeight: 700,
            },
            children: 'A',
          },
        },
      ],
    },
  };
  // satori accepts a plain element object; @types/react narrows its parameter to ReactNode.
  const svg = await satori(element as unknown as ReactNode, {
    width: 1200,
    height: 630,
    fonts: input.fonts.map((font) => ({
      name: font.name,
      data: font.data,
      weight: 700,
      style: 'normal',
    })),
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
