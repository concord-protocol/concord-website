---
title: Glossary
description: The vocabulary used across the CORD documents, from community_root and epochs to editions, folds, planes, and refoundings.
sidebar:
  order: 6
---

## Banlist

A single community-wide entity listing banned pubkeys, valid only if its signer
has `BAN`. Clients drop **every** event from a banned member, so they disappear
from the community immediately. Cutting off their *access* is a separate step (a
refounding).

## Broker

A small service that issues SFU tokens for voice and video calls. It has no
community secrets and can't tell which community a room belongs to. See
[voice and video](/concepts/voice/).

## Chat Plane

One per channel. Carries that channel's messages, reactions, edits, deletes,
threads, and ephemeral signals like typing and voice presence.

## Community List

A member's own encrypted document, replaceable and one per user, holding every
community they are in and every one they have left. It syncs memberships across
a member's devices *and* across clients. Capped at 50 memberships, because it
must fit inside a single NIP-44 envelope.

## `community_id`

A community's permanent identity: `sha256("concord/community" || owner_pubkey ||
owner_salt)`. Self-certifying — anyone can recompute it and confirm the founder.
It never appears on the wire but travels inside invites.

## `community_root`

The community's private access key. Holding the current one *is* membership. It
gates every public channel and the reading of the Control Plane, and it rotates
on removal.

## Compaction

The step during a refounding that re-wraps each entity's current head into the
new epoch, trimming prior history. Because Control Plane seals are plaintext
inside the wrap, the original authors' signatures survive re-encryption. This is
what keeps refoundings fast after thousands of control events.

## Control Plane

One per community. Carries the authoritative state — metadata, roles, grants,
the banlist, channel definitions, pins — as folded, versioned editions. Every
member syncs it in full; only staff can write to it.

## `control_root`

The staff write key. Its derived keypair signs Control Plane wraps. Having it
only lets you publish there: a valid wrap shows that some staff member posted
it, not who, and not whether they were allowed to.

## Direct Invite

An invite bundle giftwrapped straight to a known pubkey using standard NIP-59,
with no link, no coordinate, and nothing to fetch. It cannot be revoked, appears
in no registry, and never flips a community public — which makes it a private
community's way to grow.

## Dissolution

The end of a community: an owner-signed tombstone at an address derived from
the `community_id` alone. It can't be undone. Clients that see it make the
community read-only.

## Edition

One versioned, chained document for one Control Plane entity. Carries the entity
it edits, a version that only climbs, the hash of the edition it supersedes, and
the new state — signed inside the encryption by the actor's real identity.

## Epoch

A counter attached to each key, bumped only when somebody is removed. Rotating
the epoch rotates every derived address, keeping traffic unlinkable across
rotations.

## Fold

The client-side process of reducing a stream of editions to current state: take
the highest version per entity whose chain is intact, refuse to downgrade, and
resolve conflicts deterministically so every client lands on the same head.

## Grant

The Control Plane entity mapping a member to their roles. Honoured only if its
signer outranks every role it hands out. A grant that first makes someone staff
also delivers the `control_root` to them, encrypted pairwise.

## Guestbook Plane

One per community, member-writable, carrying only membership motion: self-signed
joins and leaves, plus authorised kicks and refounder-signed snapshots.
Off-consensus — nothing else depends on it, so it can lag without harm.

## Invite List

A member's own encrypted record of the invite links they have created, including
each link's signing key. Only they can read it.

## Link signer

A keypair created for one invite link and used for nothing else. The invite
bundle is published under it, so only the link's creator can update or revoke
the link.

## Locator

The derived value a recipient computes to find their own key blob inside a
rotation event. Derives from public inputs only, so a remote signer can find its
blob without touching a raw private key.

## `ms`

A tag carrying milliseconds (`0` to `999`) on top of `created_at`, which only has
second precision. Every ordering in the protocol uses
`created_at * 1000 + ms`.

## Plane

A Private Stream serving one purpose inside a community. Concord defines three
kinds: Control, Chat, and Guestbook.

## Position

The field that orders authority, where **lower is higher**. The owner is position
0. A member's rank is the lowest position among their roles. An actor must
*strictly* outrank their target — equal cannot act on equal.

## Private Stream

The base primitive (CORD-01): a multi-party message stream built by sharing one
private key, which signs the outer wrap and gives the stream a derived address
only keyholders can compute.

## Refounding

A whole-community rekey: roll the `community_root`, mint a fresh `control_root`,
rekey the relevant private channels, compact the Control Plane, and seed the new
guestbook with a membership snapshot. This is what makes a ban *enforce*.

## Registry

A Control Plane entity listing the addresses of each member's live invite links,
never the links themselves. If any live link exists, the community is public.

## Rekey

A single channel's key rotation, cutting off whoever no longer holds a role that
grants it. Requires `MANAGE_CHANNELS`.

## Rekey blob

A per-recipient encrypted package delivering a fresh key, up to 120 per event.
Fixed-width by form, so the width itself declares what the blob carries. Scope
and epoch live *inside* the ciphertext, which makes a blob unspliceable.

## Roster

The owner-rooted authority chain: every grant and role signed by someone the
roster ranks strictly above it, terminating at the owner. An entry that does not
trace to the owner is not authority, however validly it is signed.

## Rumor

The innermost, unsigned-on-the-wire event carrying the actual content — the
message, the edition, the join. It is signed by the real author within the seal.

## Seal

The middle layer of a stream event, signed by the actor's real key. Kind `20013`
when its content is encrypted, kind `20014` when it carries the rumor's
serialized JSON verbatim. Only the Control Plane uses the plaintext form, because
compaction must preserve signatures across re-encryption.

## SFU

Selective forwarding unit: the media server that relays a call's audio and
video between participants. In Concord it only ever sees encrypted media.

## Staff

Every member holding a permission whose actions land as Control Plane editions —
`MANAGE_ROLES`, `MANAGE_CHANNELS`, `MANAGE_METADATA`, `BAN`, `CREATE_INVITE`, or
`PIN_MESSAGES` — plus always the owner. Staff are exactly the set that holds the
`control_root`.

## `vac`

The authority citation on an edition: the exact grant the actor claims their
rank under, identified by coordinate, version, and content hash. A verifier
waits until it has that grant, then checks the actor against its current roster,
not against the cited grant.

## `vsk`

The sub-kind tag naming which entity type a Control Plane edition edits.

## Wrap

The outer kind `1059` event. Looks like an ordinary giftwrap, signed by the
stream's derived key, addressed to a throwaway `p` tag.
