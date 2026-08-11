---
title: Roles and moderation
description: Ranked, owner-rooted permissions validated by every client — how editions fold, how position orders authority, and why enforcement is rejection rather than prevention.
sidebar:
  order: 3
---

Concord has granular, hierarchy-based roles with customisable permissions,
validated by clients and built on dumb relays. Normative text:
[CORD-04](/spec/cord-04/).

There are two kinds of permission, enforced two different ways:

- **Read access** — who may *see* a channel. Enforced by key possession. You
  either hold the key or you cannot decrypt it.
- **Write authority** — who may *manage* the community. Enforced by a member's
  rank in an owner-rooted roster, checked independently by every member.

## Authority is rejection, not prevention

There is no server to stop anyone from publishing. Any staff member can put an
action on the Control Plane; everyone else drops the ones that do not map to a
qualifying rank.

This sounds weaker than server enforcement and is in one specific way: a
misbehaving member can generate noise. It is stronger in every other way, because
there is no privileged party who can be compelled, bribed, or breached into
granting authority that the owner never signed.

## Editions

Every authority action is an **edition**: a versioned, chained document for one
entity, signed inside the encryption by the actor's real identity. An edition
carries:

- **entity** — which logical thing it edits, by its stable coordinate;
- **version** — a per-entity counter, starting at 1, that only ever climbs;
- **prev** — the hash of the edition it supersedes, forming a chain;
- **content** — the entity's new state.

Clients **fold** every edition they hold into current state per entity, taking
the highest version whose chain is intact, and **refuse to downgrade**. A relay
replaying a stale grant or a lifted ban gets nowhere.

Two members editing the same entity at the same version converge
deterministically: authority first, then the lower rumor id — never the
author-settable timestamp. Every client walks the same chain and lands on the
same head.

The chain this creates *is* the audit log. Every action names its actor by real
signature, unforgeable and readable by any member.

## Entity coordinates are derived

Every entity's coordinate is deterministic, and derived from the `community_id`
rather than from any key or epoch. That is deliberate: coordinates survive every
refounding, which is what lets a compaction re-wrap current heads verbatim, and a
fresh joiner holding only the newest root derives the same coordinates.

## Roles and grants

A **Role** is a named bundle of permissions at a **position**. It mints no key,
so granting it hands a member *rank*, never a secret.

A **Grant** maps a member to their roles, honoured only if its signer outranks
every role it hands out.

Limits: a role name caps at 64 bytes, a member holds at most 64 roles, and a
community carries at most 100 roles.

## Permissions

Effective permissions are the **union** of a member's roles' bits. The bit
positions are frozen — a new permission claims the next free bit, a retired one
is burned, never renumbered or reused:

| Permission | What it gates |
| --- | --- |
| `MANAGE_ROLES` | creating roles, issuing grants |
| `MANAGE_CHANNELS` | creating, renaming, deleting channels; single-channel rekeys |
| `MANAGE_METADATA` | community name, description, icon, relays, timer |
| `KICK` | cooperative removal |
| `BAN` | the banlist, and refoundings |
| `MANAGE_MESSAGES` | moderating chat content |
| `CREATE_INVITE` | minting invite links |
| `VIEW_AUDIT_LOG` | reading the action history |
| `MENTION_EVERYONE` | mass mentions |
| `PIN_MESSAGES` | curating a channel's pin list |

There is deliberately **no all-powerful bit**. An "admin" holds the union of the
management bits, so a role granted everything today does *not* silently inherit a
permission added tomorrow.

## Position

`position` orders authority, and **lower is higher**. The owner is position 0 and
is supreme and unremovable. A member's rank is the lowest position among their
roles; a member with no roles is effectively last.

One hard rule binds every action: the actor must hold the required bit **and**
*strictly* outrank the target. Equal cannot act on equal — an admin cannot ban a
peer admin. And no edition may claim a position at or above its own signer, so
nobody can promote themselves toward the top. That binds the owner too: no role
may ever claim position 0.

## Citing your authority

Because the roster propagates eventually, an authority action **cites the exact
grant it acts under**, pinned by coordinate, version, and content hash.

A verifier will not honour the action until it has synced that grant — but then
it resolves the actor's rank against its **current** roster, not the cited
moment. So a just-demoted member's stale action is dropped the instant the
verifier holds the superseding demotion. Citing an old-but-once-valid grant
grandfathers nothing.

Reads never block, only enforcement does. A member always paints the newest state
it can fetch and converges as truth arrives.

## The banlist

The banlist is the one *anti*-roster: a signed list of pubkeys, honoured only if
its signer holds `BAN`. Every honest client drops **every** event from a banned
member — message, reaction, edit, or authority action — so they vanish entirely.

It silences instantly and for free. The cryptographic read-cut is the separate,
heavier step. Practical ceiling is around 500 entries, because the whole list
must fit in one NIP-44 envelope.

Because it is a single replaced document, two admins banning different people at
the same version collide. Clients resolve this three ways over the unchanged
wire: bulk-ban, a local rate limit on ban writes, and **re-heal** — after
publishing, re-fold, and if your addition is not in the head, re-apply it atop
the winner. Re-heal guarantees convergence to the union.

## Pins carry proof

A pin does not quote a message; it **proves** one. The entry carries the original
signed seal plus a 76-byte key disclosure that opens exactly that one message.

NIP-44 derives per-message keys one-way from the conversation key, so disclosing
one message's expansion exposes that message and nothing else — not the
conversation key, not the epoch, not the author's other traffic.

A verifier holding nothing but the pin can check the signature, verify the MAC,
decrypt, confirm the rumor's author matches the seal and its channel binding
matches this list, and recompute the rumor id. A passing entry proves the author
signed exactly this ciphertext and this ciphertext opens to exactly this message
— verifiable forever, by members who joined long after the keys rotated.

Three honest consequences:

- A message is pinnable only by someone who can read it, and only while someone
  holds its epoch's key.
- A pin makes its message permanently attributable to every future member. That
  is the point, and it is why `PIN_MESSAGES` is real editorial power.
- Self-erasure outranks curation. A member's deletion of their own message
  reaches the pin by identity, and every holder of the bit must ensure the folded
  head no longer carries it.
