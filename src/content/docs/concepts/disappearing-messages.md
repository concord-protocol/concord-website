---
title: Disappearing messages
description: One staff-set timer per community, expiring every channel's messages via NIP-40 — refused at ingest, hidden from display, purged locally, and deleted by relays.
sidebar:
  order: 7
---

A community can make its conversation ephemeral: one timer, set by staff, after
which every chat message expires. Normative text: [CORD-08](/spec/cord-08/).

Two properties anchor the design.

**The timer is community state, never a per-message choice.** It is a single
field in the community metadata entity, edited and folded like any versioned
edition, so every member converges on one policy and every channel applies it.

**Expiry is cooperative,** as in every disappearing-message scheme. An honest
client hides and deletes, an honest relay purges — but a member could always have
copied what they could read. The guarantee is hygiene against the future: a
seized device, a compromised key, an archived relay. It is not protection from
the people in the room with you.

## The timer

`message_expiration` is a number of seconds in the community metadata. Absent,
zero, or malformed means **off** — a reader must not guess a default from
garbage.

Editing it is editing the metadata: the same edition chain, the same
`MANAGE_METADATA` gate, the same round-tripping discipline. A client that
predates this feature carries the field through a rename untouched.

## What expires, and what never does

The timer governs **chat planes only** — every channel, public and private alike.
The other planes never expire, each for a structural reason:

- **Control** — the authoritative state must stay complete, and compaction
  re-wraps signed editions verbatim across epochs. An expiring edition would eat
  the chain out from under the fold.
- **Guestbook** — membership motion is the input to the member list. An expired
  leave would resurrect a departed member.
- **Rekey addresses** — a parked blob may be a slow member's only way back into
  the new epoch.

Two chat kinds are also exempt and must not carry the tag:

- **Deletes.** A delete is a tombstone, and its target may outlive it — sent
  under a longer timer, or none at all. An expiring delete would let the message
  it erased come back.
- **Timer notices.** The notice documents the policy; it must not be erased by
  the policy, or the room forgets why its history is missing.

## Tagging, and the leak it costs

While the timer is set, a sender attaches a NIP-40 expiration tag to every
durable chat rumor, computed from the rumor's own timestamp — and **the outer
wrap carries the same tag with the same value**.

The two copies do different jobs:

- The **rumor's copy** is inside what the author signs. It is authoritative,
  unforgeable, and what every reader enforces.
- The **wrap's copy** is for relays. NIP-40-honouring relays delete the
  ciphertext itself, so after expiry the message is not merely unreadable but
  *gone* from public infrastructure. A future compromise of the channel's keys
  recovers nothing.

This is one of only two places Concord puts an identifying tag on an outer wrap,
and it trades exactly what the no-outer-tags rule protects. An expiring wrap
still blends with giftwrap traffic — NIP-17 DM wraps carry the same tag — but the
tag does reveal the timer's value to relays and marks those wraps as chat rather
than control.

That leak is the price of real deletion. A community unwilling to pay it turns
the timer off.

## Enforcement

A reader:

- **must** refuse an already-expired rumor at ingest, and never store it;
- **must not** display an expired rumor, including one stored before its expiry
  passed;
- **should** physically purge expired rumors from local storage on a periodic
  sweep. Hiding is not disappearing, and the local store is exactly the artifact
  a seized device surrenders.

Clock skew is absorbed by NIP-40's semantics. The shortest timer a client should
offer — a day — dwarfs any honest skew.

## Changing the timer is not retroactive

The tag rides inside the signed rumor, so a message keeps the expiry it was sent
under, and no edition can reach back into history. This matches Signal's
behaviour.

The tag as signed always governs. A client that has not folded the newest
metadata sends the old timer or none, and readers honour what the rumor says
rather than what the fold now prescribes. The fold governs what a compliant
sender attaches *next*, never what an existing rumor means.

## The timer notice

A policy change deserves a line in the conversation, not just a diff in the fold.
After publishing the metadata edition, the actor should post one notice into each
channel whose key they hold, and clients render it as an inline row — "Alice set
disappearing messages to 30 days" — timestamped and attributed like any message.

The notice is informational but **gated like an authority claim**: a reader
displays it only if its author holds `MANAGE_METADATA` in the fold, and drops it
otherwise. Anyone can spell a tag; only staff can be believed about policy.

A missing notice changes nothing — a private channel whose key the actor does not
hold simply gets none, and its members still see the fold. The metadata fold is
always the authority.
