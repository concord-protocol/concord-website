/**
 * Adds `target="_blank"` and `rel="noopener"` to every off-site link in the
 * rendered HTML. Doing it here covers links in Markdown content, synced spec
 * pages, and Starlight's own chrome (GitHub icon, "Edit page"), which can't be
 * annotated by hand. Runs at build time per page, and in `astro dev`.
 *
 * Existing `rel` tokens are kept. Older browsers don't imply `noopener` for
 * `target="_blank"`.
 */
import { defineMiddleware } from 'astro:middleware';

/** The site's own hostname, from `site` in astro.config.mjs. */
const SITE_HOST = (() => {
  try {
    return new URL(import.meta.env.SITE ?? '').hostname;
  } catch {
    return '';
  }
})();

/**
 * An opening `<a>` tag, with its attributes captured. The alternation keeps a
 * quoted `>` inside an attribute value from ending the match early.
 */
const ANCHOR = /<a\s+((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;

const HREF = /(?:^|\s)href\s*=\s*"([^"]*)"/i;
const REL = /(?:^|\s)rel\s*=\s*"([^"]*)"/i;
const TARGET = /(?:^|\s)target\s*=/i;

/**
 * True for absolute http(s) URLs on another host. Relative hrefs, fragments,
 * and other schemes (`mailto:`, `nostr:`) are not external.
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
    // Respect an explicit target.
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

  // HTML only. The sitemap and Pagefind's index also pass through here and
  // must not be rewritten.
  if (!response.headers.get('content-type')?.includes('text/html')) {
    return response;
  }

  const body = addTargets(await response.text());

  // The body length changed.
  const headers = new Headers(response.headers);
  headers.delete('content-length');

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
