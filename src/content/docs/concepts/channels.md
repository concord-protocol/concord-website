---
title: Channels
description: Public and private channels, how their keys differ, how conversion works, and how messages bind to the channel and epoch that carry them.
sidebar:
  order: 2
---

A Channel is one message plane inside a community: *defined* in the Control
Plane, but carrying its own chat on an independent Chat Plane. A community is
simply a set of channels unified under a common Control Plane. Normative text:
[CORD-03](/spec/cord-03/).

Channels come in two kinds, differing only in *who may read them*.

## Public channels

A public channel's key is **derived** from the `community_root`. Nothing is ever
delivered, it adds nothing to an invite, every member can compute it, and it
rotates for free whenever the base does.

A public channel is not a separate mechanism — it is just "a channel whose key
derives from the community root".

## Private channels

A private channel's key is an **independent random secret**, delivered on grant
and rotated on removal. That independence is the point: a leaked private channel
key exposes only that one channel, and it can be rotated without touching
anything else.

Private channels also carry their own epoch, separate from the community's.

## One derivation, two secrets

```
Public   channel_pk = group_key("concord/channel", community_root, channel_id, root_epoch).pk
Private  channel_pk = group_key("concord/channel", channel_key,    channel_id, channel_epoch).pk
```

Because the `channel_id` feeds the derivation, every channel gets a distinct
address regardless of which secret produces it.

## Creating, renaming, deleting

A channel is *defined* by a metadata entity in the Control Plane holding its id,
name, and private flag. Edits fold as versioned editions like any control state,
so a rename or visibility change is an authorised, convergent edit rather than a
new channel. All of this is gated by `MANAGE_CHANNELS`.

Deletion is an edition setting `"deleted": true`, and it is terminal: the id is
never reused. Its history stays decryptable to anyone who already held the keys —
deletion cannot unshare the past.

Every channel is callable. There is no separate voice channel type and no
per-channel voice flag; a call is simply started in a channel. See
[voice and video](/concepts/voice/).

## Converting between public and private

**Public to private** is a key rotation: the channel mints its own independent
key at the next channel epoch, delivers it to the intended role-holders, and
flips its metadata flag — all as a single authorised action.

The channel epoch is monotonic and never resets. The first privatisation is epoch
1 and each later one climbs, which makes `privatise → publish → privatise` safe:
each private generation lives at a distinct address, so a stale key can never
share a coordinate with the current one.

Privatising protects the **future only**. Pre-conversion history was written
under keys every member holds, so it stays readable to all members. There is no
way to retroactively hide what was already shared.

**Private to public** reverses it: the channel begins deriving from the
`community_root` going forward, and a member joining after the switch reads only
the now-public history — never the prior private messages, whose keys they never
held.

## Messages

A channel's Chat Plane carries the ordinary append events, each wrapped as a
stream event and sealed to the author's real identity within. Clients load
newest-first and paginate backwards, querying every epoch pubkey they hold, so
history spanning a rotation stays continuous.

Every message **must** commit `["channel", channel_id]` and `["epoch", n]` inside
the author-signed rumor, and a receiver **must** check both against the channel
and epoch whose key decrypted the wrap, dropping any mismatch. This is what stops
a member from re-wrapping someone else's message into a different channel or
replaying it across an epoch.

## Quotes and threads

Concord distinguishes two ways one message references another:

- An **inline quote** stays an ordinary message carrying a `q` tag that cites the
  quoted rumor. It renders inline in the timeline.
- A **threaded reply** is a separate kind (NIP-22 comment shape) with uppercase
  tags pinning the thread root and lowercase tags pinning the immediate parent. A
  reply inherits its parent's root tags verbatim, so the root stays stable at any
  depth, and it renders in a thread rather than as a top-level row.

Reactions, edits, and deletes target either kind by rumor id.
