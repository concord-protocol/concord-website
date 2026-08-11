---
title: Threat model
description: What Concord defends against, what it explicitly does not, and the residual risks the specification names rather than hides.
sidebar:
  order: 4
---

A protocol is only as useful as its honesty about limits. This page collects the
guarantees and the named residuals from across the CORD documents.

## Adversaries Concord defends against

### A malicious or compromised relay

A relay can refuse service, drop events, or replay old ones. It cannot read
anything, forge anything, or determine who is in a community.

Replay is handled by the fold: clients refuse to downgrade an entity to a lower
version, so a relay replaying a stale grant or a lifted ban gets nowhere. Refusal
of service is handled by publishing to several relays at once.

One relay behaviour matters: relays should reject giftwrap deletions by author,
so participants cannot delete each other's events. Clients should use at least
one relay that does.

### A network observer

Sees ciphertext addressed to rotating labels. See
[what a relay sees](/learn/what-a-relay-sees/) for the traffic-analysis
residuals.

### A non-member

Cannot find a community's addresses at all — every coordinate derives one-way
from a secret they do not hold. A non-member holding only a `community_id` (which
ships in every invite) can derive exactly one public coordinate: the dissolution
tombstone address. They can read that plane and even publish to it, but the only
thing that counts there is an owner-signed tombstone, which they cannot forge.

### A member forging authority

Anyone holding the staff write key can *publish* to the Control Plane. Nobody can
*forge* a verdict. Every edition is judged by the actor's signature inside it and
their rank in the owner-rooted roster. A demoted staffer who kept the write key
retains only the ability to flood, and that turns over at the next rotation.

Likewise, a rotation from an unauthorised rotator is dropped, and holding an old
key is never authority: a removed member can construct a perfectly shaped
rotation, and every honest client opens the seal, folds the roster, and discards
it.

### A member replaying messages across contexts

Every chat message commits its `channel_id` and `epoch` inside the
author-signed rumor, and receivers check both against the key that opened the
wrap. No member can re-wrap another's message into a different channel or replay
it across an epoch.

## What Concord does not defend against

### A member who copies what they can read

There is no defence, here or anywhere. Disappearing messages, pins, and kicks are
all cooperative with respect to people who already hold the keys.

### A stolen owner key

The `community_id` commits to the owner's key, which makes ownership unforgeable
and also makes it terminal. A stolen owner key is stolen supremacy, exactly as
nsec theft is terminal for any Nostr identity. There is no succession mechanism;
a voluntary owner-signed succession is noted as possible future work.

### A lost owner key

Cannot be replaced. The clean exit is dissolution — an owner-signed tombstone
that seals the community read-only, permanently.

### Compromise of past keys

Concord is not ratcheted. If an adversary obtains a channel key for a given
epoch, every message in that epoch is readable to them. Rotation protects the
*future*, not the past. Disappearing messages are the mitigation for the past,
since a relay that honoured the expiration tag no longer holds the ciphertext.

### An SFU or broker colluding with a member

Media attribution rests on SFU identities being broker-assigned and single-use,
checked against signed presence. That is sound unless a member colludes with the
broker or SFU. Media confidentiality survives regardless: the SFU only ever sees
ciphertext.

## Named residuals

These are documented weaknesses that the specification accepts deliberately
rather than fixes.

**Pin replay across communities.** A `channel_id` is client-minted and a chat
rumor deliberately carries no `community_id`. So a keyholding member of a channel
who controls another community can mint a same-id channel there and replay the
first channel's pins with the proof intact. Such an attacker could always have
leaked the content; what is new is that they can do it with a universally
verifiable artifact.

**Guestbook tiebreak grinding.** Entries tying on time break by the lower rumor
id, which an author can grind. The coalesce is per-member, so an author only ever
grinds ties against their own entries.

**Rotation membership visibility.** A member can confirm a fellow member's
presence in a key rotation. This is information members effectively hold anyway —
the member list, banlist, and guestbook are all member-visible — and the trade
buys real ergonomics: a locator computes from public keys alone, so a remote
signer can find its blob without ever touching a raw private key.

**Broker steering.** The broker hint on voice presence is untrusted input from a
fellow member. A malicious member can steer a call to a broker and SFU of their
choosing, which then sees IPs and timing. End-to-end encryption means it can
never decode the media.

**Voice moderation.** No server checks permissions, so a call carries no
enforceable mute. Clients can locally silence anyone, but a member determined to
publish cannot be stopped mid-call by any signed edict. The enforceable lever is
the one chat already has: kick, ban, and rotate.

**An inviter's bad `control_pk`.** One field in an invite bundle cannot be
verified by the joiner, because it derives from a secret they will never hold. A
wrong one is eclipse-class self-harm by the inviter — the joiner reads a stale or
empty Control Plane — and never forged authority, because every edition still
verifies against the owner-rooted roster. The next base rotation re-delivers the
true key.

## Hardening requirements on clients

The specification places real obligations on implementations. A few that matter
most:

- **Bound attacker-controlled input.** An invite bundle is reached by following a
  link, so a client must reject an unreasonable channel count and truncate the
  relay list before allocating. Absent bounds, a hostile link is an
  unbounded-allocation and connect-storm vector.
- **Enforce the NIP-44 size cap at every layer.** Libraries are lenient, and a
  lenient publisher mints events a strict reader cannot decrypt.
- **Verify the dissolution tombstone's binding.** A tombstone must name the
  community it kills, and a verifier must check it. Accepting the all-zero
  placeholder from earlier revisions is the vulnerability: an owner's genuine
  tombstone could otherwise be lifted and re-wrapped to kill a different
  community they run, unrecoverably.
- **Never publish a pin list you could not read.** An empty view and an empty
  list are indistinguishable, and publishing from the former silently destroys
  every entry.

See the [implementer checklist](/build/checklist/) for the full set.
