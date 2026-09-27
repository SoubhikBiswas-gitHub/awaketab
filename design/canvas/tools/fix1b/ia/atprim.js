// AT-PRIMITIVES v1 (fix batch 1b): DESIGN.md §2.1 tokens and §11 geometry. Keep identical across files.
const AT_TOK = {
  dark: { raised: '#26324B', sunken: '#0D131F', horizonInk: '#F6F2EA', line2: '#33405C' },
  light: { raised: '#E3E9F1', sunken: '#F6F9FC', horizonInk: '#F6F2EA', line2: '#C3CDDA' }
};
const AT_NIGHT = { ground: '#000000', ink: '#FF5A3C', ink2: '#E8563C', muted: '#A89690', line: '#3A2E2A' };
const AT_SCRIM = 'rgba(4,7,12,.55)';
const AT_HDR = { phone: { h: '60px', pad: '0 16px' }, tablet: { h: '68px', pad: '0 32px' }, desktop: { h: '68px', pad: '0 80px' }, xl: { h: '68px', pad: '0 120px' } };
const AT_FOOT = { phone: '24px 16px 32px', tablet: '24px 32px', desktop: '24px 80px', xl: '24px 120px' };
const AT_CARD_PAD = { phone: '20px', tablet: '24px', desktop: '24px', xl: '24px' };
const AT_TYPE = {
  phone: { h1: '34px', h1lh: '42px', h2: '24px', h2lh: '32px', gutter: '16px', section: '48px' },
  tablet: { h1: '48px', h1lh: '56px', h2: '28px', h2lh: '36px', gutter: '32px', section: '64px' },
  desktop: { h1: '48px', h1lh: '56px', h2: '28px', h2lh: '36px', gutter: '80px', section: '96px' }
};

