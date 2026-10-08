---
title: Bots
description: A Concord bot is a member with a key, not an integration with an API token. What that means for permissions, access, and removal.
sidebar:
  order: 2
---

On a centralised platform, a bot registers with the platform, receives a token,
and gets whatever capabilities the platform chooses to expose.

Concord has no platform to register with. A bot has its own key, joins through
an invite like anyone else, and reads and writes in the channels it has keys
for.

## What that changes

**A bot's permissions are a role.** Grant it a role and it can act with that
role's rank. Every client checks its actions against the same roster as
everyone else's, so it can't exceed that rank, and its actions are signed and
show up in the audit log.

**A bot is trusted like a member.** It has real keys. A bot in a private channel
can read that channel, and a compromised bot leaks whatever a compromised member
would. Use private channels to limit what it can see.

**Removing a bot means rotating keys.** Stripping its role takes away its
authority, but it can keep reading until a rekey or refounding cuts it off, the
same as for a person. See [removal and rotation](/concepts/removal/).

**There is no API to lose.** Nobody can deprecate, rate-limit, or revoke your
bot's access. Nobody maintains compatibility for you either; the frozen
derivations in the specification are what stays stable.

## Getting started

[concord-bots](https://github.com/CentauriAgent/concord-bots) is a Rust bot
template on [`vector_sdk`](/build/sdks/). You write the command handlers, and it
runs the connection, routing, and scheduling.
[price-bot](https://github.com/JSKitty/price-bot) is a small working example of
the SDK's command handling.

Every published bot and bridge is listed on the [clients page](/clients/).

## Practical notes

**Key storage.** A bot's key is both its identity and its membership. If you
lose it, the bot has to be invited again. If it leaks, the community has to
rotate.

**Remote signing.** Rekey blob locators derive from public keys only, and rekey
blobs and the staff key handoff are encrypted under a pairwise conversation key
either side can compute. A bot using a remote signer (a bunker) can find and
open its material with one decrypt, without exposing its private key.

**Rotations.** Precompute the next rekey address and subscribe to it. Otherwise
the bot will stop receiving messages the first time someone is banned, with no
error. A missing chunk does not mean the bot was removed; only a complete set
of chunks without its locator does.

**Rate limits.** Anyone with a channel's key can post to it, so the protocol
can't stop a bot from flooding. Moderators can, by banning it.
