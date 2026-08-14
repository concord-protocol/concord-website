/**
 * Send every off-site link to a new tab.
 *
 * Done once here rather than by hand on each anchor, because "external link"
 * is a property of the URL and not of the component that happened to print it.
 * The links are spread across the marketing sections, the data in site.ts, the
 * prose in the docs collection, the synced spec pages' "Normative source"
 * notes, and Starlight's own chrome — the header's GitHub icon and every "Edit
 * page" link. Only the first of those is somewhere an attribute could have been
 * typed, and the rule would have had to be re-stated in all five.
 *
 * This is a static site, so the middleware runs at build time, once per page,
 * and what ships is ordinary HTML with the attributes already in it. It runs in
 * `astro dev` too, so a link behaves the same way in development as in the
 * built site.
 *
 * `rel="noopener"` is added alongside, preserving whatever the anchor already
 * declared: `target="_blank"` hands the opened page a `window.opener` handle
 * back into this one unless it is severed. Current browsers imply it, older
 * ones do not, and the site already writes it out by hand in most places.
 */
import { defineMiddleware } from 'astro:middleware';

/**
 * Anything not served from here. Taken from `site` in astro.config.mjs, which
 * Astro exposes as `SITE`, so the production domain is still declared in one
 * place — and the TODO sitting over it stays a one-line change.
 */
const SITE_HOST = (() => {
  try {
    return new URL(import.meta.env.SITE ?? '').hostname;
  } catch {
    return '';
  }
})();

/**
 * An opening `<a>` tag, with its attributes captured. The alternation is what
 * keeps a quoted `>` inside an attribute value from ending the match early.
 */
const ANCHOR = /<a\s+((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;

const HREF = /(?:^|\s)href\s*=\s*"([^"]*)"/i;
const REL = /(?:^|\s)rel\s*=\s*"([^"]*)"/i;
const TARGET = /(?:^|\s)target\s*=/i;

/**
 * Absolute http(s) URLs pointing somewhere else. Relative hrefs, fragments,
 * and `mailto:`/`nostr:` schemes are all left alone — the first two are this
 * site, and the rest are handed to another application rather than to a tab.
 */
function isExternal(href: string): boolean {
  if (!/^https?:\/\//i.test(href)) return false;
  if (!SITE_HOST) return true;
  try {
    const { hostname } = new URL(href);
    return hostname !== SITE_HOST && hostname !== `www.${SITE_HOST}`;
  } catch {
    return false;
  }
}

export function addTargets(html: string): string {
  return html.replace(ANCHOR, (tag, attrs: string) => {
    const href = attrs.match(HREF)?.[1];
    if (!href || !isExternal(href)) return tag;
    // An anchor that already says where it opens is left as it is.
    if (TARGET.test(attrs)) return tag;

    const rel = attrs.match(REL);
    const tokens = new Set(rel ? rel[1].split(/\s+/).filter(Boolean) : []);
    tokens.add('noopener');
    const declared = `rel="${[...tokens].join(' ')}"`;

    const rewritten = rel
      ? attrs.replace(rel[0], `${rel[0].startsWith(' ') ? ' ' : ''}${declared}`)
      : `${attrs} ${declared}`;

    return `<a ${rewritten.trim()} target="_blank">`;
  });
}

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();

  // Pages only. The build also pushes the sitemap and Pagefind's index bundles
  // through here, and rewriting either would be a bug rather than a no-op.
  if (!response.headers.get('content-type')?.includes('text/html')) {
    return response;
  }

  const body = addTargets(await response.text());

  // The body's length has changed, so any declared one is now a lie.
  const headers = new Headers(response.headers);
  headers.delete('content-length');

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
