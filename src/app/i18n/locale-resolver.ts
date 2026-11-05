/** URL locale helpers used by SSR / tests. */

export type AppLocale = 'es' | 'en';

export function resolveLocaleFromUrl(url: string): AppLocale {
  if (!url) return 'es';
  const path = url.split('?')[0] ?? '';
  if (path === '/en' || path.startsWith('/en/')) return 'en';
  if (path === '/es' || path.startsWith('/es/')) return 'es';
  return 'es';
}

export function stripLocalePrefix(url: string): string {
  if (!url) return '/';
  const [path, query] = url.split('?');
  const stripped = path.replace(/^\/(en|es)(?=\/|$)/, '') || '/';
  return query ? `${stripped}?${query}` : stripped;
}

export function resolveLocaleBrowserDir(basePath: string, locale: AppLocale | string): string {
  const root = basePath.replace(/\/$/, '');
  return `${root}/browser/${locale}`;
}
