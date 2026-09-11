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
  fonts: IOgFont[];
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
                  style: { fontSize: '68px', fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.03em' },
                  children: input.title,
                },
              },
              {
                type: 'div',
                props: { style: { color: '#5B6475', fontSize: '28px' }, children: `awaketab.com · ${input.locale}` },
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
