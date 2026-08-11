---
title: What a relay sees
description: Exactly what a relay, a network observer, and a non-member can learn about a Concord community — and the handful of things that deliberately do leak.
sidebar:
  order: 3
---

"End-to-end encrypted" is a claim worth spelling out. This page enumerates what
each party actually observes.

## What a relay stores

A relay carrying a Concord community holds a pile of kind `1059` events that look
exactly like ordinary giftwrap traffic:

```json
{
  "kind": 1059,
  "pubkey": "<a stream address it cannot attribute>",
  "content": "<NIP-44 ciphertext>",
  "tags": [["p", "<a fresh throwaway key, used once>"]],
  "created_at": 1686840217,
  "sig": "<valid, but signed by a derived key>"
}
```

Note what is *absent*: no community name, no channel name, no member list, no
sender, no recipient, no kind of the inner message.

The `p` tag is a random ephemeral key rather than a real recipient, so a relay
cannot cluster events by who they are for. This is a deliberate inversion of
NIP-59, which uses ephemeral *authors* and fixed `p` tags; Concord uses a fixed
author and ephemeral `p` tags.

## What a relay does *not* learn

- **Message content.** Two layers of NIP-44 encryption on chat planes: the wrap,
  and then the seal inside it. The inner rumor is never a standalone artifact, so
  no relay — honest or malicious — can retain it and display it as a public
  event.
- **Who is a member.** There is no membership list on the wire in any readable
  form. Joins and leaves are themselves sealed inside the guestbook plane.
- **Who is in charge.** Roles, grants, and bans are Control Plane editions,
  encrypted like everything else.
- **Which community it is carrying.** Every address derives one-way from a secret
  the relay does not hold. A relay serving ten communities cannot partition its
  own storage by community.
- **Whether two channels belong together.** Each channel has an independent
  address derived with its own `channel_id`.

## What does leak

Concord is precise about this, and so is this page.

### Traffic patterns

A relay sees that *some* address received *n* events of *m* bytes at particular
times. Message volume, rough message sizes, and activity rhythms are visible.
Concord does not pad to a fixed size or cover traffic.

### Address stability within an epoch

An address is stable until the epoch bumps, and epochs bump only on removals. So
a relay can link one channel's traffic across weeks or months under a single
meaningless label. It never learns what that label means, but it can count.

Rotating deliberately, or spreading across relays, is the mitigation.

### Your IP and connection timing

Relays and brokers see the network layer. Concord says nothing about transport;
if that matters to you, use a client that supports an anonymising transport —
Vector ships Tor support, for example.

### Two deliberate outer tags

The specification's default is that a stream wrap carries **no** identifying
outer tags, because a tagged `1059` would no longer blend with giftwrap traffic.
There are exactly two exceptions, and both are named as trade-offs:

- **Direct invites** carry `["k", "3313"]`, so a recipient can index their
  invites instead of decrypting their entire giftwrap inbox. An observer learns
  that *someone* invited this npub to *some* community at roughly some time —
  never which community, who sent it, or whether it was accepted. A direct invite
  is person-addressed NIP-59, not camouflaged stream traffic, so this never
  weakens the stream's cover.
- **Disappearing messages** carry an `["expiration", …]` tag on the wrap so that
  NIP-40-honouring relays actually delete the ciphertext. This reveals the
  timer's value and marks those wraps as chat rather than control. That leak is
  the price of real deletion; a community unwilling to pay it turns the timer
  off.

### Media servers

Icons and banners are encrypted under a fresh random key per image before upload,
and the community's metadata carries only a pointer plus a hash. The media server
learns nothing, and a swapped blob fails the hash check. But it does see that a
blob of some size was uploaded.

### The voice broker

The token broker learns a room name — a meaningless derived pubkey — and nothing
else. It cannot tell which community a room belongs to and never learns who is
joining. It does see IPs and connection timing, and because a room name is stable
for a whole epoch, one broker serving a long-lived channel can link that
channel's calls, participant counts, and durations over months under a single
label.

The SFU only ever forwards ciphertext: media is encrypted end-to-end under
per-sender keys that only members can derive.

## What a member sees

Members are not strangers, and the specification does not pretend otherwise. Any
member can:

- read every public channel and every private channel they hold a key for;
- see the member list, the banlist, and the guestbook;
- confirm which members were included in a given key rotation;
- copy anything they can read, including messages under a disappearing timer.

That last point is the honest limit of every disappearing-message scheme. The
guarantee is hygiene against the future — a seized device, a compromised key, an
archived relay — not protection from the people in the room with you.
