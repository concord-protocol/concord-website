---
title: Build on Concord
description: How to build clients, bots, and services on Concord — what exists today, what you need to implement, and where the hard parts are.
sidebar:
  order: 0
  label: Overview
---

Concord is an open specification with no gatekeeper. There is no platform to get
API access from, no application to file, and no key to be issued. If your code
speaks the protocol, it is a participant.

## What you can build

### A bot

The shortest path. A bot holds a key like any member, joins via an invite, and
reads and writes on the channels it has keys for. If you grant it a role, it
moderates with exactly the rank that role gives it — there is no separate "bot
API" with privileged access, because no such privilege exists to hand out.

Start with [bots](/build/bots/).

### A client

A full client is a real undertaking: key management, relay pooling, the fold,
epoch handling, and the rekey path. Three independent implementations exist
already — [Armada](/clients/), Vector, and Accordion — and reading one is the
fastest way to understand the shape.

Work through the [implementer checklist](/build/checklist/) before you ship.

### A service

Concord defines one server-side role, and it is deliberately tiny: the voice
**broker** that mints SFU tokens. It holds no community secrets, keeps almost no
state, and cannot tell which community a room belongs to. Two endpoints implement
it. See [CORD-07 §2](/spec/cord-07/).

Relays are ordinary Nostr relays. The one behaviour that matters is rejecting
giftwrap deletions by author, so participants cannot delete each other's events.

## What you need to get right

Three things carry most of the risk in an implementation.

**The derivations.** Every address in the protocol comes from a frozen HKDF
construction. Get a label byte wrong and you land at a different address —
silently, with no error, and interoperating with nobody. The full table is in
[CORD-02 Appendix A](/spec/cord-02/).

**The fold.** Control Plane state is a set of versioned, chained editions, and
every client must reduce them to the same head. Take the highest version whose
chain is intact, refuse to downgrade, and break ties by authority first and then
the lower rumor id — never a timestamp, which the author controls.

**Encoding.** Two clients must build byte-identical events. Lowercase hex, x-only
pubkeys, decimal-string tag values, untweaked timestamps, and the NIP-44 size cap
enforced at *every* layer of the nesting rather than trusted to a lenient
library.

## Interoperability in practice

A community created in one client opens in another. That is not aspirational —
Vector and Soapbox ship the invite relay dictionary identically, so an invite
minted by either opens in the other, and Armada speaks Concord alongside NIP-29
and Buzz communities.

The rules that make this work are worth stating plainly:

- **Round-trip fields you do not understand.** Editing a community's name must
  never wipe another client's settings. This applies to community metadata,
  channel metadata, the Community List, and the Invite List.
- **Prefix your custom keys.** Client-specific keys in a `custom` object should
  carry a prefix (`vector/…`, `soapbox/…`); generically useful ones stay plain.
  Top-level fields outside `custom` are reserved for the protocol.
- **Respect an invite's naddr and fragment verbatim.** The base domain is
  interchangeable; only those two parts are protocol.

## Getting help

The specification repository is where design questions get settled. Issues and
pull requests are welcome, and the CORD documents are the artifact under
discussion.

[github.com/concord-protocol/concord](https://github.com/concord-protocol/concord)
