interface IEnv {
  readonly CF_PAGES_COMMIT_SHA?: string;
}

export const onRequestGet: PagesFunction<IEnv> = (context) => {
  const version = context.env.CF_PAGES_COMMIT_SHA?.slice(0, 12) ?? 'dev';

  return Response.json(
    { ok: true, version },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
};
