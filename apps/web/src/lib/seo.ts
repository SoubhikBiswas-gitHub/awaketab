import { LOCALE_META, type TLocale } from '../i18n/locales';

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
  image?: string;
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
    inLanguage: LOCALE_META[locale].hreflang,
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
        inLanguage: LOCALE_META[locale].hreflang,
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
    inLanguage: LOCALE_META[input.locale].hreflang,
    // Google does not resolve an @id on another page, so the article names its author and publisher inline.
    author: { '@type': 'Person', '@id': `${SITE}/about#person`, name: 'Soubhik Biswas', url: `${SITE}/about` },
    publisher: { '@type': 'Organization', '@id': `${SITE}/#org`, name: 'AwakeTab', url: `${SITE}/` },
  };
  if (input.image) article.image = input.image;
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

export interface ISoftwareSchemaInput {
  canonical: string;
  name: string;
  description: string;
  operatingSystem: string;
  breadcrumbs: Array<{ name: string; url: string }>;
}

export function softwareSchema(input: ISoftwareSchemaInput): TSchemaNode {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: input.name,
        description: input.description,
        url: input.canonical,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: input.operatingSystem,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@id': `${SITE}/#org` },
      },
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
