---
title: Compared to alternatives
description: How Concord relates to NIP-17, NIP-29, Marmot, and Iris Chat, and why it makes different trade-offs for large, Discord-style communities.
sidebar:
  order: 5
---

Concord isn't the only way to do private messaging on Nostr. It is designed for
large, Discord-style communities, which the others don't target. Each
alternative below is a better fit for something.

## NIP-17: private direct messages

[NIP-17](https://github.com/nostr-protocol/nips/blob/master/17.md) is the
standard for encrypted DMs on Nostr, and it is the right choice for one-to-one
conversations.

It isn't built for communities. Group rooms were added on top, and because
every message is `p`-tagged to its recipient, a client has to decrypt the whole
giftwrap inbox to find anything, which also makes it easy to flood.

Concord reverses this: a fixed author and a one-time `p` tag. That lets a
client subscribe to a room with one filter instead of scanning an inbox.

## NIP-29: relay-based groups

[NIP-29](https://github.com/nostr-protocol/nips/blob/master/29.md) puts groups
on a relay that enforces membership and moderation.

That means someone has to run a relay to host a community, and messages aren't
end-to-end encrypted: the relay has to read everything to enforce anything.

Concord doesn't need a dedicated server. Relays only see encrypted data, and
authority is a signed roster that every member checks. The trade-off is that a
misbehaving member can always *publish*; clients just ignore them.

## Marmot: MLS on Nostr

[Marmot](https://github.com/marmot-protocol/marmot) uses
[MLS](https://www.rfc-editor.org/rfc/rfc9420.html) for forward secrecy and
post-compromise security. For small groups with a lot at stake, it is the
stronger choice, and Concord doesn't try to match it.

MLS keeps every member in lockstep: commits have to be applied in order, every
device needs a key package, and each membership change costs more as the group
grows. That works badly for a large public room where people join and leave
constantly and many members are offline at any given moment.

Concord gives up ratcheting so that clients can sync state at any time, in any
order. A member who has been offline for a month opens their client and catches
up without anyone else having to do anything.

## Iris Chat: Double Ratchet

[Iris Chat](https://irischat.org/) applies the Double Ratchet to Nostr
conversations, for similar reasons to Marmot. It is closer to a Signal
replacement than a Discord one: ratcheted chats between people rather than
communities with an owner and roles.

## Which to use

NIP-17 is for DMs. NIP-29 trusts the relay. Marmot and Iris Chat protect small
groups with ratcheting. Concord is for large communities.

For six people planning something sensitive, use a ratcheted protocol. For six
hundred people with channels, roles, and moderators, use Concord.

## Using more than one

A client can support several of these. Armada, for example, supports Concord
alongside NIP-29 and Buzz communities, so one key signs you in to all of them.
