/**
 * Single source of truth for outbound links and the client/tooling ecosystem.
 * Every URL here was verified against the upstream project.
 */

export const SPEC_REPO = 'https://github.com/concord-protocol/concord';
export const SPEC_ORG = 'https://github.com/concord-protocol';

export const NAV = [
  { label: 'Docs', href: '/learn/what-is-concord/' },
  { label: 'Specification', href: '/spec/' },
  { label: 'Clients', href: '/clients/' },
  { label: 'Build', href: '/build/' },
  { label: 'Announcement', href: '/announcement/' },
];

export interface Client {
  name: string;
  tagline: string;
  /** One line, for the homepage card. `description` is for /clients/. */
  summary: string;
  description: string;
  href: string;
  source: string;
  author: string;
  platforms: string[];
  accent: string;
  links: { label: string; href: string }[];
}

export const CLIENTS: Client[] = [
  {
    name: 'Armada',
    tagline: 'The full Discord-shaped client',
    author: 'Soapbox',
    summary:
      'Channels, threads, roles, voice and video, custom emoji — plus a Discord bridge and server import.',
    description:
      'Communities, channels, threads, roles, voice and video, custom emoji and themes, plus a Discord bridge and server import. Armada speaks Concord alongside NIP-29 and Buzz communities, so one key carries you across the ecosystem.',
    href: 'https://armada.buzz',
    source: 'https://gitworkshop.dev/soapbox.pub/armada',
    platforms: ['Web', 'Android', 'Linux', 'Windows'],
    accent: 'from-emerald-400/20',
    links: [
      { label: 'Open Armada', href: 'https://armada.buzz' },
      { label: 'About', href: 'https://soapbox.pub/armada' },
      { label: 'Zapstore', href: 'https://zapstore.dev/apps/buzz.armada.app' },
      {
        label: 'Google Play',
        href: 'https://play.google.com/store/apps/details?id=buzz.armada.app',
      },
    ],
  },
  {
    name: 'Vector',
    tagline: 'Privacy-first messenger, natively encrypted',
    author: 'Vector Privacy',
    summary:
      'A standalone Rust desktop messenger: no KYC, encrypted storage, optional Tor. Co-authored Concord.',
    description:
      'A standalone Rust and Tauri messenger built on a Privacy by Principle philosophy: no KYC, no metadata collection, encrypted storage, optional Tor transport, and in-chat mini-apps. Vector co-authored Concord and ships the reference relay dictionary.',
    href: 'https://vectorapp.io',
    source: 'https://github.com/VectorPrivacy/Vector',
    platforms: ['Windows', 'macOS', 'Linux', 'Android'],
    accent: 'from-teal-400/20',
    links: [
      { label: 'Download Vector', href: 'https://vectorapp.io' },
      {
        label: 'Documentation',
        href: 'https://vector-privacy.gitbook.io/vector-privacy/vector-messenger',
      },
      { label: 'Source', href: 'https://github.com/VectorPrivacy/Vector' },
    ],
  },
  {
    name: 'Accordion',
    tagline: 'A lightweight web client',
    author: 'hzrd149',
    summary:
      'A compact browser client with no backend — proof of how little you need to speak the protocol.',
    description:
      'A Concord community app built on the applesauce Nostr toolkit — a compact, independent implementation that demonstrates how little you need to speak the protocol. Runs entirely in the browser with no backend.',
    href: 'https://accordion.chat',
    source: 'https://github.com/hzrd149/accordion.chat',
    platforms: ['Web'],
    accent: 'from-green-400/20',
    links: [
      { label: 'Open Accordion', href: 'https://accordion.chat' },
      { label: 'Source', href: 'https://github.com/hzrd149/accordion.chat' },
    ],
  },
];

export interface Tool {
  name: string;
  kind: string;
  author: string;
  description: string;
  href: string;
  language: string;
}

export const TOOLS: Tool[] = [
  {
    name: 'vector_sdk',
    kind: 'SDK',
    author: 'JSKitty',
    language: 'Rust',
    description:
      'Keys, relays, streams, and encryption handled, so you write handlers instead of cryptography.',
    href: 'https://crates.io/crates/vector_sdk',
  },
  {
    name: 'Shanty',
    kind: 'Bot',
    author: 'Derek Ross',
    language: 'Python',
    description:
      'A 24/7 generative lo-fi radio bot for live channels, with a Wavlake and Fountain jukebox.',
    href: 'https://github.com/derekross/shanty',
  },
  {
    name: 'concord-automod',
    kind: 'Bot',
    author: 'Derek Ross',
    language: 'Rust',
    description:
      'Auto-moderation with exactly the rank its Grant gives it — there are no server privileges to hand out.',
    href: 'https://github.com/derekross/concord-automod',
  },
  {
    name: 'Private Events',
    kind: 'App',
    author: 'Derek Ross',
    language: 'TypeScript',
    description:
      'Event details, sign-up boards, and encrypted group chat, packaged as an installable PWA.',
    href: 'https://github.com/derekross/concord-private-events',
  },
  {
    name: 'price-bot',
    kind: 'Bot',
    author: 'JSKitty',
    language: 'Rust',
    description:
      'Per-coin price, charts, and market stats — a compact worked example of the SDK’s command handling.',
    href: 'https://github.com/JSKitty/price-bot',
  },
];

/** The CORD documents, mirrored for the landing page index. */
export const CORDS = [
  {
    id: '01',
    title: 'Private Streams',
    summary:
      'A shared-key stream of giftwraps, readable by anyone holding the key, invisible to everyone else.',
  },
  {
    id: '02',
    title: 'Communities',
    summary:
      'Membership, authority, epochs, and the Control, Chat, and Guestbook planes.',
  },
  {
    id: '03',
    title: 'Channels',
    summary:
      'Public and Private rooms, each its own sealed plane with its own key.',
  },
  {
    id: '04',
    title: 'Roles',
    summary:
      'Ranked, owner-rooted permissions validated by every client and enforced by rejection.',
  },
  {
    id: '05',
    title: 'Invites',
    summary:
      'Revocable links whose keys live in an encrypted bundle, plus direct invites to an npub.',
  },
  {
    id: '06',
    title: 'Rekeys & Refoundings',
    summary:
      'Rotate a channel key to sever a removed member, or re-found the Community at a new epoch.',
  },
  {
    id: '07',
    title: 'Audio/Video',
    summary:
      'Calls in any channel through a blind broker and an SFU that only forwards ciphertext.',
  },
  {
    id: '08',
    title: 'Disappearing Messages',
    summary:
      'One staff-set timer per Community, expiring every channel’s messages via NIP-40.',
  },
];
