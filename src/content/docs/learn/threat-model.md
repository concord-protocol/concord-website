---
title: Threat model
description: What Concord protects against, what it doesn't, and the known weaknesses the specification accepts.
sidebar:
  order: 4
---

This page collects the guarantees and known weaknesses described across the
CORD documents.

## What Concord protects against

### A malicious or compromised relay

A relay can refuse service, drop events, or replay old ones. It can't read
anything, forge anything, or tell who is in a community.

Clients never go back to an older version of an entity, so a relay replaying an
old grant or a lifted ban has no effect. Publishing to several relays at once
covers a relay that refuses service.

Relays should reject giftwrap deletions by author, so that participants can't
delete each other's events. Clients should use at least one relay that does.

### A network observer

Sees encrypted data sent to addresses that change over time. See
[what a relay sees](/learn/what-a-relay-sees/) for what traffic analysis can
still reveal.

### A non-member

Can't find a community's addresses, because every address is derived one way
from a secret they don't have. Someone with only a `community_id` (which is
included in every invite) can derive one address: where the community's
dissolution notice would be posted. They can read and post there, but the only
thing that counts at that address is a notice signed by the owner, which they
can't forge.

### A member forging authority

Anyone with the staff write key can *publish* to the Control Plane, but that
doesn't make their actions valid. Every edition is checked against the signature
inside it and the signer's rank in the roster, which traces back to the owner. A
demoted staff member who kept the write key can only flood the plane, and loses
even that at the next rotation.

Key rotations are checked the same way. A removed member can still build a
correctly formed rotation with an old key, but every client checks the signer's
rank and drops it.

### A member replaying messages elsewhere

Every chat message includes its `channel_id` and `epoch` inside the signed
rumor, and receivers check both against the key that decrypted it. A member
can't re-post someone else's message into a different channel or a different
epoch.

## What Concord doesn't protect against

### A member who copies what they can read

No messaging system can prevent this. Disappearing messages and kicks rely on
clients cooperating, and anyone who already has the keys can ignore them.

### A stolen owner key

The `community_id` is derived from the owner's key, so ownership can't be
forged and can't be changed. Whoever steals the owner key has full control of
the community, just as stealing an nsec gives full control of a Nostr identity.
There is no way to transfer ownership. A voluntary, owner-signed transfer is
listed as possible future work.

### A lost owner key

It can't be replaced. The only clean way out is to dissolve the community,
which leaves it permanently read-only.

### Past keys being compromised

Concord doesn't ratchet keys. Anyone who gets a channel's key for an epoch can
read every message from that epoch. Rotating keys protects future messages, not
past ones. Disappearing messages help here, because relays that honour the
expiration tag will already have deleted the ciphertext.

### A voice server working with a member

Calls rely on the broker assigning each participant a one-time SFU identity,
which clients check against signed presence messages. If a member works with
the broker or SFU, they can misattribute who is speaking. They still can't
decrypt the media, because the SFU only sees ciphertext.

## Known weaknesses

The specification accepts these on purpose.

**Pins can be replayed in another community.** A `channel_id` is chosen by the
client, and chat messages don't include the `community_id`. So a member who
also controls another community can create a channel with the same id there and
copy the first channel's pins, with valid proofs. That member could always have
leaked the messages; what changes is that the copies can be verified by anyone.

**Guestbook ties can be gamed.** Guestbook entries with the same timestamp are
ordered by the lower rumor id, which an author can influence by generating many
candidates. Ties are only compared within one member's entries, so an author
can only affect the order of their own.

**Members can see who was in a rotation.** A member can confirm that another
member received a new key. Members can already see the member list, banlist,
and guestbook, so this reveals little. In return, a member's place in a rotation
can be found from public keys alone, so remote signers can find their key
without exposing a private key.

**A member can steer a call.** The broker named in voice presence messages
comes from other members and isn't verified. A malicious member can push a call
onto a broker and SFU they choose, which then sees IP addresses and timing. It
still can't decrypt the media.

**Calls have no enforceable mute.** No server checks permissions, so clients
can mute someone locally but can't stop a member from sending audio. To remove
someone from calls, kick or ban them and rotate the keys, as with chat.

**An inviter can give a wrong `control_pk`.** The joiner can't verify this one
field in an invite, because it is derived from a secret they don't have. A
wrong value means the joiner sees an empty or outdated Control Plane. It doesn't
let anyone forge authority, because every edition is still checked against the
roster. The next rotation delivers the correct key.

## What clients have to do

The specification puts real requirements on implementations. The most
important:

- **Limit attacker-controlled input.** Anyone can send an invite link, so a
  client must reject invites with an unreasonable number of channels and cut
  the relay list down before allocating anything. Otherwise one malicious link
  can exhaust memory or open a flood of connections.
- **Enforce the NIP-44 size cap at every layer.** Many libraries don't, and a
  client that publishes oversized events creates messages stricter clients
  can't decrypt.
- **Check which community a dissolution notice names.** A notice must name the
  community it ends, and clients must check it. Earlier versions of the
  specification used an all-zero placeholder there. Accepting that would let
  someone copy an owner's real notice from one community into another community
  the same owner runs, ending it permanently.
- **Don't publish a pin list you couldn't read.** A list you failed to load
  looks the same as an empty one, and publishing it would delete every pin.

See the [implementer checklist](/build/checklist/) for the full list.
