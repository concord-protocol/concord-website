/** Outbound links and the client, bot, and library listings. */
import type { ImageMetadata } from 'astro';

/*
 * Each client's own icon, taken from its repository, store listing, or web
 * manifest. Imported rather than placed in public/ so Astro resizes them.
 * Accordion's upstream icon has an opaque white background; this copy has the
 * corners cut to transparent.
 */
import accordionLogo from '../assets/clients/accordion.png';
import amethystLogo from '../assets/clients/amethyst.png';
import armadaLogo from '../assets/clients/armada.png';
import coinosLogo from '../assets/clients/coinos.png';
import grimoireLogo from '../assets/clients/grimoire.png';
import posterchanLogo from '../assets/clients/posterchan.png';
import vectorLogo from '../assets/clients/vector.png';
import { latestAsset } from './releases';

export const SPEC_REPO = 'https://github.com/concord-protocol/concord';

export const NAV = [
  { label: 'Docs', href: '/learn/what-is-concord/' },
  { label: 'Specification', href: '/spec/' },
  { label: 'Clients', href: '/clients/' },
  { label: 'Build', href: '/build/' },
];

export interface Client {
  name: string;
  tagline: string;
  /** The app's own icon. See the import block above. */
  logo: ImageMetadata;
  href: string;
  /** Absent where the client is closed source; the card then links no repository. */
  source?: string;
  author: string;
  /** The app's own neon, taken from its icon. Lights its row on the clients page. */
  glow: string;
  /**
   * The install and about links. The first is the one a card fills in; after
   * it, a link with an `icon` is drawn as that mark alone and one without as
   * text. Order them stores, then files, then pages.
   */
  links: ClientLink[];
}

/** See LinkIcon.astro. */
export type LinkIcon =
  | 'android'
  | 'apple'
  | 'fdroid'
  | 'google-play'
  | 'linux'
  | 'windows'
  | 'zapstore';

export interface ClientLink {
  label: string;
  href: string;
  icon?: LinkIcon;
}

export const CLIENTS: Client[] = [
  {
    name: 'Armada',
    tagline: 'The full Discord-shaped client',
    author: 'Soapbox',
    logo: armadaLogo,
    href: 'https://armada.buzz',
    source: 'https://gitworkshop.dev/soapbox.pub/armada',
    glow: '#ff3d8b',
    links: [
      { label: 'Open Armada', href: 'https://armada.buzz' },
      {
        label: 'Google Play',
        href: 'https://play.google.com/store/apps/details?id=buzz.armada.app',
        icon: 'google-play',
      },
      /* Soapbox's own F-Droid repository, as Armada's downloads page links it:
         the fingerprint lets the F-Droid client add the repo in one tap. */
      {
        label: 'F-Droid (Soapbox repo)',
        href: 'https://pkg.soapbox.pub/fdroid/main/repo?fingerprint=CEA02E48815EC61244B5ECB35680B745A7A9A41A9257382F1D8BDDC14E533A17',
        icon: 'fdroid',
      },
      {
        label: 'Zapstore',
        href: 'https://zapstore.dev/apps/buzz.armada.app',
        icon: 'zapstore',
      },
      /*
       * Armada builds its file list in the browser, so there is no fixed URL
       * per platform. Each mark goes to the downloads page, which picks the
       * build for the system it is opened on.
       */
      { label: 'Android', href: 'https://armada.buzz/downloads', icon: 'android' },
      { label: 'Windows', href: 'https://armada.buzz/downloads', icon: 'windows' },
      { label: 'macOS', href: 'https://armada.buzz/downloads', icon: 'apple' },
      { label: 'Linux', href: 'https://armada.buzz/downloads', icon: 'linux' },
      { label: 'Downloads', href: 'https://armada.buzz/downloads' },
      { label: 'About', href: 'https://soapbox.pub/armada' },
    ],
  },
  {
    name: 'Vector',
    tagline: 'Privacy-first messenger, natively encrypted',
    author: 'Vector Privacy',
    logo: vectorLogo,
    href: 'https://vectorapp.io',
    source: 'https://github.com/VectorPrivacy/Vector',
    glow: '#59fcb3',
    links: [
      { label: 'Download Vector', href: 'https://vectorapp.io' },
      {
        label: 'Zapstore',
        href: 'https://zapstore.dev/apps/io.vectorapp',
        icon: 'zapstore',
      },
      /*
       * The APK is the one asset upstream names without a version, so
       * `latest/download` points at it directly. The desktop builds carry the
       * version, and are looked up at build time; see releases.ts.
       */
      {
        label: 'Android APK',
        href: 'https://github.com/VectorPrivacy/Vector/releases/latest/download/Vector.apk',
        icon: 'android',
      },
      {
        label: 'Windows',
        href: await latestAsset('VectorPrivacy/Vector', /_x64-setup\.exe$/),
        icon: 'windows',
      },
      {
        label: 'macOS (Apple silicon)',
        href: await latestAsset('VectorPrivacy/Vector', /_aarch64\.dmg$/),
        icon: 'apple',
      },
      {
        label: 'Linux (AppImage)',
        href: await latestAsset('VectorPrivacy/Vector', /_amd64\.AppImage$/),
        icon: 'linux',
      },
      {
        label: 'Downloads',
        href: 'https://github.com/VectorPrivacy/Vector/releases/latest',
      },
      {
        label: 'Docs',
        href: 'https://vector-privacy.gitbook.io/vector-privacy/vector-messenger',
      },
    ],
  },
  {
    name: 'Amethyst',
    tagline: 'Communities inside a whole Nostr client',
    author: 'Vitor Pamplona',
    logo: amethystLogo,
    href: 'https://amethyst.social',
    source: 'https://github.com/vitorpamplona/amethyst',
    glow: '#4f7cff',
    links: [
      { label: 'Get Amethyst', href: 'https://amethyst.social' },
      {
        label: 'Google Play',
        href: 'https://play.google.com/store/apps/details?id=com.vitorpamplona.amethyst',
        icon: 'google-play',
      },
      {
        label: 'F-Droid',
        href: 'https://f-droid.org/packages/com.vitorpamplona.amethyst/',
        icon: 'fdroid',
      },
      {
        label: 'Zapstore',
        href: 'https://zapstore.dev/apps/com.vitorpamplona.amethyst',
        icon: 'zapstore',
      },
      /* Every desktop asset carries the version; see releases.ts. */
      {
        label: 'Windows',
        href: await latestAsset('vitorpamplona/amethyst', /^amethyst-desktop-.*-windows-x64\.msi$/),
        icon: 'windows',
      },
      {
        label: 'macOS (Apple silicon)',
        href: await latestAsset('vitorpamplona/amethyst', /^amethyst-desktop-.*-macos-arm64\.dmg$/),
        icon: 'apple',
      },
      {
        label: 'Linux (AppImage)',
        href: await latestAsset('vitorpamplona/amethyst', /^amethyst-desktop-.*-x86_64\.AppImage$/),
        icon: 'linux',
      },
      {
        label: 'Downloads',
        href: 'https://github.com/vitorpamplona/amethyst/releases/latest',
      },
    ],
  },
  {
    name: 'PosterChan',
    tagline: 'A self-hosted personal cloud on Nostr',
    author: 'verita84',
    logo: posterchanLogo,
    href: 'https://poster.place',
    source: 'https://github.com/loblawbob873-svg/posterchanai',
    glow: '#ff8a1f',
    links: [
      { label: 'Open PosterChan', href: 'https://poster.place' },
      {
        label: 'Zapstore',
        href: 'https://zapstore.dev/apps/place.poster.app',
        icon: 'zapstore',
      },
      { label: 'Android APK', href: 'https://poster.place/apk', icon: 'android' },
      { label: 'Windows', href: 'https://poster.place/desktop/win', icon: 'windows' },
      { label: 'macOS', href: 'https://poster.place/desktop/mac', icon: 'apple' },
      { label: 'Linux', href: 'https://poster.place/desktop/linux', icon: 'linux' },
    ],
  },
  {
    name: 'Grimoire',
    tagline: 'A tiling workspace for Nostr',
    author: 'purrgrammer',
    logo: grimoireLogo,
    href: 'https://grimoire.rocks',
    source: 'https://github.com/purrgrammer/grimoire',
    glow: '#e879f9',
    links: [{ label: 'Open Grimoire', href: 'https://grimoire.rocks' }],
  },
  {
    name: 'Accordion',
    tagline: 'A lightweight web client',
    author: 'hzrd149',
    logo: accordionLogo,
    href: 'https://accordion.chat',
    source: 'https://github.com/hzrd149/accordion.chat',
    glow: '#a855f7',
    links: [{ label: 'Open Accordion', href: 'https://accordion.chat' }],
  },
  {
    name: 'Coinos',
    tagline: 'Communities inside a Bitcoin wallet',
    author: 'Adam Soltys',
    logo: coinosLogo,
    href: 'https://v3.coinos.io',
    source: 'https://github.com/coinos/coinosv3',
    glow: '#f7b21a',
    links: [
      { label: 'Open Coinos', href: 'https://v3.coinos.io' },
      {
        label: 'Zapstore',
        href: 'https://zapstore.dev/apps/io.coinos.app',
        icon: 'zapstore',
      },
    ],
  },
];

export interface Tool {
  name: string;
  /** See LibrariesAndBots.astro for how each kind is grouped. */
  kind: 'SDK' | 'Library' | 'Bot' | 'Bridge' | 'App';
  author: string;
  description: string;
  href: string;
  language: string;
  /** For a bridge, the network on its far side. Its mark is the bridge's icon. */
  network?: 'discord' | 'matrix';
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
  /*
   * Its README installs from JSR, but nothing is published there or on npm
   * yet, so the link is the repository rather than a registry page.
   */
  {
    name: 'applesauce-concord',
    kind: 'Library',
    author: 'hzrd149',
    language: 'TypeScript',
    description:
      'CORD-01 to 06 for the applesauce toolkit: protocol helpers, RxJS models, and a reactive client.',
    href: 'https://gitworkshop.dev/npub1ye5ptcxfyyxl5vjvdjar2ua3f0hynkjzpx552mu5snj3qmx5pzjscpknpr/git.shakespeare.diy/applesauce-concord',
  },
  {
    name: 'concord-bots',
    kind: 'Library',
    author: 'CentauriAgent',
    language: 'Rust',
    description:
      'A bot template on vector_sdk: write the handlers, and it runs the connection, routing, and scheduling.',
    href: 'https://github.com/CentauriAgent/concord-bots',
  },
  {
    name: 'Sentire',
    kind: 'Bot',
    author: 'Vector Privacy',
    language: 'Rust',
    description:
      'A full-time moderator: screens text as it lands, judges media with a vision model you pick, and contains raids.',
    href: 'https://github.com/VectorPrivacy/Sentire',
  },
  {
    name: 'Shanty',
    kind: 'Bot',
    author: 'Derek Ross',
    language: 'Python',
    description:
      'A 24/7 generative lo-fi radio bot that plays in a channel\'s call, with a Wavlake and Fountain jukebox.',
    href: 'https://github.com/derekross/shanty',
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
      'Per-coin price, charts, and market stats. A compact worked example of the SDK’s command handling.',
    href: 'https://github.com/JSKitty/price-bot',
  },
  {
    name: 'Vector LLM',
    kind: 'Bot',
    author: 'Vector Privacy',
    language: 'Rust',
    description:
      'An LLM chatbot with per-channel memory that answers in channels only when mentioned, on any OpenAI-compatible API.',
    href: 'https://github.com/VectorPrivacy/Vector-LLM',
  },
  /*
   * The rest are announced on ngit (NIP-34) rather than hosted on GitHub, so
   * they link to gitworkshop.dev, the browsable view of a Nostr repository.
   */
  {
    name: 'manabot',
    kind: 'Bot',
    author: 'chad',
    language: 'Rust',
    description:
      'Magic: The Gathering lookups from Scryfall. Write [[card name]] anywhere, or use /card, /price, /ruling.',
    href: 'https://gitworkshop.dev/npub1scvyzz02ayma34hesz62pdrd5nhsmxp74hjq8msmfs9khh3r3drsnw68d8/relay.ngit.dev/manabot',
  },
  {
    name: 'Gatebot',
    kind: 'Bot',
    author: 'Henky',
    language: 'Rust',
    description:
      'A gatekeeper: newcomers pass a captcha on a web page before they stay, and spammers are kicked.',
    href: 'https://gitworkshop.dev/npub1600yr4qg5vcfp7svf6ysj0008tn7aphnu0gjs6lw5hjn74n0laasjx889v/relay.ngit.dev/Gatebot',
  },
  {
    name: 'concord-qa-bot',
    kind: 'Bot',
    author: 'hanshan',
    language: 'Python',
    description:
      'Answers !ask and @mentions with web-grounded replies, as an ordinary member with no staff role.',
    href: 'https://gitworkshop.dev/npub1ulnt22mynj7juw3j5nnr75euewq6ejesa0yhsnwvwmn48nq2j95q2k0z88/git.hanshan.io/concord-qa-bot',
  },
  /* Its announcement says "design plans", but the repository is a working
     bridge with a setup portal. */
  {
    name: 'armada-discord-bridge',
    kind: 'Bridge',
    author: 'Soapbox',
    language: 'TypeScript',
    description:
      'Mirrors a Discord channel and a Concord channel both ways. Anything bridged is plaintext to Discord.',
    href: 'https://gitworkshop.dev/npub10qdp2fc9ta6vraczxrcs8prqnv69fru2k6s2dj48gqjcylulmtjsg9arpj/relay.ngit.dev/armada-discord-bridge',
    network: 'discord',
  },
  {
    name: 'armada-matrix-bridge',
    kind: 'Bridge',
    author: 'Soapbox',
    language: 'TypeScript',
    description:
      'Mirrors a Matrix room and a Concord channel both ways, each member posting as themselves on each side.',
    href: 'https://gitworkshop.dev/npub10qdp2fc9ta6vraczxrcs8prqnv69fru2k6s2dj48gqjcylulmtjsg9arpj/git.shakespeare.diy/armada-matrix-bridge',
    network: 'matrix',
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
