---
title: How it works
description: The keys, planes, and epochs behind a Concord community, explained in plain language before you read the normative specification.
sidebar:
  order: 2
---

This page walks the whole architecture at a conceptual level. Every claim here
is made precisely in [the specification](/spec/); the links point at the
normative text.

## Private Streams: the base primitive

Nostr has a mechanism called a *giftwrap* (NIP-59) for wrapping an event so only
its recipient can open it. Concord reverses one detail and gets something new.

A **Private Stream** is a message stream whose participants all share one private
key. That key signs the outer wrap, so the stream has a fixed, derived address
that only keyholders can compute. Anyone holding the key subscribes with a
single filter:

```json
{ "kinds": [1059], "authors": ["<stream pubkey>"] }
```

Inside the wrap sits a *seal* signed by the real author, so within the stream you
still know exactly who said what — while outside it, every event looks like
ordinary giftwrap traffic addressed to a throwaway key.

Read [CORD-01](/spec/cord-01/) for the exact event shape and the encoding rules
that let two clients build byte-identical events.

## A community is three secrets

A Concord community runs on three values, kept deliberately apart
([CORD-02](/spec/cord-02/)):

| Secret | What it is | Who holds it |
| --- | --- | --- |
| `community_id` | Permanent identity: a hash commitment to the owner's key plus a random salt | Everyone (it is not secret) |
| `community_root` | The access key. Holding the current one *is* membership | Every member |
| `control_root` | The staff write key for the authoritative state | Owner and staff only |

The `community_id` never appears on the wire — every address derives from it
one-way — but it travels inside invites, so any member can recompute it and
confirm who founded the community. Forging a different owner onto an existing id
would require a second-preimage attack on SHA-256.

Separating identity from access is what lets a community rotate its keys without
losing its identity, which is the whole basis of removal.

## Keys become addresses

Every part of a community lives at an address derived from one of its secrets:

```
group_key(label, secret, id, epoch):
    seed = hkdf(secret, label, id, epoch)
    sk   = scalar_normalize(seed)
    pk   = xonly_pubkey(sk)          // the stream address
```

Because the derivation is one-way and the label set is frozen, only a holder of
the secret can compute the address. An outsider cannot identify the room, let
alone read it. Rotating the epoch rotates the address, which keeps a community's
traffic unlinkable across rotations.

## Three planes

State is separated by what it is for, and each plane has different write rules.

### The Control Plane

The authoritative state: community metadata, roles, grants, the banlist, and
channel definitions. Every member keeps it complete and in sync.

It is *write-restricted*. Its address and signing key derive from the staff-held
`control_root`, while its contents are encrypted under a key every member
derives. So every member can subscribe, verify, and read — and only staff can
publish. That asymmetry exists because a plane everyone must sync in full is a
plane anyone could flood.

Crucially, holding the write key is a **spam gate, never authority**. A valid
wrap proves only that *some* staff member published it. The verdict still comes
from the actor's signature inside and their rank in the roster.

### Chat Planes

One per channel, each independently keyed. Messages, reactions, edits, deletes,
threads, typing indicators, and voice presence all ride here. Clients load a
channel newest-first and page backwards across every epoch key they hold, so
history spanning a rotation stays continuous.

### The Guestbook Plane

Membership motion — joins, leaves, and kicks — necessarily member-writable,
because a join is each member's own word. It is deliberately *off-consensus*:
nothing in Control or Chat depends on it, so it loads last and can lag without
harm.

A client folds it into a flat per-member state, merges that with everyone it has
actually observed publishing, subtracts the banlist, and gets the member list.

## Channels, public and private

A **public channel** derives its key from the `community_root`. It costs nothing
to create, adds nothing to an invite, and rotates for free whenever the base
rotates.

A **private channel** carries an independent random key, delivered on grant and
rotated on removal. A leaked private channel key exposes exactly that one
channel.

Both are *defined* in the Control Plane, so renaming a channel or flipping its
visibility is an authorised, convergent edit rather than a new channel. See
[CORD-03](/spec/cord-03/).

## Authority: editions and the roster

Every authority action is an **edition** on the Control Plane: a versioned,
chained document for one entity, signed inside the encryption by the actor's real
identity.

Clients fold editions per entity, take the highest version whose chain is intact,
and refuse to downgrade — so a relay replaying a stale grant or a lifted ban gets
nowhere. Ties resolve deterministically, so every client lands on the same head.

Permissions are a bitfield unioned across a member's roles, and `position` orders
rank. One rule binds every action: the actor must hold the required permission
**and** strictly outrank the target. Equal cannot act on equal — an admin cannot
ban a peer admin — and no edition may claim a position at or above its own
signer, so nobody promotes themselves toward the top.

Read [CORD-04](/spec/cord-04/) for the full model, including the audit log that
falls out of it for free.

## Epochs and removal

An **epoch** is a counter attached to each key. It bumps only when somebody is
removed.

Removing a member is three mechanisms with three different guarantees, composed
in order ([CORD-06](/spec/cord-06/)):

1. **Role removal** strips their authority. They are still a member.
2. **A cooperative kick** asks their client to leave. An honest client complies;
   a defiant one still holds every key.
3. **A rekey or refounding** rotates the keys and hands the new one only to who
   is left. This is the only step that *enforces*.

Because each layer validates independently, a partially propagated removal
degrades to a weaker removal — never to a broken one.

A refounding also **compacts** the Control Plane: the current head of each entity
is re-wrapped into the new epoch with its original signature intact. That is why
Control Plane seals are plaintext-inside-the-wrap — a signature over ciphertext
could not survive re-encryption. It keeps refoundings fast even after thousands
of control events.

## Putting it together

A community is a shared key (holding it *is* membership), a signed roster anyone
can verify, and a handful of relays that only ever carry sealed blobs.

Authority is a signature, not a switch. A forged ban is simply dropped because it
does not trace to the owner. And removing someone for real means changing the
locks.
