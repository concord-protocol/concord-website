/*
 * Renders public/og.png (1200x630), a still of the final hero lockup from
 * src/components/sections/Hero.astro, drawn slightly brighter so it reads at
 * preview size. Run `npm run og` after changing the mark, wordmark, or tagline,
 * and commit the result; the build serves it as-is.
 *
 * librsvg finds fonts through fontconfig, and sharp's bundled freetype can't
 * open woff/woff2. So the @fontsource faces are decompressed to TTF in a temp
 * dir with a fontconfig file pointing at it, passed via FONTCONFIG_FILE. That
 * must be set before sharp loads, hence the dynamic import at the bottom.
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

/* Sized like the hero at its largest breakpoint. */
const MARK = 252;
const MARK_Y = 96;
/* The optical nudge from Hero.astro: shift the mark right by 8.8% of its
   width, since its ink sits left of the box centre. */
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
    <!-- Masks the grid with the radial glow, as .cx-grid-bg-center does. -->
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

  <!-- The mark over two blurred copies, standing in for .cx-mark-glow's two
       drop-shadows. -->
  <g transform="translate(${MARK_X} ${MARK_Y}) scale(${MARK / 128})">
    <g filter="url(#bloom)" opacity="0.5">${mark}</g>
    <g filter="url(#halo)" opacity="0.55">${mark}</g>
    ${mark}
  </g>

  <!-- Equivalent of .cx-wordmark: mint outline, no fill, scaleX(0.93), over a
       blurred copy. word-spacing 6 approximates the hero's 0.22em gap. -->
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
