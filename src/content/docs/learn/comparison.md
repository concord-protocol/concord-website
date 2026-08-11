---
title: Compared to alternatives
description: How Concord relates to NIP-17, NIP-29, Marmot, and Iris Chat — and why it makes different trade-offs for large, Discord-style communities.
sidebar:
  order: 5
---

Concord is not the only way to do private messaging on Nostr. It is built for one
specific shape — large, Discord-style communities — that the others do not
target. Each alternative below is genuinely better at something.

## NIP-17: private direct messages

[NIP-17](https://github.com/nostr-protocol/nips/blob/master/17.md) is the
standard for encrypted DMs on Nostr, and it is the right tool for one-to-one
conversation.

It cannot do communities. Multi-member rooms are an afterthought in the design,
and the recipient-addressed model is vulnerable to denial-of-service issues:
because everything is `p`-tagged at you, your client must decrypt your whole
giftwrap inbox to find anything.

Concord's stream inversion — fixed author, ephemeral `p` tag — is precisely what
makes a room subscribable with one filter instead of a full inbox scan.

## NIP-29: relay-based groups

[NIP-29](https://github.com/nostr-protocol/nips/blob/master/29.md) puts groups on
a relay that enforces membership and moderation.

Two consequences follow. You have to self-host an entire server just to start a
community, and messages are not end-to-end encrypted — the relay reads
everything, because it has to in order to enforce anything.

Concord needs no server: relays see only noise, and authority is a signed roster
every member verifies for themselves. The cost is that enforcement is by
rejection rather than prevention, so a misbehaving member can always *publish*;
they just cannot be *obeyed*.

## Marmot: MLS on Nostr

[Marmot](https://github.com/marmot-protocol/marmot) uses
[MLS](https://www.rfc-editor.org/rfc/rfc9420.html) for forward secrecy and
post-compromise security. For small, high-stakes groups this is the stronger
choice, and Concord does not try to match it.

MLS advances in lockstep: ordered commits, per-device key packages, and a cost
per membership change that grows with the group. That is exactly the wrong shape
for a large, casual, high-churn public room where people join and leave
constantly and half the members are offline at any moment.

Concord trades those ratcheting guarantees for asynchronous, fold-anytime state.
A member who has been offline for a month opens their client and converges
without a coordinated commit from anyone.

## Iris Chat: Double Ratchet

[Iris Chat](https://irischat.org/) applies the Double Ratchet to Nostr
conversations, for much the same reasons as Marmot. It aims to replace Signal
more than Discord: pairwise ratcheted chats rather than owner-rooted communities.

## The summary

NIP-17 is for DMs. NIP-29 trusts the relay. Marmot and Iris Chat secure the small
ratcheted group. Concord is built for the scale and shape of a public community.

If your group is six people planning something sensitive, use a ratcheted
protocol. If it is six hundred people with channels, roles, and moderators, that
is what Concord is for.

## Interoperability

These are not mutually exclusive choices for a client. Armada, for example,
speaks Concord alongside NIP-29 and Buzz communities, so one key logs you in
across the ecosystem and your communities come with you where clients share
protocols.
