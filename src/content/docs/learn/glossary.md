---
title: Glossary
description: The vocabulary used across the CORD documents, from community_root and epochs to editions, folds, planes, and refoundings.
sidebar:
  order: 6
---

## Banlist

A single Community-wide entity listing banned pubkeys, honoured only if its
signer holds `BAN`. Honest clients drop **every** event from a banned member, so
they vanish entirely. Silencing is instant and free; cutting off *access* is a
separate, heavier step (a refounding).

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

The staff write key. Its derived keypair signs Control Plane wraps. Possession is
a **spam gate, never authority**: a valid wrap proves only that some staff member
published, never who or with what right.

## Direct Invite

An invite bundle giftwrapped straight to a known pubkey using standard NIP-59,
with no link, no coordinate, and nothing to fetch. It cannot be revoked, appears
in no registry, and never flips a community public — which makes it a private
community's way to grow.

## Dissolution

The end of a community: an owner-signed tombstone at a coordinate derived from
the `community_id` alone. Terminal and one-way. On sight, clients seal the
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

## Locator

The derived value a recipient computes to find their own key blob inside a
rotation event. Derives from public inputs only, so a remote signer can find its
blob without touching a raw private key.

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

## Staff

Every member holding a permission whose actions land as Control Plane editions —
`MANAGE_ROLES`, `MANAGE_CHANNELS`, `MANAGE_METADATA`, `BAN`, `CREATE_INVITE`, or
`PIN_MESSAGES` — plus always the owner. Staff are exactly the set that holds the
`control_root`.

## `vac`

The authority citation on an edition: the exact grant the actor claims their rank
under, pinned by coordinate, version, and content hash. It is a *sync floor*, not
the verdict — a verifier waits until it holds that grant, then judges the actor
against its current roster.

## `vsk`

The sub-kind tag naming which entity type a Control Plane edition edits.

## Wrap

The outer kind `1059` event. Looks like an ordinary giftwrap, signed by the
stream's derived key, addressed to a throwaway `p` tag.
