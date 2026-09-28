export interface ITrack {
  id: string;
  title: string;
  artist: string;
  licence: string;
  url: string;
  duration: number;
}

// Only tracks whose licence is verified as CC0 or equivalent. Files live in public/audio/ and load only when played.
// How to add one: docs/05-frontend-spec.md, "Sounds".
export const TRACKS: readonly ITrack[] = [];
