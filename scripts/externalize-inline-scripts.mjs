/**
 * Move every inline `<script>` in the built HTML out into a file of its own.
 *
 * The site is served by an nsite gateway, which sends a strict policy:
 *
 *   default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline';
 *   font-src 'self'; img-src 'self' data: blob: https:; ...
 *
 * `script-src 'self'` with no `'unsafe-inline'` means an inline script does not
 * run, full stop. Nothing the page says about itself can widen that: a policy
 * delivered in a header and one delivered in a `<meta>` are enforced together,
 * and a resource has to satisfy both. So Astro's `security.csp`, which hashes
 * the inline scripts and lists them in a `<meta>` tag, is no help here — the
 * hash satisfies our policy and the gateway's `'self'` still rejects it. The
 * only thing that works is to not ship inline scripts.
 *
 * Most of them go away by setting `build.assetsInlineLimit` to 0 in
 * astro.config.mjs, which is what decides whether Astro writes a bundled
 * component script to a file or pastes it into the page (see
 * `shouldInlineScriptChunk` in astro/dist/core/build/plugins/plugin-scripts).
 * That does not reach Starlight's `is:inline` scripts — the theme provider, the
 * search shortcut hint, the sidebar state persister — because `is:inline` means
 * exactly "leave this in the page", and they are inside Starlight's own
 * components rather than ours. Overriding four upstream components to change
 * how they load their JavaScript would have to be redone at every Starlight
 * release. Rewriting the finished HTML costs one pass over dist and covers
 * whatever the next release adds.
 *
 * Execution order and timing survive the move. A classic external script blocks
 * the parser exactly like an inline one, so the theme provider still runs
 * before anything paints and there is no flash of the wrong theme; the cost is
 * one same-origin request, for a file every page shares. External modules are
 * deferred and run in document order, which is what the inline modules they
 * replace already did.
 *
 * Scripts are named by the hash of their contents, so the handful that Starlight
 * repeats on all 31 pages become one file that is fetched once.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * A whole script element, with its attributes and body captured. The
 * alternation in the attribute part keeps a quoted `>` from ending the opening
 * tag early; the lazy body stops at the first literal `</script>`, which is
 * where the HTML parser ends it too.
 */
const SCRIPT = /<script((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script>/gi;

const SRC = /(?:^|\s)src\s*=/i;
const TYPE = /(?:^|\s)type\s*=\s*"([^"]*)"/i;

/**
 * The type values that make a script something the browser executes, and so
 * something the policy blocks. Anything else — `application/ld+json`, an
 * import map, a template — is data the parser hands to something else, is not
 * covered by `script-src`, and would break if it were moved to a file.
 */
const EXECUTABLE = new Set(['', 'module', 'text/javascript', 'application/javascript']);

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith('.html')) yield full;
  }
}

export default function externalizeInlineScripts() {
  let assets = '_astro';
  let base = '/';

  return {
    name: 'externalize-inline-scripts',
    hooks: {
      'astro:config:done': ({ config }) => {
        assets = config.build.assets;
        base = config.base;
      },

      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const assetsDir = path.join(root, assets);
        await mkdir(assetsDir, { recursive: true });

        // Contents already written, keyed by hash, so the same script found on
        // every page is written once.
        const written = new Set();
        let moved = 0;

        for await (const file of htmlFiles(root)) {
          const html = await readFile(file, 'utf8');
          const replacements = [];

          const rewritten = html.replace(SCRIPT, (tag, attrs, body) => {
            if (SRC.test(attrs)) return tag;
            if (!EXECUTABLE.has((attrs.match(TYPE)?.[1] ?? '').trim().toLowerCase())) return tag;

            const code = body.trim();
            if (!code) return tag;

            const hash = createHash('sha256').update(code).digest('hex').slice(0, 8);
            const name = `inline.${hash}.js`;
            if (!written.has(name)) {
              written.add(name);
              replacements.push([name, code]);
            }

            moved += 1;
            const href = path.posix.join(base, assets, name);
            return `<script${attrs} src="${href}"></script>`;
          });

          if (rewritten === html) continue;

          await Promise.all(
            replacements.map(([name, code]) => writeFile(path.join(assetsDir, name), code)),
          );
          await writeFile(file, rewritten);
        }

        logger.info(`Moved ${moved} inline scripts into ${written.size} files`);
      },
    },
  };
}
