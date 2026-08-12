# concord-website

Marketing and documentation site for the [Concord Protocol](https://github.com/concord-protocol/concord).

Built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build),
styled with Tailwind CSS v4.

## Running it

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # syncs the specs, then builds to dist/
npm run preview
```

## Before deploying

> [!IMPORTANT]
> Set the real production domain. It is a single constant, `SITE`, at the top of
> [`astro.config.mjs`](astro.config.mjs), and it currently holds the placeholder
> `https://concordprotocol.org`. It feeds canonical URLs, Open Graph tags, and
> the sitemap, so a wrong value is visible to crawlers.
>
> The same domain appears in [`public/robots.txt`](public/robots.txt).

## Structure

```
src/
  pages/            marketing pages (landing, clients, announcement, 404)
  layouts/          the marketing shell
  components/
    sections/       landing-page sections
    starlight/      Starlight component overrides
  content/docs/
    learn/          conceptual introduction
    concepts/       one page per protocol area
    spec/           the CORD documents (generated — see below)
    build/          implementer material
  data/site.ts      outbound links, clients, and tooling
  styles/global.css design tokens and Starlight theming
scripts/
  sync-spec.mjs     pulls the CORD documents into the docs collection
```

Marketing pages live in `src/pages` and use their own layout. Everything under
`src/content/docs` is Starlight. Astro gives `src/pages` priority, so the custom
landing page wins over Starlight's root route.

## The specification pages are generated

`src/content/docs/spec/*.md` is **generated output — do not edit it by hand.**
Those files are synced verbatim from the specification repository, which is the
normative source of truth.

```sh
npm run sync:spec
```

The script resolves its source in this order:

1. `$CONCORD_SPEC_DIR`
2. `../concord`, relative to this repo
3. `raw.githubusercontent.com`, so CI works without a second checkout

It strips the leading `H1` (Starlight renders the title from frontmatter),
rewrites inter-document links like `02.md` to `/spec/cord-02/`, and points each
page's edit link at the spec repository rather than this one.

The generated files **are** committed, so a build never requires network access.
To pick up spec changes, run the script and commit the diff.

To add a new CORD document, add an entry to `DOCUMENTS` in
[`scripts/sync-spec.mjs`](scripts/sync-spec.mjs) and a sidebar entry in
`astro.config.mjs`.

## Design tokens

The palette is near-black surfaces with a mint-green signal, defined once in the
`@theme` block of [`src/styles/global.css`](src/styles/global.css).

Because the accent and gray ramps are consumed by `@astrojs/starlight-tailwind`,
Starlight derives its own theme from the same values — so the docs and the
marketing pages stay in lockstep.

> [!NOTE]
> Use the generated named utilities (`border-hairline`, `text-mint`,
> `bg-raised`) rather than arbitrary-value syntax like `border-[--color-hairline]`.
> Under Tailwind v4 the latter emits `border-color: --color-hairline`, which is
> invalid CSS and fails silently.

## The logo

The mark is an open "C" ring with a mint inner ring, defined as inline SVG in
[`src/components/Logo.astro`](src/components/Logo.astro) and again in
[`public/favicon.svg`](public/favicon.svg).

> [!NOTE]
> The source artwork, kept at `src/assets/concord-logo-source.png` for
> provenance, **cannot be used directly on this site.** Its "C" opening is
> filled with *opaque white* rather than transparency — invisible on a white
> page, a glaring white crescent on a black one.

The SVG is a measured trace of that raster rather than a redraw: centre 63.5,
outer ring r49 stroke 12, inner ring r27.3 stroke 12.5, opening from +56° to
−56.5°, colours `#1DA57A` and `#5AFDB2` sampled from the source. The parameters
were fitted by rendering candidates and maximising pixel overlap against the
original, reaching an IoU of 0.948 — the remainder being antialiasing at the
coverage threshold.

`public/apple-touch-icon.png` is generated from `public/favicon.svg`:

```sh
node -e "require('sharp')('public/favicon.svg').resize(180,180).png().toFile('public/apple-touch-icon.png')"
```

The mark carries fixed brand colours rather than `currentColor`, so it does not
inherit text colour from its container.

## Checking links

The build has no link checker wired in. To verify internal links resolve against
the built output, walk `dist/` and compare `href`s to the generated pages.

## License

MIT, matching the specification.
