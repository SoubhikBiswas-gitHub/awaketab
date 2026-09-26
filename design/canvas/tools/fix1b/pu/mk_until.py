import re
F='/private/tmp/claude-501/-Users-soubhik-Work-github-awaketab/68604392-2b5c-4388-8fa5-e0e1d91d7184/scratchpad/fix1b/'
s=open(F+'orig/UntilPage.dc.html').read()
def rep(old,new,count=1):
    global s
    assert s.count(old)==count, (old[:80], s.count(old))
    s=s.replace(old,new)
# 1 header
i=s.index('    <header style='); j=s.index('    </header>')+len('    </header>')
nav='''      <sc-if value="{{isDesk}}" hint-placeholder-val="{{false}}">
        <nav aria-label="Main" style="display: flex; gap: 32px; font-size: 15px; line-height: 22px; font-weight: 500">
          <a href="#" style="color: {{t.ink2}}; text-decoration: none; min-height: 44px; display: flex; align-items: center">Use cases</a>
          <a href="#" style="color: {{t.ink2}}; text-decoration: none; min-height: 44px; display: flex; align-items: center">Devices</a>
          <a href="#" style="color: {{t.ink2}}; text-decoration: none; min-height: 44px; display: flex; align-items: center">Extension</a>
          <a href="#" style="color: {{t.ink2}}; text-decoration: none; min-height: 44px; display: flex; align-items: center">Pro</a>
        </nav>
      </sc-if>
'''
s=s[:i]+'    %%P-HEADER%%\n'+nav+'      %%P-THEME%%\n    </header>'+s[j:]
# 2 date line
rep('''<time style="font-size: 15px; color: {{t.ink2}}">{{dateLong}}</time>''','''<time style="font-size: 15px; line-height: 22px; color: {{t.ink2}}">{{dateLong}}</time>''')
rep('''<time style="font-family: 'Geist Mono', ui-monospace, monospace; font-size: 15px; color: {{t.ink}}; font-variant-numeric: tabular-nums">{{nowTime}}</time>''','''<time style="font-size: 15px; line-height: 22px; color: {{t.ink}}; font-variant-numeric: tabular-nums">{{nowTime}}</time>''')
# 3 pill
i=s.index('        <output aria-live'); j=s.index('</output>')+len('</output>')
s=s[:i]+'        %%P-PILL-M%%'+s[j:]
# 4 ring centre
rep('''gap: 10px">
                  <div style="font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: {{t.muted}}">{{kicker}}</div>''','''gap: 8px">
                  <div style="font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {{t.muted}}">{{kicker}}</div>''')
rep('''style="font-family: 'Geist Mono', ui-monospace, monospace; font-weight: 300; font-size: {{ringSize}}; line-height: 1; letter-spacing: -0.05em;''','''style="font-family: Geist, system-ui, sans-serif; font-weight: 300; font-size: {{ringSize}}; line-height: 1; letter-spacing: -0.04em;''')
rep('''<div style="font-size: 15px; color: {{t.muted}}">{{metaA}}''','''<div style="font-size: 15px; line-height: 22px; color: {{t.muted}}">{{metaA}}''')
# 5 note
rep('''align-items: {{align}}; gap: 6px; text-align''','''align-items: {{align}}; gap: 8px; text-align''')
rep('''gap: 8px; font-size: 15px; font-weight: 500; line-height: 1.45; color: {{t.ink}}''','''gap: 8px; font-size: 15px; font-weight: 500; line-height: 22px; color: {{t.ink}}''')
rep('''<p class="at-rise" style="margin: 0; font-size: 14px; line-height: 1.5; color: {{t.muted}}; text-wrap: pretty">{{note}}</p>''','''<p class="at-rise" style="margin: 0; font-size: 14px; line-height: 20px; color: {{t.muted}}; text-wrap: pretty">{{note}}</p>''')
# 6 chips: selected Until chip is solid (selected), Pick a length stays dashed (choose affordance)
rep('''<a href="#times" aria-label="{{chipAria}}" style="display: inline-flex; align-items: center; gap: 8px; height: 44px; padding: 0 16px 0 13px; box-sizing: border-box; border-radius: 999px; border: 1px dashed {{lamp}}; background: {{lampSoft}}; font-size: 14px; font-weight: 600; color: {{t.ink}}; text-decoration: none; white-space: nowrap"><span aria-hidden="true" style="width: 6px; height: 6px; border-radius: 50%; background: {{lamp}}"></span>{{chipLabel}}</a>''',
'''<a href="#times" aria-label="{{chipAria}}" style="display: inline-flex; align-items: center; gap: 8px; height: 44px; padding: 0 16px 0 12px; box-sizing: border-box; border-radius: 999px; border: 1px solid {{lampLine}}; background: {{lampSoft}}; font-size: 15px; line-height: 22px; font-weight: 600; color: {{t.ink}}; text-decoration: none; white-space: nowrap"><span aria-hidden="true" style="width: 8px; height: 8px; border-radius: 50%; background: {{lamp}}"></span>{{chipLabel}}</a>''')
rep('''border: 1px dashed {{t.line2}}; font-size: 14px; font-weight: 500; color: {{t.ink2}}; text-decoration: none; white-space: nowrap">Pick a length</a>''','''border: 1px dashed {{t.line2}}; font-size: 15px; line-height: 22px; font-weight: 500; color: {{t.ink2}}; text-decoration: none; white-space: nowrap">Pick a length</a>''')
# 7 CTA / running
rep('''<button class="at-rise" onClick="{{start}}" style="height: 60px; border-radius: 20px; border: 0; background: {{lamp}}; color: {{lampInk}}; font-size: 17px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 10px 30px -8px {{lampGlow}}">''','''<button class="at-rise" onClick="{{start}}" style="height: 60px; border-radius: 20px; border: 0; background: {{lamp}}; color: {{lampInk}}; font-size: 17px; line-height: 24px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 10px 30px -8px {{lampGlow}}">''')
rep('''grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">''','''grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px">''')
rep('''background: {{t.surface}}; font-size: 17px; font-weight: 600; color: {{t.ink}}">+15 min</button>''','''background: {{t.surface}}; font-size: 17px; line-height: 24px; font-weight: 600; color: {{t.ink}}">+15 min</button>''')
rep('''background: {{t.primaryBg}}; font-size: 17px; font-weight: 600; color: {{t.primaryInk}}">Stop</button>''','''background: {{t.primaryBg}}; font-size: 17px; line-height: 24px; font-weight: 600; color: {{t.primaryInk}}">Stop</button>''')
# 8 prose
i=s.index('    <section aria-labelledby="h-until"'); j=s.index('    </section>',i)+len('    </section>')
s=s[:i]+'''    <section aria-labelledby="h-until" style="display: flex; flex-direction: column; gap: 16px">
      <span style="font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {{t.muted}}">About this page</span>
      <h1 id="h-until" style="margin: 0; font-size: {{fs.h1}}; line-height: {{fs.h1lh}}; font-weight: 600; letter-spacing: -0.02em; color: {{t.ink}}; text-wrap: balance">Keep your screen awake until 7:30 AM</h1>
      <p style="margin: 0; font-size: 18px; line-height: 28px; color: {{t.ink}}; text-wrap: pretty">Tap Keep awake and AwakeTab works out the length from your device clock, then counts down to 7:30 AM. If 7:30 AM has already passed today, the session ends at 7:30 AM tomorrow, and the tool says so before you start.</p>
      <p style="margin: 0; font-size: 16px; line-height: 26px; color: {{t.ink2}}; text-wrap: pretty">The end time stays fixed while the session runs. +15 min moves it 15 minutes later, and Stop ends it now. The pill still decides what is true: it reads “Screen awake” only while the browser holds the wake lock.</p>
      %%P-NOTE%%
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="{{t.ink2}}" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" style="margin-top: 2px"><circle cx="12" cy="12" r="9"></circle><path d="M12 11v6M12 7.5v.01"></path></svg>
        <div style="display: flex; flex-direction: column; gap: 4px; min-width: 0">
          <span style="font-size: 12px; line-height: 16px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: {{t.muted}}">Honest limit</span>
          <p style="margin: 0; font-size: 16px; line-height: 26px; color: {{t.ink}}; text-wrap: pretty">An overnight session needs this tab in front for the whole night. A hidden tab, a closed lid or another app in front lets the display sleep. Plug in so the battery lasts until morning.</p>
        </div>
      </div>
    </section>'''+s[j:]
# 9 times
rep('''<nav id="times" aria-labelledby="h-times" style="display: flex; flex-direction: column; gap: 14px">
      <h2 id="h-times" style="margin: 0; font-size: {{fs.h2}}; line-height: 1.25; font-weight: 600; letter-spacing: -0.02em; color: {{t.ink}}">Nearby times</h2>
      <ul style="margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: {{timeCols}}; gap: 10px">''','''<nav id="times" aria-labelledby="h-times" style="display: flex; flex-direction: column; gap: 16px">
      <h2 id="h-times" style="margin: 0; font-size: {{fs.h2}}; line-height: {{fs.h2lh}}; font-weight: 600; letter-spacing: -0.02em; color: {{t.ink}}">Nearby times</h2>
      <ul style="margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: {{timeCols}}; gap: 12px">''')
rep('''class="at-row" style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px; min-height: 88px; padding: 14px 16px; box-sizing: border-box; border-radius: 20px; background: {{t.surface}}; border: 1px solid {{t.line}}; text-decoration: none; color: {{t.ink}}">
              <span style="font-family: 'Geist Mono', ui-monospace, monospace; font-size: 22px; font-weight: 400; letter-spacing: -0.03em; font-variant-numeric: tabular-nums">{{tm.label}}</span>
              <span style="font-size: 13px; color: {{t.ink2}}">{{tm.sub}}</span>
              <span style="font-family: 'Geist Mono', ui-monospace, monospace; font-size: 12px; color: {{t.muted}}">{{tm.path}}</span>''','''class="at-row" style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px; padding: 16px; box-sizing: border-box; border-radius: 16px; background: {{t.surface}}; border: 1px solid {{t.line}}; text-decoration: none; color: {{t.ink}}">
              <span style="font-size: 24px; line-height: 32px; font-weight: 300; letter-spacing: -0.02em; font-variant-numeric: tabular-nums">{{tm.label}}</span>
              <span style="font-size: 13px; line-height: 18px; color: {{t.ink2}}">{{tm.sub}}</span>
              <span style="font-family: 'Geist Mono', ui-monospace, monospace; font-size: 13px; line-height: 18px; color: {{t.muted}}">{{tm.path}}</span>''')
rep('''display: inline-flex; align-items: center; min-height: 44px; font-size: 16px; color: {{link}}">Any other time''','''display: inline-flex; align-items: center; min-height: 44px; font-size: 16px; line-height: 26px; color: {{link}}">Any other time''')
# 10 footer
i=s.index('  <footer style='); j=s.index('</footer>')+len('</footer>')
s=s[:i]+'  %%P-FOOTER%%'+s[j:]
# 11 JS
rep('"$preview":{"width":390,"height":2100}','"$preview":{"width":390,"height":%%H_PHONE%%}')
rep("const C = 2 * Math.PI * 146;","%%JS constants%%\nconst C = 2 * Math.PI * 146;")
rep("track: '#1A2336', tick: '#2A3752', primaryBg: '#EAF0F7', primaryInk: '#0A0E16', chip: '#26324B', chipShadow: 'rgba(0,0,0,0.4)'\n};","track: '#1A2336', tick: '#2A3752', primaryBg: '#EAF0F7', primaryInk: '#0A0E16', raised: AT_TOK.dark.raised, sunken: AT_TOK.dark.sunken\n};")
rep("track: '#E3E9F1', tick: '#CCD5E1', primaryBg: '#0E1726', primaryInk: '#F4F7FB', chip: '#E3EAF2', chipShadow: 'rgba(14,23,38,0.14)'\n};","track: '#E3E9F1', tick: '#CCD5E1', primaryBg: '#0E1726', primaryInk: '#F4F7FB', raised: AT_TOK.light.raised, sunken: AT_TOK.light.sunken\n};")
rep("const SIZES = { phone: 2100, tablet: 2160, desktop: 1750 };","const SIZES = { phone: %%H_PHONE%%, tablet: %%H_TABLET%%, desktop: %%H_DESKTOP%% };")
rep("const tone = live ? lamp : t.muted;","const tone = live ? lamp : t.muted;\n    const ty = AT_TYPE[layout];")
rep("""      hdrPad: tab ? '0 20px 0 32px' : desk ? '0 32px 0 36px' : '0 12px 0 20px', linePad: tab ? '0 32px' : desk ? '0 36px' : '0 20px',""","""      hdr: AT_HDR[layout], foot: { pad: AT_FOOT[layout] }, cardPad: AT_CARD_PAD[layout], linePad: '0 ' + ty.gutter,""")
rep("""column-gap: 64px; row-gap: 20px; padding: 8px 96px 40px 72px\"""","""column-gap: 64px; row-gap: 20px; padding: 8px 80px 40px 80px\"""")
rep("""row-gap: 20px; padding: 28px 24px 48px\"""","""row-gap: 20px; padding: 32px 32px 48px\"""")
rep("""row-gap: 14px; padding: 14px 16px 20px\"""","""row-gap: 12px; padding: 12px 16px 20px\"""")
rep("lampSoft: this.rgba(lamp, 0.12), lampGlow: this.rgba(lamp, 0.55),","lampSoft: this.rgba(lamp, 0.14), lampLine: this.rgba(lamp, 0.45), lampGlow: this.rgba(lamp, 0.55),")
rep("glyphFill: mode === 'awake' ? tone : 'transparent',","glyphFill: mode === 'awake' ? tone : 'transparent', glyph: 'M6 1.5a4.5 4.5 0 1 1 0 9a4.5 4.5 0 1 1 0-9z',")
rep("""      prosePad: desk ? '56px 0 0' : tab ? '48px 0 0' : '40px 20px 0',
      gap: desk || tab ? '44px' : '36px',
      fs: desk || tab ? { h1: '40px', h2: '24px', lede: '20px', body: '18px', note: '17px' } : { h1: '30px', h2: '21px', lede: '18px', body: '17px', note: '16px' },""","""      prosePad: desk ? '96px 0 96px' : tab ? '64px 0 64px' : '48px 16px 48px',
      gap: ty.section,
      fs: { h1: ty.h1, h1lh: ty.h1lh, h2: ty.h2, h2lh: ty.h2lh },""")
rep("times, footPad: desk ? '56px' : tab ? '70px' : '20px',","times,")
rep("themeLightInk: s.theme === 'light' ? t.ink : t.muted, themeDarkInk: s.theme === 'dark' ? t.ink : t.muted, themeAutoInk: s.theme === 'auto' ? t.ink : t.muted,","themeLightInk: s.theme === 'light' ? t.ink : t.ink2, themeDarkInk: s.theme === 'dark' ? t.ink : t.ink2, themeAutoInk: s.theme === 'auto' ? t.ink : t.ink2,")
open(F+'pu/UntilPage.tpl.html','w').write(s)
print('ok')
