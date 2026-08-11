---
title: What is Concord?
description: Concord is a protocol for running end-to-end encrypted, Discord-style communities over Nostr, with no company, no central server, and no intermediary holding your messages or deciding who is in charge.
sidebar:
  order: 1
---

Concord is a protocol for running communities and channels over
[Nostr](https://github.com/nostr-protocol/nostr), with no company, no central
server, and no intermediary holding your messages or deciding who is in charge.

Think of the familiar structure of a platform like Discord — communities,
channels, roles — but where the encryption is real and no single entity controls
the room.

## The problem

Every group chat you have ever used has a computer in the middle. It holds every
message, knows every member, and is the final authority on who can do what.

You trust that computer to stay online, to keep your data private, and to never
turn on you. It can be subpoenaed, hacked, sold, or switched off. And when it is,
your community dies with it.

The usual decentralised answer is to let people run their own copy of that
computer. That helps with *whose* computer it is, and not at all with the fact
that there is one: the operator still reads every message, still holds the member
list, and still decides who is an admin.

## The approach

Concord deletes that computer. The three jobs a central server does get split
into pieces that need to trust nobody.

### Storage and delivery become dumb relays

Messages live on ordinary Nostr relays, which only ever see encrypted blobs
addressed to rotating, meaningless labels. A relay cannot read a message,
enumerate a membership, or even tell which community a blob belongs to. If one
misbehaves, you use the others — a community publishes to several at once.

### Membership becomes key possession

There is no member list to enforce. A community is, at bottom, a shared key: if
you can decrypt the room, you are in it. Nobody can be denied entry by a server,
because no server is asked. Joining means *receiving the key*, which happens
through an invite.

### Authority becomes a signed roster

Moderation is real — owners, admins, mods, custom roles, kicks, and bans — but it
is not a permission a server grants. Every grant and every ban is signed, and
every signature chains back to the owner's own key, which the community's
identity commits to by construction.

Each client folds that chain independently and reaches the same verdict. An
action that does not trace to the owner is not authority, no matter how validly
it is signed. Enforcement is *rejection*, not prevention: anyone can publish
anything, and everyone else drops what does not qualify.

## What this buys you

- **Nobody can read your conversations.** Not the relays, not their operators,
  not a network observer, not a future acquirer.
- **Nobody can take your community away.** There is no account to ban and no
  server to seize. A community lives wherever its members and its relays are.
- **Moderation still works.** Bans silence instantly and are verified by every
  client. Removal is then made real by rotating the keys, so a removed member is
  cryptographically cut off rather than politely asked to leave.
- **Your identity is portable.** One key logs you into every Concord client, and
  your memberships sync across your own devices.

## What it costs

Concord is explicit about its trade-offs, and the specification names them
rather than hiding them:

- **Expiry and kicks are cooperative.** An honest client hides and deletes; a
  member who could read something could always have copied it. The enforceable
  lever is always a key rotation.
- **There is no succession.** A community's identity commits to its owner's key,
  which makes ownership unforgeable and also unrecoverable. A lost owner key
  cannot be replaced. The clean exit is dissolution.
- **Forward secrecy is not ratcheted.** Concord trades the per-message
  guarantees of MLS or Double Ratchet for asynchronous, fold-anytime state that
  scales to a large, high-churn community. See
  [the comparison](/learn/comparison/).

## Where to go next

- [How it works](/learn/how-it-works/) — the keys, planes, and epochs, in plain
  language.
- [What a relay sees](/learn/what-a-relay-sees/) — exactly what leaks and what
  does not.
- [Threat model](/learn/threat-model/) — what Concord defends against, and what
  it does not.
- [The specification](/spec/) — the normative CORD documents.
