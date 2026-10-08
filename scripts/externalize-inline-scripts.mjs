/**
 * Moves every inline `<script>` in the built HTML into its own file.
 *
 * The nsite gateway sends a CSP header including:
 *
 *   default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline';
 *   font-src 'self'; img-src 'self' data: blob: https:; ...
 *
 * so inline scripts never run. Header and `<meta>` policies are both enforced,
 * so Astro's `security.csp` hashes can't help.
 *
 * `build.assetsInlineLimit: 0` in astro.config.mjs keeps Astro's bundled
 * scripts external (see `shouldInlineScriptChunk` in astro's plugin-scripts),
 * but not Starlight's `is:inline` scripts (theme provider, search hint, sidebar
 * state). Rewriting dist handles those without overriding Starlight components.
 *
 * Order is preserved: external classic scripts still block the parser (so the
 * theme still applies before paint), and external modules are deferred like
 * inline ones. Files are named by content hash, so scripts repeated on every
 * page are written once.
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
 * Executable script types. Others (`application/ld+json`, import maps,
 * templates) aren't subject to `script-src` and must stay inline.
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

        // File names already written, so a repeated script is written once.
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
