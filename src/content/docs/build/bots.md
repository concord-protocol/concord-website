---
title: Bots
description: Bots on Concord are members holding keys, not integrations holding API tokens — what that changes, and the bots that already exist.
sidebar:
  order: 2
---

On a centralised platform, a bot is an integration: it registers with the
platform, receives a token, and is granted capabilities the platform decides to
expose.

On Concord there is no platform to register with. A bot holds a key, joins
through an invite like anyone else, and reads and writes on the channels it has
keys for.

## What that changes

**A bot's permissions are just a role.** Grant it a role and it moderates with
exactly the rank that role gives it — no more, and no special case. Because
authority is checked by every client against the same roster, a bot cannot
exceed its rank even if it tries, and its actions carry its signature in the same
audit chain as everyone else's.

**A bot is as trusted as a member, and no less.** It holds real keys. A bot in a
private channel can read that channel, and a compromised bot leaks exactly what a
compromised member would. Scope its access with private channels, and remove it
the way you would remove a member: strip its roles, then rotate.

**Nobody can cut off your bot.** There is no API to be deprecated, rate-limited,
or revoked. The flip side is that nobody maintains compatibility for you either —
the frozen derivations are the compatibility guarantee.

**Removal applies to bots too.** A rekey rotates the keys out from under a bot
exactly as it would a person. If you remove a bot's role but never rotate, it
keeps reading.

## Bots that exist today

### Shanty

A 24/7 generative lo-fi radio bot for Concord live channels, with a Wavlake and
Fountain jukebox. It is a good demonstration that a Concord channel is a place a
service can *live in*, not merely a log to post into.

Python, AGPL-3.0, by Derek Ross.
[github.com/derekross/shanty](https://github.com/derekross/shanty)

### concord-automod

A standalone auto-moderation bot for Concord communities — the clearest worked
example of a bot acting under a granted role rather than a platform privilege.

Rust, MIT, by Derek Ross. The repository is archived, so treat it as a reference
implementation to read rather than a maintained dependency.
[github.com/derekross/concord-automod](https://github.com/derekross/concord-automod)

### price-bot

Per-coin price, charts, and market stats, built on the `vector_sdk` crate. A
compact example of the SDK's command handling.

Rust, MIT, by JSKitty.
[github.com/JSKitty/price-bot](https://github.com/JSKitty/price-bot)

## Beyond bots

Not everything that joins a community is a chat bot. **Private Events** is a full
application built over Concord — event details, sign-up boards, and encrypted
group chat, packaged as an installable PWA — using the protocol as private,
serverless application infrastructure rather than as a messenger.

TypeScript, AGPL-3.0, by Derek Ross.
[github.com/derekross/concord-private-events](https://github.com/derekross/concord-private-events)

## Practical notes

**Key storage.** A bot's key is its identity and its membership. Losing it means
re-inviting; leaking it means rotating the community.

**Remote signing.** Concord is deliberately friendly to remote signers. Rekey
blob locators derive from *public* keys alone, and both rekey blobs and the staff
key handoff are encrypted under a pairwise conversation key computable from
either side. A bunker account can find and open its material with a single
decrypt, never touching a raw private key.

**Rotations.** Precompute the next rekey address and subscribe to it, or your bot
will silently stop working the first time somebody is banned. And remember: a
missing chunk is never a removal — only a complete set that omits your locator
is.

**Rate limits.** Chat planes are member-writable, so flooding is possible and is
handled by moderation rather than by the protocol. Be a good citizen; a bot that
floods is a bot that gets banned, and the ban works.
