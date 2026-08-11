---
title: Invites and joining
description: How invite links carry a locator instead of keys, how they revoke without re-keying, and how a direct invite hands a bundle straight to a known identity.
sidebar:
  order: 4
---

An invite is how members are handed the keys that make them members. Normative
text: [CORD-05](/spec/cord-05/).

## The bundle

Whatever the delivery method, the payload is the same **CommunityInvite** bundle:

- the `community_id`, owner pubkey, and owner salt — so the joiner can verify the
  founder;
- the `community_root` and its current epoch — the access key itself;
- the current `control_pk` — read access to the Control Plane, never write;
- the granted channels, each with id, key, epoch, and name;
- the community's relays;
- the name and icon, purely as a preview so a parked invite can render;
- an optional expiry, and optional creator attribution and label.

The inviter's own identity is irrelevant to trust. The `community_id`
self-certifies the owner, so a bundle cannot smuggle a false owner or a fake key
for a real community. A bundle whose owner and salt fail to reproduce the
`community_id` is refused.

An invite bundle is **passive**. It waits on relays to be fetched, so a user only
encounters one by following a link, and even then the client merely pulls it to
preview the community. Nothing joins, subscribes, or announces presence until the
user explicitly accepts.

:::caution[Bound it before you allocate]
A bundle is attacker-crafted input reached by following a link. A client **must**
reject a bundle carrying an unreasonable channel count and truncate the relay
list before allocating. Absent bounds, a hostile link is an unbounded-allocation
and connect-storm vector.
:::

## The link

An invite URL has two parts — a public locator in the path, and a secret in the
fragment:

```
https://<any base>/invite/<naddr>#<fragment>
```

The **naddr** names where the encrypted bundle lives. It is a locator, not a
secret, so it rides in the open.

The **fragment** carries a random 16-byte unlock token plus a few bootstrap
relays. A fragment is never sent to any server, so the base domain and the relays
see *where* a bundle sits but can never open one.

The base is interchangeable. The same naddr and fragment open on any client's
domain or any deeplink redirect — only the naddr and fragment are protocol, and
any client recognising an invite must respect them verbatim.

## Why links can be revoked

Minting a link mints a fresh **link signer**, a keypair used for nothing else and
kept in the creator's own encrypted invite list. The bundle is posted as an
addressable event authored by that signer.

Two properties follow from the coordinate being stable and signer-owned:

- **A squatter cannot squat.** A different author is a different coordinate.
- **A link-holder cannot tamper.** Replacing or tombstoning the bundle requires
  the signer secret, held only by the creator.

So the creator can **refresh** a link — republish fresh keys behind the same URL
after a rotation, so a link shared once survives every rekey — or **retire** it by
replacing the bundle with a revocation tombstone. Unlike a relay deletion, which
is best-effort and ignorable, the tombstone is exactly as durable as the bundle
it replaced.

This is the design's real payoff: **revoking a link never requires re-keying the
community**.

## The relay dictionary

Full relay URLs would inflate a link past what length-restricted platforms
accept. So Concord defines a small, versioned relay dictionary that every client
knows, letting a community reference a common relay by a single byte — and the
stock set is selected by one flag, so the common invite carries zero additional
relay bytes.

The dictionary is a *default*, not a requirement. Anyone wanting full control
encodes their own relays inline. Vector and Soapbox ship it identically, so an
invite minted by either client opens in the other.

## The registry, and what makes a community "public"

The creator's invite list is private bookkeeping. Its member-facing shadow is the
**registry**: a Control Plane entity, bound to each creator's own coordinate,
listing the *coordinates* of their live links — never tokens, URLs, or signing
secrets.

Members fold every creator's registry into one aggregate active set, and that set
is the source of truth for whether a community is public:

- **Non-empty** — a live link exists, so the community is public.
- **Empty** — the community is private.

Retiring the last live link empties the set and triggers a refounding, which
flips the community back to private for real.

Because the registry carries locators rather than secrets, members can *see* that
links exist without being able to use one.

## Direct invites

Everything above is armour for a hostile journey: a link rides plaintext
channels, so its keys hide behind an off-network token and stay revocable because
anyone along the way may have copied the URL.

When the invitee is a known identity, none of that is necessary. Nostr already
has an encrypted, authenticated lane to a specific person, so a **direct invite**
drops the machinery and giftwraps the bundle straight to them. No coordinate, no
token, nothing to fetch.

The seal's verified identity proves who invited them, and the bundle validates
exactly as a fetched one would. Nothing — no relay connection, no icon fetch, no
join — happens before the user decides.

A direct invite is a key handoff, not a standing door:

- **It cannot be revoked.** The recipient holds the keys the moment it lands.
  Regretting one is what rekeys are for, the same as regretting any member.
- **It grants exactly what it carries.** No refresh, no tombstone.
- **It appears in no registry and never flips the community public** — which is
  precisely what makes it a private community's way to grow: membership by
  personal handoff, one identity at a time, with no live link ever existing.
- **No permission gates it,** because none could. Any keyholder can whisper keys;
  that is the ungateable floor the design already accepts.

The wrap carries one identifying outer tag so a recipient can index their
invites directly rather than decrypting their whole giftwrap inbox. An observer
learns that someone invited this identity to some community at roughly some time
— never which community, who sent it, or whether it was accepted.
