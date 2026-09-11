// Draft, human-translated-quality copy for the seven non-English homes (docs/BUILD-STATE.md
// "Known gaps": E6-T04). Each locale file below is unreviewed machine-assisted translation —
// the page stays `noindex` (LOCALE_META[locale].reviewed === false in src/i18n/locales.ts)
// until a native speaker signs off, exactly like the thin stub it replaces.
export interface ILocaleHomeCopy {
  /** Two paragraphs under "What AwakeTab does" (h2 translated separately via page.home.* keys is not
   *  reused here; this file owns only the prose, so include the section heading as normal text if the
   *  target language expects one - the component supplies its own <h2>). */
  whatItDoes: [string, string];
  /** Exactly three numbered steps under "How it works". */
  howItWorks: [string, string, string];
  /** Exactly six bullets under "Honest limits", each "label" bolded lead-in + one sentence, matching
   *  the English page's six points (hidden tab, closed lid, battery saver, chat status, display vs
   *  system sleep, other software's own rules). */
  honestLimits: [string, string, string, string, string, string];
}
