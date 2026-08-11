#!/usr/bin/env node
/**
 * Sync the CORD specification documents into the Starlight docs collection.
 *
 * The specs live in their own repository (concord-protocol/concord) and are the
 * normative source of truth. This script copies them in verbatim, adding only
 * the frontmatter Starlight needs and rewriting the inter-document links.
 *
 * Source resolution, in order:
 *   1. $CONCORD_SPEC_DIR
 *   2. ../concord relative to this repo
 *   3. raw.githubusercontent.com (so CI works without a second checkout)
 *
 * The generated files ARE committed, so a build never requires the network.
 */

import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const outDir = join(repoRoot, 'src', 'content', 'docs', 'spec');

const RAW_BASE =
  'https://raw.githubusercontent.com/concord-protocol/concord/main';
const SPEC_REPO = 'https://github.com/concord-protocol/concord';

/** source file -> { slug, order, blurb } */
const DOCUMENTS = {
  '01.md': {
    slug: 'cord-01',
    order: 1,
    blurb:
      'The base primitive: a shared-key stream of giftwraps, readable by anyone holding the key and invisible to everyone else.',
  },
  '02.md': {
    slug: 'cord-02',
    order: 2,
    blurb:
      'Membership, authority, and addressing: the self-certifying community_id, the community_root access key, the staff-held control_root, epochs, and the three planes.',
  },
  '03.md': {
    slug: 'cord-03',
    order: 3,
    blurb:
      'Public and Private rooms, each its own sealed plane with its own key derived from the Community.',
  },
  '04.md': {
    slug: 'cord-04',
    order: 4,
    blurb:
      'Granular, ranked, owner-rooted permissions validated by every client and enforced by rejection rather than by a server.',
  },
  '05.md': {
    slug: 'cord-05',
    order: 5,
    blurb:
      'Shareable links whose keys live in an encrypted bundle on relays, plus direct invites giftwrapped straight to an npub.',
  },
  '06.md': {
    slug: 'cord-06',
    order: 6,
    blurb:
      'Post-removal secrecy: rotate a Channel key to cut off a removed member, or re-found the whole Community at a new epoch.',
  },
  '07.md': {
    slug: 'cord-07',
    order: 7,
    blurb:
      'Voice, video, and screenshare in any Channel via a blind token broker and an SFU that only ever forwards ciphertext.',
  },
  '08.md': {
    slug: 'cord-08',
    order: 8,
    blurb:
      'One staff-set timer per Community: every Channel’s messages expire via NIP-40.',
  },
  'examples.md': {
    slug: 'examples',
    order: 9,
    title: 'Event examples',
    blurb:
      'Non-normative example JSON for every event kind in the registry (CORD-02, Appendix B).',
  },
};

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function resolveSource() {
  const candidates = [
    process.env.CONCORD_SPEC_DIR,
    resolve(repoRoot, '..', 'concord'),
  ].filter(Boolean);

  for (const dir of candidates) {
    if (await exists(join(dir, '02.md'))) {
      return { kind: 'local', dir };
    }
  }
  return { kind: 'remote' };
}

async function readSource(source, file) {
  if (source.kind === 'local') {
    return readFile(join(source.dir, file), 'utf8');
  }
  const res = await fetch(`${RAW_BASE}/${file}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${file}: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

/** Escape a string for a single-quoted YAML scalar. */
function yamlQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function transform(file, raw, meta) {
  const lines = raw.split('\n');

  // Pull the title out of the leading H1 and drop that line: Starlight renders
  // the title from frontmatter, so keeping it would duplicate the heading.
  let title = meta.title;
  const headingIndex = lines.findIndex((line) => line.startsWith('# '));
  if (headingIndex !== -1) {
    if (!title) title = lines[headingIndex].slice(2).trim();
    lines.splice(headingIndex, 1);
  }
  if (!title) title = meta.slug;

  let body = lines.join('\n').trimStart();

  // Rewrite links between spec documents to their site routes.
  body = body.replace(/\]\((\d{2})\.md(#[^)]*)?\)/g, (_m, num, hash) => {
    return `](/spec/cord-${num}/${hash ?? ''})`;
  });
  body = body.replace(/\]\(examples\.md(#[^)]*)?\)/g, (_m, hash) => {
    return `](/spec/examples/${hash ?? ''})`;
  });

  const frontmatter = [
    '---',
    `title: ${yamlQuote(title)}`,
    `description: ${yamlQuote(meta.blurb)}`,
    'sidebar:',
    `  order: ${meta.order}`,
    `editUrl: ${yamlQuote(`${SPEC_REPO}/edit/main/${file}`)}`,
    '---',
    '',
    ':::note[Normative source]',
    `This page is synced verbatim from [\`${file}\`](${SPEC_REPO}/blob/main/${file})`,
    'in the specification repository. The repository is the source of truth; if the',
    'two ever disagree, the repository wins.',
    ':::',
    '',
    '',
  ].join('\n');

  return `${frontmatter}${body}\n`;
}

async function main() {
  const source = await resolveSource();
  console.log(
    source.kind === 'local'
      ? `Syncing CORD specs from ${source.dir}`
      : `Syncing CORD specs from ${RAW_BASE}`
  );

  await mkdir(outDir, { recursive: true });

  for (const [file, meta] of Object.entries(DOCUMENTS)) {
    const raw = await readSource(source, file);
    const out = transform(file, raw, meta);
    await writeFile(join(outDir, `${meta.slug}.md`), out, 'utf8');
    console.log(`  ${file} -> spec/${meta.slug}.md`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
