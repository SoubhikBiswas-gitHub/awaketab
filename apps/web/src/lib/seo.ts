import type { TLocale } from '../i18n/locales';

export type TSchemaNode = Record<string, unknown>;

export interface IRatingsSummary {
  count: number;
  average: number;
}

export interface IArticleSchemaInput {
  canonical: string;
  title: string;
  description: string;
  locale: TLocale;
  published: string;
  updated?: string;
  breadcrumbs: Array<{ name: string; url: string }>;
}

const SITE = 'https://awaketab.com';

export function homeSchema(locale: TLocale, ratings: IRatingsSummary): TSchemaNode {
  const application: TSchemaNode = {
    '@type': 'WebApplication',
    '@id': `${SITE}/#app`,
    name: 'AwakeTab',
    url: `${SITE}/`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires a browser with Screen Wake Lock API support or the video fallback',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    inLanguage: locale,
  };
  if (ratings.count >= 25) {
    application.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: ratings.average,
      ratingCount: ratings.count,
      bestRating: 5,
      worstRating: 1,
    };
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE}/#org`,
        name: 'AwakeTab',
        url: `${SITE}/`,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE}/icons/icon-512.png`,
          width: 512,
          height: 512,
        },
        founder: { '@id': `${SITE}/about#person` },
        sameAs: ['https://github.com/awaketab', 'https://www.npmjs.com/package/@awaketab/wake'],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE}/#website`,
        name: 'AwakeTab',
        url: `${SITE}/`,
        publisher: { '@id': `${SITE}/#org` },
        inLanguage: locale,
      },
      application,
    ],
  };
}

export function articleSchema(input: IArticleSchemaInput): TSchemaNode {
  const article: TSchemaNode = {
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    url: input.canonical,
    datePublished: input.published,
    dateModified: input.updated ?? input.published,
    inLanguage: input.locale,
    author: { '@id': `${SITE}/about#person` },
    publisher: { '@id': `${SITE}/#org` },
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      article,
      {
        '@type': 'BreadcrumbList',
        itemListElement: input.breadcrumbs.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      },
    ],
  };
}

export function personSchema(): TSchemaNode {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${SITE}/about#person`,
        name: 'Soubhik Biswas',
        url: `${SITE}/about`,
        worksFor: { '@id': `${SITE}/#org` },
      },
    ],
  };
}
