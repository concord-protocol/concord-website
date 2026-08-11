---
title: Implementer checklist
description: The normative MUSTs and the failure modes that bite — collected from across the CORD documents into one list to check an implementation against.
sidebar:
  order: 3
---

This page collects requirements scattered across the CORD documents. It is a
convenience, not a substitute: [the specification](/spec/) is normative.

Failures in Concord are usually **silent**. A wrong derivation produces an empty
room, not an error. Check these deliberately.

## Encoding

- [ ] Hex is **lowercase**, and every 32-byte value is 64 hex characters.
- [ ] Pubkeys are **x-only hex** everywhere — `pubkey` fields, `authors` filters,
      and inside tags. Never bech32, never a 33-byte compressed key.
- [ ] Tag values are **strings**. An epoch, a version, a sub-kind is decimal with
      no leading zeros: `"4"`, never `4`.
- [ ] Empty content is `""`, never `null` and never omitted.
- [ ] `created_at` is unix seconds and **untweaked**. Sub-second ordering rides
      the `ms` tag.
- [ ] Every comparison uses `created_at * 1000 + ms` — message order, guestbook
      recency, Community List tiebreaks.
- [ ] An `ms` value outside `0..999` is **malformed**: drop the entry, do not
      interpret it, or the excess smuggles arbitrary future time past clock
      checks.

## Encryption and size

- [ ] Enforce the NIP-44 65,535-byte plaintext cap **at every layer of the
      nesting yourself**. Libraries are lenient, and a lenient publisher mints
      events a strict reader cannot decrypt.
- [ ] Control Plane seals are kind `20014` (plaintext). Chat, Guestbook, and
      rekey seals are kind `20013` (encrypted). This is a fixed property of the
      plane, never a per-message choice.
- [ ] A plaintext seal's content is carried **byte-verbatim** on re-wrap. Never
      re-serialize it, or two clients compute different hashes for the same
      signed rumor.
- [ ] Wrap `p` tags are fresh ephemeral keys, not real recipients.
- [ ] No outer tags on stream wraps, with exactly two exceptions: the `k` tag on
      a Direct Invite wrap, and the `expiration` tag when a disappearing timer is
      set.

## Derivations

- [ ] Every label matches the frozen table in
      [CORD-02 Appendix A](/spec/cord-02/) byte for byte.
- [ ] `scalar_normalize` retries by appending an incrementing counter byte to the
      HKDF info, starting at 0.
- [ ] The `id` input is always a raw 32-byte value, never hex, and all-zeroes
      where a label has no meaningful id.
- [ ] The epoch is the only omittable field, and only for labels that omit it.

## The fold

- [ ] Take the highest version per entity **whose chain is intact**.
- [ ] **Refuse to downgrade.** A lower version is ignored, so a replayed stale
      grant or lifted ban gets nowhere.
- [ ] Resolve ties by authority first, then the **lower rumor id** — never the
      author-settable timestamp.
- [ ] A fresh joiner accepts an authority-verified head with a dangling `prev` as
      its baseline; a tracking client treats an unresolvable `prev` as a gap,
      fails closed *for that entity*, and refetches.
- [ ] Block enforcement, never reads, on an unsynced authority citation. Resolve
      the actor's rank against the **current** roster, not the cited moment.
- [ ] A citation whose hash does not match the edition you hold at that version
      parks exactly like an unsynced one.

## Authority

- [ ] The actor must hold the required bit **and** *strictly* outrank the target.
      Equal cannot act on equal.
- [ ] No edition may claim a position at or above its own signer.
- [ ] No role may claim position 0.
- [ ] An entry that does not trace to the owner is not authority, however validly
      it is signed.
- [ ] A valid Control Plane wrap proves only that *some* staff member published.
      It is never a verdict.
- [ ] Drop **every** event from a banned pubkey — messages, reactions, edits, and
      authority actions alike.

## Messages

- [ ] Every chat rumor commits `["channel", channel_id]` and `["epoch", n]`.
- [ ] A receiver checks both **strict-equal** against the channel and epoch whose
      key decrypted the wrap, and drops any mismatch.
- [ ] Query every epoch address you hold, so history spanning a rotation stays
      continuous.

## Invites

- [ ] Refuse a bundle whose owner and salt do not reproduce the `community_id`.
- [ ] **Bound attacker-controlled input**: reject an unreasonable channel count
      and truncate the relay list before allocating.
- [ ] Fetch nothing and announce nothing until the user explicitly accepts.
- [ ] Locate a bundle by the full addressable coordinate — kind, author, and `d`.
- [ ] Treat the `k` tag on a Direct Invite wrap as an unsigned hint, never
      authority. Honour an untagged invite that unwraps correctly.

## Rotations

- [ ] Precompute and subscribe to the next rekey address, per private channel and
      for the base.
- [ ] **A missing chunk is never a removal.** Conclude removal only when you hold
      all `n` chunks and none carries your locator.
- [ ] Verify scope and epoch from *inside* the ciphertext against the event's
      tags before accepting a key.
- [ ] Reject a blob of any width other than the defined forms.
- [ ] As staff, require that a delivered `control_root` derive to exactly the
      `control_pk` you hold for the named epoch. Drop a mismatched pair.
- [ ] Verify continuity against the key you currently hold before adopting a new
      one.
- [ ] Verify the rotator's authority against your folded roster. Holding a key is
      never authority.
- [ ] Seal channel rekeys during a refounding under the **prior** root, never the
      freshly minted one.
- [ ] Acquire all state to be rotated **before** the first publish.

## Pins

- [ ] **Never build a pin edition from a list you could not read.** An empty view
      and an empty list are indistinguishable, and publishing from the former
      destroys every entry.
- [ ] Verify all five steps, including the `channel` binding, which is what stops
      a private channel's messages being pinned into a public list.
- [ ] Recompute the rumor id from decrypted bytes. Never trust an embedded `id`.
- [ ] Treat the `wrap` locator hint as untrusted.
- [ ] Fold an over-cap edition normally but treat its content as an **empty
      list**. Refusing the edition would fork the version chain between
      implementations.
- [ ] Honour a self-deletion over curation, and re-arm the obligation whenever a
      later fold re-seats a head carrying the entry.

## Dissolution

- [ ] **Check the tombstone's `eid` against this community's id.** Refuse a
      mismatch, and refuse the all-zero placeholder earlier revisions specified.
- [ ] On a valid tombstone, seal the community read-only and halt subscriptions.
- [ ] Still honour a member's deletion of their own past message after the seal.

## Disappearing messages

- [ ] Absent, `0`, or malformed `message_expiration` means **off**. Never guess a
      default from garbage.
- [ ] Tag both the rumor and the outer wrap with the same expiration value.
- [ ] Never tag deletes or timer notices.
- [ ] Refuse an already-expired rumor at ingest; never display one; sweep local
      storage periodically.
- [ ] Honour what the rumor says, not what your fold now prescribes.
- [ ] Display a timer notice only if its author holds `MANAGE_METADATA`.

## Interoperability

- [ ] **Round-trip fields you do not understand** in community metadata, channel
      metadata, the Community List, and the Invite List.
- [ ] Prefix client-specific keys inside `custom`. Leave top-level fields to the
      protocol.
- [ ] Verify a serialized Community List actually fits before publishing — the
      50-membership cap is not the whole budget.
- [ ] Use at least one relay that rejects giftwrap deletions by author.
