---
title: Removal and rotation
description: The three removals, why only one of them enforces, and how rekeys and refoundings rotate keys asynchronously without a coordinated commit.
sidebar:
  order: 5
---

What a user sees as "remove this member" is *three* mechanisms with three
guarantees, composed deliberately, in order. Normative text:
[CORD-04 §6](/spec/cord-04/) and [CORD-06](/spec/cord-06/).

## The three removals

### 1. Role removal

A grant edition strips the target's roles, revoking their **authority**. They
remain a member — reading and writing freely — they simply outrank nobody, and
their pending authority citations die with the revoked grant.

### 2. Cooperative kick

An authorised directive on the Guestbook marks the target as departed and asks
their client to leave.

*Cooperative* is the honest word. A compliant client tears the community down
locally; a defiant one still holds every key. A kick alone never enforces
anything — it is the polite removal, and a kicked member may be re-invited or
simply re-join.

### 3. Cryptographic removal

A rekey or refounding. This is the only removal that **enforces**: everything
after the rotation is unreadable to the target, no cooperation required.

## Composition is the client's duty

- A **kick** is role removal *then* the directive — strip first, so the target's
  rank is gone before the departure lands.
- A **ban** is all three, in the order their guarantees arrive: the banlist
  edition first, because silencing is instant and free; the role strip alongside;
  the refounding last, because severance is heavy and asynchronous and can
  propagate while the target is already silenced and rankless.

Each layer validates independently by its own rule. A partially propagated
removal degrades to a weaker removal, never to a broken one.

## Rekeys versus refoundings

A **rekey** rotates one private channel's key. It requires `MANAGE_CHANNELS` and
typically follows removing a role that granted access to that channel.

A **refounding** is a whole-community rekey: it rolls the `community_root`, mints
a fresh `control_root` alongside it, and rotates every relevant private channel.
It requires `BAN`. This is what removes someone absolutely from a private
community.

Public channels have no independent rekey — they derive from the
`community_root`, so they rotate exactly when the base does.

In both cases the rotator must strictly outrank every removed target, and the
rotation cites the grant it acts under like any authority action. Holding a key
is never authority: a removed member still holding the prior root can *construct*
a perfectly shaped rotation, and every honest member opens the seal, folds the
roster, and drops it.

## How keys reach the people who stay

Distribution rides **rekey blobs**: a community-encrypted package delivering the
fresh key to up to 120 recipients per event, spanning several events for a large
community.

Each recipient computes their own **locator** and searches for it inside the
rotation. The locator derives from public keys alone, so a remote signer can find
its blob without ever touching a raw private key.

Two rules keep this safe:

- **Scope and epoch live inside the ciphertext,** not just in an outer tag, and a
  recipient verifies both against the event's tags before accepting the key. A
  blob minted for one channel can never be replayed against another.
- **A missing chunk is never a removal.** Only once you hold *all* chunks and
  none contains your locator have you actually been removed. The client refetches
  until the set is complete before concluding anything.

Blob widths are fixed per form, and the width itself declares what the blob
carries — a member's base blob, a staff member's larger one that also carries the
new `control_root`, or the legacy pre-split form. Any other width is malformed
and dropped.

## Continuity

Before adopting a new key, a receiver recomputes a commitment over the key it
currently holds and requires it to match the rotation's stated one.

- A **match** proves the rotation extends the very key you hold.
- A **mismatch with a higher previous epoch** means you missed a rotation — fetch
  the gap first.
- **Anything else** is a fork or garbage, and is rejected.

This is a convergence check, not a secrecy mechanism. Post-removal secrecy rests
entirely on the removed member receiving no blob; continuity just keeps honest
members advancing along one shared chain.

## Refounding in practice

A refounding is **resumable, not atomic**. Every step is idempotent, so a crashed
refounder simply resumes. The state being rotated is acquired in full *before*
the first publish, so a mid-flight failure never leaves half a rotation as the
only copy.

Mid-gap, the community degrades gracefully: existing members keep their old
Control fold and already hold the new root. Only a fresh joiner waits on the
re-anchor.

The refounder also **compacts** the Control Plane, re-wrapping each entity's
current head into the new epoch. Because Control Plane seals are plaintext inside
the wrap, the original authors' signatures survive the re-encryption and remain
verifiable by someone who just joined. This is what keeps refoundings fast:
members hop across dozens of epochs without reprocessing thousands of control
events.

Finally, the new epoch's guestbook is seeded with a membership snapshot. That
step is best-effort — a refounding succeeds with or without it — and a member who
finds their own state missing simply publishes a fresh join, self-signed and
unsuppressable. A refounder omitting someone creates a blip, never a
disappearance.

## Races

Two rotations racing to the same epoch converge deterministically: among
authorised candidates at the same continuity point, the lexicographically lowest
new base key wins. Every client computes the same winner, and a losing refounder
re-issues only what its branch alone knew.

Both forks' keys are retained, so messages sent into the losing fork stay
readable. And the heal is **down-only** — a held epoch re-converges solely to a
strictly lower sibling — so a flaky fetch can never re-fork a settled epoch.

Channel rekeys during a refounding are sealed under the **prior** root rather
than the freshly minted one, precisely so they stay openable on either branch if
the base forks.
