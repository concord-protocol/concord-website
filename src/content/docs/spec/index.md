---
title: The CORD documents
description: The normative Concord specification — eight self-contained documents that compose into a complete protocol for encrypted communities on Nostr.
sidebar:
  order: 0
  label: The CORD documents
---

Concord is defined by a series of **CORD** documents. Like Nostr's NIPs, each is
a small, self-contained piece that composes into the whole.

The pages below are synced verbatim from the
[specification repository](https://github.com/concord-protocol/concord), which is
the source of truth. If the two ever disagree, the repository wins.

| CORD | Title | What it does |
| --- | --- | --- |
| [01](/spec/cord-01/) | Private Streams | The base primitive: a shared-key stream of giftwraps, readable by anyone holding the key, invisible to everyone else. |
| [02](/spec/cord-02/) | Communities | Ties channels into one membership and authority model. Defines the self-certifying `community_id`, the `community_root` access key, the staff-held `control_root` write key, epochs, and the Control, Chat, and Guestbook planes. |
| [03](/spec/cord-03/) | Channels | Public and Private rooms, each its own sealed plane with its own key derived from the community. |
| [04](/spec/cord-04/) | Roles | Granular, ranked, owner-rooted permissions — Admin, Mod, custom — validated by every client and enforced by rejection, not by a server. |
| [05](/spec/cord-05/) | Invites | Shareable links whose keys live in an encrypted bundle on relays; the link carries only a locator and an unlock token, so invites revoke without re-keying. Or skip the URL and giftwrap the keys straight to an identity as a Direct Invite. |
| [06](/spec/cord-06/) | Rekeys & Refoundings | Post-removal secrecy: rotate a channel's key to cut off a removed member, or re-found the whole community at a new epoch to ban someone for real. |
| [07](/spec/cord-07/) | Audio/Video | Voice, video, and screenshare in any channel: a blind token broker and an SFU that only ever forward ciphertext, membership proven by key possession, participants verified by signed presence. |
| [08](/spec/cord-08/) | Disappearing Messages | One staff-set timer per community: every channel's messages expire via NIP-40 — hidden by clients, purged from stores, deleted by relays. The control plane never expires. |

For a non-normative, at-a-glance reference,
[event examples](/spec/examples/) shows example JSON for every event kind in the
registry.

## Reading order

If you are implementing Concord, read them in order. Each builds on the last, and
CORD-02 in particular is load-bearing for everything after it.

If you are evaluating Concord, start with [how it works](/learn/how-it-works/)
and the [threat model](/learn/threat-model/) instead — they cover the same ground
in prose, and link back here for the details.

## Conventions

A few rules apply everywhere and are easy to miss:

- **Hex is lowercase**, and every 32-byte value is 64 lowercase hex characters.
- **Pubkeys are x-only hex, never bech32** — not `npub`, not a 33-byte
  compressed key — in `pubkey` fields, `authors` filters, and inside tags.
- **Tag values are strings.** An epoch or a version is its decimal form with no
  leading zeros: `"4"`, never `4`.
- **Empty content is `""`**, never `null` and never omitted.
- **`created_at` is unix seconds, untweaked.** Sub-second ordering rides an
  `["ms", 0..999]` tag, never a mutated timestamp.
- **Derivations are frozen.** Changing any labeled byte re-addresses every prior
  event and forces a migration.
- **There is no version tag, anywhere.** An outer tag would unmask the
  camouflage, and the frozen derivations already partition incompatible revisions
  by address. Absence of a version field always means *this* specification.

## Status

Concord is an evolving specification. The CORD documents are the source of truth.
Contributions, questions, and review are welcome on
[GitHub](https://github.com/concord-protocol/concord).

The specification is MIT licensed.
