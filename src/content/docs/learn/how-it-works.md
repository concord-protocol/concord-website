---
title: How it works
description: The keys, planes, and epochs behind a Concord community, explained in plain language before you read the normative specification.
sidebar:
  order: 2
---

This page covers the whole design at a conceptual level. [The
specification](/spec/) states each part precisely, and the links below point to
the relevant sections.

## Private Streams

Nostr has a mechanism called a *giftwrap* (NIP-59) for wrapping an event so
that only its recipient can open it. Concord changes one detail of it.

A **Private Stream** is a message stream where every participant shares one
private key. That key signs the outer wrap, so the stream has a fixed address
that only keyholders can work out. Anyone with the key subscribes with a single
filter:

```json
{ "kinds": [1059], "authors": ["<stream pubkey>"] }
```

Inside the wrap is a *seal* signed by the real author, so members can see who
said what. From outside, every event looks like ordinary giftwrap traffic sent
to a throwaway key.

[CORD-01](/spec/cord-01/) defines the event shape and the encoding rules that
let two clients build byte-identical events.

## Three values per community

A Concord community runs on three values ([CORD-02](/spec/cord-02/)):

| Value | What it is | Who has it |
| --- | --- | --- |
| `community_id` | The permanent identity: a hash of the owner's key and a random salt | Every member (it isn't secret) |
| `community_root` | The access key. Having the current one makes you a member | Every member |
| `control_root` | The staff key for writing the community's settings, roles, and bans | The owner and staff |

The `community_id` never appears on the wire, because every address is derived
from it one way. It is included in invites, so any member can recompute it and
confirm who founded the community. Putting a different owner on an existing id
would require a second-preimage attack on SHA-256.

Because identity and access are separate values, a community can change its
keys without changing its identity. Removing members depends on this.

## Keys become addresses

Every part of a community lives at an address derived from one of its secrets:

```
group_key(label, secret, id, epoch):
    seed = hkdf(secret, label, id, epoch)
    sk   = scalar_normalize(seed)
    pk   = xonly_pubkey(sk)          // the stream address
```

The derivation is one-way and the labels are fixed, so only someone with the
secret can compute the address. An outsider can't find the community, let alone
read it. Each new epoch gives new addresses, so a relay can't link a
community's traffic from before a rotation to after it.

## Three planes

A community's data is split by purpose into three planes, each with its own
write rules.

### The Control Plane

The community's settings and rules: metadata, roles, grants, the banlist, and
channel definitions. Every member keeps a complete copy.

Only staff can write to it. Its address and signing key come from the
staff-only `control_root`, while its contents are encrypted under a key every
member can derive. So every member can subscribe, read, and verify, but only
staff can publish. Every member has to sync this plane in full, so if anyone
could write to it, anyone could flood it.

The staff key only controls who can *publish*. A valid wrap shows that some
staff member posted it, nothing more. Whether an action takes effect depends on
the signature inside it and the signer's rank.

### Chat Planes

One per channel, each with its own key. Messages, reactions, edits, deletes,
threads, typing indicators, and voice presence all go here. Clients load a
channel newest-first and page back through every epoch key they have, so
history continues across rotations.

### The Guestbook Plane

Joins, leaves, and kicks. Every member can write to it, because a join is
something each member announces for themselves. Nothing in the other planes
depends on it, so it loads last and can lag behind without causing problems.

A client reduces it to one current state per member, adds everyone it has seen
posting, removes anyone on the banlist, and that is the member list.

## Public and private channels

A **public channel** derives its key from the `community_root`. It costs
nothing to create, adds nothing to an invite, and gets a new key automatically
whenever the community's key changes.

A **private channel** has its own random key, given out when someone is granted
access and replaced when someone is removed. If a private channel's key leaks,
only that channel is exposed.

Both kinds are defined in the Control Plane, so renaming a channel or switching
it between public and private is an edit to that definition, not a new channel.
See [CORD-03](/spec/cord-03/).

## Editions and the roster

Every change to the community's settings and roles is an **edition** on the
Control Plane: a numbered, chained version of one entity, signed inside the
encryption by the person who made the change.

Clients take the highest version of each entity whose chain is intact and never
go back to an older one, so a relay replaying an old grant or a lifted ban has
no effect. Ties are broken the same way on every client, so they all end up
with the same state.

Permissions are bits combined across a member's roles, and `position` sets
rank. One rule covers every action: the actor needs the right permission *and*
must strictly outrank the target. Equals can't act on each other, so an admin
can't ban another admin, and no edition can create a role at or above its
signer's own position, so nobody can promote themselves.

[CORD-04](/spec/cord-04/) has the full model, including the audit log that comes
with it.

## Epochs and removal

An **epoch** is a counter attached to each key. It goes up only when someone is
removed.

Removing a member involves three separate steps ([CORD-06](/spec/cord-06/)):

1. **Removing their roles** takes away their authority. They are still a
   member.
2. **Kicking them** asks their client to leave. A well-behaved client does; a
   modified one still has every key.
3. **A rekey or refounding** replaces the keys and gives the new ones only to
   the remaining members. This is the only step that actually cuts them off.

Each step is checked on its own, so if a removal only partly propagates, the
result is a weaker removal, not a broken one.

A refounding also **compacts** the Control Plane: the latest edition of each
entity is copied into the new epoch with its original signature. This is why
Control Plane seals carry the rumor unencrypted inside the wrap: a signature
over ciphertext wouldn't survive re-encryption. Compaction keeps refoundings
fast even after thousands of changes.

## Summary

A community is a shared key (having it makes you a member), a signed roster
every member can check, and a few relays that only ever carry encrypted data.
Authority comes from signatures, so a forged ban is ignored because it doesn't
trace back to the owner. Removing someone for good means changing the keys.
