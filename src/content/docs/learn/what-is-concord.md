---
title: What is Concord?
description: Concord is a protocol for end-to-end encrypted, Discord-style communities on Nostr, with no company, no central server, and nobody in the middle reading messages or deciding who is in charge.
sidebar:
  order: 1
---

Concord is a protocol for running communities and channels over
[Nostr](https://github.com/nostr-protocol/nostr). There is no company behind it,
no central server, and nobody in the middle who can read your messages or
decide who is in charge.

It has the structure people know from Discord (communities, channels, roles),
but every message is end-to-end encrypted and no single party controls the
community.

## The problem

Every group chat you've used has a server in the middle. It stores every
message, knows every member, and has the final say on who can do what.

You have to trust that server to stay online, keep your data private, and not
turn on you. It can be subpoenaed, hacked, sold, or shut down, and your
community goes with it.

Self-hosting changes who runs the server, but there is still a server. Its
operator can still read every message, see the member list, and decide who is
an admin.

## How Concord does it

Concord still uses servers: ordinary Nostr relays carry every message. But no
relay can read messages, list members, or decide who is in charge. Those three
jobs are split up so that none of them depends on trusting anyone.

### Relays only store and deliver

Messages live on ordinary Nostr relays, which only ever see encrypted blobs
sent to addresses that change over time and mean nothing to them. A relay can't
read a message, list the members, or tell which community a blob belongs to. A
community publishes to several relays, so if one misbehaves the others still
work.

### Having the key makes you a member

There is no member list for a server to check. A community is built on a shared
key: if you can decrypt it, you're in. You join by receiving that key, which
happens through an invite.

### Authority comes from signatures

Concord has owners, admins, moderators, custom roles, kicks, and bans. None of
it is granted by a server. Every grant and every ban is signed, and every
signature traces back to the owner's key, which the community's identity is
derived from.

Each client checks that chain itself, and every client reaches the same result.
An action that doesn't trace back to the owner is ignored, however validly it is
signed. Anyone can publish anything; everyone else drops what doesn't check
out.

## What you get

- **Nobody else can read your conversations.** Not the relays, their
  operators, someone watching the network, or whoever buys the company later.
- **Nobody can take your community away.** There is no account to suspend and
  no server to seize. A community exists wherever its members and relays are.
- **Moderation works.** Bans take effect immediately and every client enforces
  them. Rotating the keys afterwards cuts a removed member off for good.
- **Your identity is portable.** One key signs you in to every Concord client,
  and your memberships sync across your devices.

## What it costs

The specification lists its trade-offs. The main ones:

- **Expiry and kicks depend on clients cooperating.** A well-behaved client
  hides and deletes, but a member could always have copied anything they could
  read. The only thing that enforces removal is rotating the keys.
- **Ownership can't be transferred.** A community's identity is derived from
  its owner's key, so nobody can forge ownership, and nobody can recover it
  either. If the owner loses their key, the community can't get a new owner.
- **No ratcheting.** Concord gives up the per-message forward secrecy of MLS or
  the Double Ratchet. In return, clients can sync state at any time without
  coordinating, which scales to large communities where people come and go
  constantly. See [the comparison](/learn/comparison/).

## Where to go next

- [How it works](/learn/how-it-works/): keys, planes, and epochs in plain
  language.
- [What a relay sees](/learn/what-a-relay-sees/): what leaks and what doesn't.
- [Threat model](/learn/threat-model/): what Concord protects against, and what
  it doesn't.
- [The specification](/spec/): the normative CORD documents.
