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

The mark is a broken outer ring — a long green "C" and a short white segment
facing it — around a mint inner ring, defined as inline SVG in
[`src/components/Logo.astro`](src/components/Logo.astro) and again in
[`public/favicon.svg`](public/favicon.svg).

> [!NOTE]
> **The white segment is part of the mark.** In the source artwork, kept at
> `src/assets/concord-logo-source.png` for provenance, it is white on white and
> so invisible; it was missed on the first trace and read as a filled opening.
> It is not — it sits in the same ring band as the "C", with a real gap at each
> end. Anything that puts the mark on a light background loses it.

The SVG is a measured trace of that raster rather than a redraw: centre 63.5,
outer ring r49 stroke 12 with the "C" running from +56° to −56.5° and the white
segment from +43.5° to −43.5°, inner ring r27.3 stroke 12.5, colours `#1DA57A`,
`#5AFDB2` and `#FFFFFF` sampled from the source. The parameters were fitted by
rendering candidates and maximising pixel overlap against the original, reaching
an IoU of 0.936 over the whole mark — the remainder being antialiasing at the
coverage threshold. The two outer arcs measure to the same ring (mean radius
49.5, width 12.3) and are drawn with identical `r` and `stroke-width`, which is
worth more than fitting each one separately.

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

[CC BY-SA 4.0](LICENSE). Reuse it, including commercially, as long as you give
attribution and share derivative work under the same terms.
