---
title: Build on Concord
description: How to build clients, bots, and services on Concord, and the parts of an implementation that are easiest to get wrong.
sidebar:
  order: 0
  label: Overview
---

Concord is an open specification. There is no platform to request API access
from and no key to be issued. If your code speaks the protocol, it can take
part.

## What you can build

### A bot

The quickest place to start. A bot has its own key, joins through an invite,
and reads and writes in the channels it has keys for. Grant it a role and it can
moderate with that role's rank. There is no separate bot API with extra
privileges.

Start with [bots](/build/bots/).

### A client

A full client is a lot of work: key management, relay pooling, the fold, epoch
handling, and the rekey path. Most of the [existing clients](/clients/) are open
source, and reading one is the quickest way to see how the pieces fit. See
[reading a client](/build/sdks/#reading-a-client) for where to start.

Work through the [implementer checklist](/build/checklist/) before you ship.

### A service

Concord defines one server-side component: the voice **broker**, which mints
SFU tokens. It has no community secrets, keeps almost no state, and can't tell
which community a room belongs to. It is two endpoints. See
[CORD-07 §2](/spec/cord-07/).

Relays are ordinary Nostr relays. The one thing that matters is that they
reject giftwrap deletions by author, so participants can't delete each other's
events.

## What you need to get right

Most implementation bugs come from three places.

**The derivations.** Every address in the protocol comes from a fixed HKDF
construction. Get one label byte wrong and you end up at a different address,
with no error, unable to talk to any other client. The full table is in
[CORD-02 Appendix A](/spec/cord-02/).

**The fold.** Control Plane state is a set of versioned, chained editions, and
every client must reduce them to the same head. Take the highest version whose
chain is intact, refuse to downgrade, and break ties by authority and then by
the lower rumor id. Don't break ties by timestamp, because the author controls
it.

**Encoding.** Two clients must build byte-identical events: lowercase hex,
x-only pubkeys, decimal-string tag values, unmodified timestamps, and the NIP-44
size cap checked at every layer of nesting. Many libraries don't enforce the cap
themselves.

## Interoperability

A community created in one client opens in the others. Vector and Armada ship
the same invite relay dictionary, so an invite made in either opens in the
other. Armada also supports NIP-29 and Buzz communities alongside Concord.

Three rules keep clients compatible:

- **Round-trip fields you don't understand.** Editing a community's name must
  not wipe another client's settings. This applies to community metadata,
  channel metadata, the Community List, and the Invite List.
- **Prefix your custom keys.** Client-specific keys in a `custom` object should
  have a prefix (`vector/…`, `soapbox/…`); generally useful ones stay plain.
  Top-level fields outside `custom` are reserved for the protocol.
- **Keep an invite's naddr and fragment exactly as they are.** Any base domain
  works; only those two parts are protocol.

## Getting help

Design questions are settled in the specification repository. Issues and pull
requests are welcome there.

[github.com/concord-protocol/concord](https://github.com/concord-protocol/concord)
