import { polarServer } from '../_lib/polar';

interface IEnv {
  readonly CF_PAGES_COMMIT_SHA?: string;
  readonly PUBLIC_POLAR_SERVER?: string;
}

export const onRequestGet: PagesFunction<IEnv> = (context) => {
  const version = context.env.CF_PAGES_COMMIT_SHA?.slice(0, 12) ?? 'dev';

  return Response.json(
    // `polar` lets a deploy check confirm which Polar the licence API talks to (LAUNCH-AUDIT N-13).
    { ok: true, version, polar: polarServer(context.env) },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
};
