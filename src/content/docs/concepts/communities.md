---
title: Communities
description: How a Concord community is founded, identified, and structured — the three secrets, the three planes, metadata, and dissolution.
sidebar:
  order: 1
---

A Community is a collection of channels sharing one membership and authority
model. Normative text: [CORD-02](/spec/cord-02/).

## Founding

Creating a community mints three things:

- a random 32-byte **owner salt**, which combines with the owner's pubkey to form
  the `community_id`;
- the **`community_root`**, the access key every member will hold;
- the **`control_root`**, the write key only the owner and staff will hold.

**Genesis** is exactly two owner-signed editions: the community's metadata and
one public channel named `#general`. No default roles, no scaffolding — the
creator shapes everything else.

## Identity is a commitment to the owner

```
community_id = sha256("concord/community" || owner_pubkey || owner_salt)
```

Because the id commits to the owner's key, ownership is unforgeable: putting a
different owner on an existing id would require a second-preimage attack on
SHA-256. The salt is not secret and rides inside invites, so any member can
recompute the id and confirm the founder.

The price of this design is that there is **no succession**. A lost owner key
cannot be replaced; a stolen one is stolen supremacy. A voluntary owner-signed
succession is noted as possible future work.

## Access is separate from identity

The `community_root` is deliberately *not* derived from the `community_id`. That
separation is the whole point: access can rotate while identity stays fixed, so a
community can cut off a removed member without becoming a different community.

Holding the current `community_root` *is* membership. There is no list to check.

## Why staff hold a second key

The Control Plane carries state every member must keep complete. If any member
could publish there, any member could flood it — valid-looking wraps by the mile,
each of which the whole community must fetch and decrypt, burying moderator
actions behind spam.

So the plane's write capability is split off into the `control_root`. Every
member holds the derived *pubkey*, which is all reading takes; only staff hold
the secret.

This is a spam gate and never a verdict. A verifying wrap proves only that *a*
`control_root` holder published it — never who, and never with what right. A
demoted staffer who kept the secret retains the power to flood and nothing else,
until the next rotation takes it away.

## The three planes

| Plane | Count | Who writes | Carries |
| --- | --- | --- | --- |
| Control | one per community | staff only | metadata, roles, grants, banlist, channel definitions, pins |
| Chat | one per channel | any keyholder | messages and everything about them |
| Guestbook | one per community | any member | joins, leaves, kicks, snapshots |

The Guestbook is *off-consensus*: nothing in Control or Chat depends on it, so it
loads last and can lag without harm. Clients fold it flat — one final state per
member, latest wins — merge it with everyone they have observed publishing, and
subtract the banlist to get the member list.

Observation only counts *forward*: a member re-enters the list on activity newer
than their latest leave, kick, or ban, so old history can never resurrect a
departed member.

## Metadata

One Control Plane entity holds the community's name (max 64 bytes), optional
description (max 10,000 bytes), relay list, optional icon and banner, the
disappearing-messages timer, and a client-extensible `custom` object.

Images never touch a media server in plaintext. Each is encrypted under a fresh
random key and uploaded as an ordinary blob; the entity carries only a pointer
and a hash, so the server learns nothing and a swapped blob fails closed.

Up to **5 relays** is the recommendation, not a rule. Past that, extra relays
cost more than they buy: every publish fans out N times and every fetch waits on
the slowest.

:::caution[Round-trip what you do not understand]
An editor **must** preserve fields it does not recognise. Editing the name must
never wipe another client's settings. This discipline applies to community
metadata, channel metadata, the Community List, and the Invite List.
:::

## Ordering

Nostr's `created_at` has second granularity, which is not enough to order two
messages in the same second. Concord adds an `["ms", 0..999]` tag to rumors, and
every comparison in the protocol — message order, guestbook recency, community
list tiebreaks — uses `created_at * 1000 + ms`.

## Multi-device membership

A member's memberships sync as the **Community List**: one self-encrypted,
replaceable event holding every community they are in and every one they have
left.

It keeps two snapshots per community. **seed** holds the earliest epoch you ever
held, anchoring full-history backfill; **current** holds the latest, so a fresh
device reconstructs everything instantly with no epoch-by-epoch walk.

Leaving writes a permanent tombstone, so a long-offline device can never
resurrect a community you left — while a genuine re-join still wins, because the
newest of the two timestamps decides.

## Dissolution

A community ends by an owner-signed tombstone published at a coordinate derived
from the `community_id` alone — no key and no epoch involved, so every member
past or present resolves the same address, and a refounding can never strand the
grave.

Death wins every race. A refounding cannot cross a tombstone, and the seal is
one-way. One carve-out survives it: a member's deletion of their own past message
is always honoured, because a self-scrub cannot inject content and a departing
member deserves to erase themselves.

:::danger[The tombstone must name its community]
Everything about the dissolution coordinate is public — anyone holding the
`community_id` can derive the keypair and publish there. The single thing an
attacker cannot manufacture is an owner-signed tombstone rumor.

But a tombstone that named no community could be lifted from one community and
re-wrapped at another run by the same owner, killing it permanently and
unrecoverably. Verifiers **must** check that the tombstone's `eid` is this
community's id, and **must** refuse the all-zero placeholder that earlier
revisions specified.
:::
