/*
 * Renders public/og.png (1200x630): the hero lockup as a still, for link
 * previews. Run `npm run og` after changing the mark, the wordmark, or the
 * tagline, and commit the result — the build serves the file as-is.
 *
 * The image is the finished state of the hero in src/components/sections/
 * Hero.astro: mint grid lit from behind the lockup, the mark, the outlined
 * "Concord Protocol" wordmark, the tagline. Everything is drawn a touch
 * brighter than the live page, because a preview card is small and dark
 * subtlety just reads as mud at 500px wide.
 *
 * Text is real text, set in the site's own faces. librsvg finds fonts through
 * fontconfig, which knows nothing of node_modules — and the @fontsource
 * packages ship only woff/woff2, which the freetype in sharp's bundled libvips
 * will not open. So the two faces are decompressed to TTF into a temp dir, a
 * throwaway fontconfig file pointing there is written beside them, and both
 * are handed over via FONTCONFIG_FILE — which must be set before sharp loads,
 * hence the dynamic import at the bottom.
 */
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { decompress } from 'wawoff2';

const root = resolve(import.meta.dirname, '..');

const fontDir = mkdtempSync(join(tmpdir(), 'concord-og-'));
for (const woff2 of [
  '@fontsource/bruno-ace/files/bruno-ace-latin-400-normal.woff2',
  '@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2',
]) {
  const name = woff2.split('/').at(-1).replace(/\.woff2$/, '.ttf');
  writeFileSync(
    join(fontDir, name),
    await decompress(readFileSync(join(root, 'node_modules', woff2))),
  );
}
writeFileSync(
  join(fontDir, 'fonts.conf'),
  `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${fontDir}</dir>
  <cachedir>${fontDir}</cachedir>
</fontconfig>
`,
);
process.env.FONTCONFIG_FILE = join(fontDir, 'fonts.conf');

const W = 1200;
const H = 630;

/* The design tokens, from src/styles/global.css. */
const MINT = '#24e8a3';
const GRAY_200 = '#cbdbd3';

/* The mark's geometry, from src/components/Logo.astro: a 128px viewBox. */
const OUTER = 'M 90.90 22.88 A 49 49 0 1 0 90.54 104.36';
const SEGMENT = 'M 99.04 97.23 A 49 49 0 0 0 99.04 29.77';
const INNER = 'cx="63.5" cy="63.5" r="27.3"';

/* The lockup's column, sized like the hero at its largest breakpoint. */
const MARK = 252;
const MARK_Y = 96;
/* The optical nudge from Hero.astro: the ring's ink sits left of its box's
   centre, so the mark shifts right by 8.8% of its own width to line up with
   the wordmark. */
const MARK_X = W / 2 - MARK / 2 + MARK * 0.088;
const WORDMARK_Y = 448;
const TAGLINE_Y = 540;

/* One copy of the mark's three strokes, so the glow layer can repeat it. */
const mark = `
  <circle ${INNER} stroke="#5AFDB2" stroke-width="12.5"/>
  <path d="${OUTER}" stroke="#1DA57A" stroke-width="12"/>
  <path d="${SEGMENT}" stroke="#FFFFFF" stroke-width="12"/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" fill="none">
  <defs>
    <!-- The hero's centre glow, but painted *into* the grid: the gradient is
         the lines' brightness, the pattern below is which pixels get it. -->
    <radialGradient id="glow" cx="0.5" cy="0.44" r="0.62">
      <stop offset="0" stop-color="#fff" stop-opacity="1"/>
      <stop offset="0.55" stop-color="#fff" stop-opacity="0.3"/>
      <stop offset="0.9" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
      <path d="M 72 0 L 0 0 0 72" stroke="${MINT}" stroke-width="1"/>
    </pattern>
    <mask id="gridmask">
      <rect width="${W}" height="${H}" fill="url(#glow)"/>
    </mask>
    <filter id="halo" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="7"/>
    </filter>
    <filter id="bloom" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="#000"/>
  <rect width="${W}" height="${H}" fill="url(#grid)" opacity="0.4" mask="url(#gridmask)"/>

  <!-- The mark, with its resting halo underneath: two blurred copies standing
       in for the two drop-shadows .cx-mark-glow stacks. -->
  <g transform="translate(${MARK_X} ${MARK_Y}) scale(${MARK / 128})">
    <g filter="url(#bloom)" opacity="0.5">${mark}</g>
    <g filter="url(#halo)" opacity="0.55">${mark}</g>
    ${mark}
  </g>

  <!-- The wordmark: Bruno Ace, outlined in mint with the fill knocked out,
       condensed to 0.93 about its centre, over its own bloom — the SVG spelling
       of .cx-wordmark. The word gap is the hero's 0.22em. -->
  <g transform="translate(${W / 2} ${WORDMARK_Y}) scale(0.93 1)">
    <text x="0" y="0" text-anchor="middle" font-family="Bruno Ace" font-size="60"
      word-spacing="6" stroke="${MINT}" stroke-width="2" filter="url(#halo)"
      opacity="0.6">Concord Protocol</text>
    <text x="0" y="0" text-anchor="middle" font-family="Bruno Ace" font-size="60"
      word-spacing="6" stroke="${MINT}" stroke-width="2">Concord Protocol</text>
  </g>

  <text x="${W / 2}" y="${TAGLINE_Y}" text-anchor="middle"
    font-family="IBM Plex Sans" font-weight="500" font-size="34"
    letter-spacing="-0.5" fill="${GRAY_200}">Private communities. <tspan
    fill="${MINT}">Open protocol.</tspan></text>
</svg>`;

const sharp = (await import('sharp')).default;
await sharp(Buffer.from(svg), { density: 96 })
  .png()
  .toFile(join(root, 'public/og.png'));
console.log('wrote public/og.png');
