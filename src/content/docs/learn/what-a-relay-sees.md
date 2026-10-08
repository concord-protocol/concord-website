---
title: What a relay sees
description: What a relay, a network observer, a media server, and a fellow member can learn about a Concord community, including the few things that do leak.
sidebar:
  order: 3
---

"End-to-end encrypted" can mean a lot of things. This page lists what each
party can actually observe.

## What a relay stores

A relay carrying a Concord community stores kind `1059` events that look the
same as ordinary giftwrap traffic:

```json
{
  "kind": 1059,
  "pubkey": "<a stream address it cannot attribute>",
  "content": "<NIP-44 ciphertext>",
  "tags": [["p", "<a fresh throwaway key, used once>"]],
  "created_at": 1686840217,
  "sig": "<valid, but signed by a derived key>"
}
```

There is no community name, channel name, member list, sender, recipient, or
inner event kind.

The `p` tag is a random one-time key, not a real recipient, so a relay can't
group events by who they are for. NIP-59 does the opposite: it uses one-time
*authors* and real `p` tags. Concord uses a fixed author and one-time `p` tags.

## What a relay can't learn

- **Message content.** Chat messages are encrypted twice with NIP-44, once in
  the wrap and again in the seal inside it. The inner event is never published
  on its own, so no relay can keep a copy and show it as a public event.
- **Who is a member.** No readable membership list is ever sent. Joins and
  leaves are themselves encrypted inside the guestbook plane.
- **Who is in charge.** Roles, grants, and bans are Control Plane editions,
  encrypted like everything else.
- **Which community an event belongs to.** Every address is derived one way
  from a secret the relay doesn't have. A relay serving ten communities can't
  sort its storage by community.
- **Which channels belong together.** Each channel's address is derived with
  its own `channel_id`, so channels in the same community look unrelated.

## What does leak

### Traffic patterns

A relay sees that some address received a certain number of events of certain
sizes at certain times. Message volume, rough message sizes, and when a
community is active are all visible. Concord doesn't pad messages to a fixed
size or send cover traffic.

### Stable addresses within an epoch

An address stays the same until the epoch changes, and epochs change only when
someone is removed. So a relay can follow one channel's traffic for weeks or
months under one label. It never learns what the label refers to, but it can
count.

Rotating keys on purpose, or spreading a community across relays, reduces this.

### Your IP address and timing

Relays and voice brokers see network connections. Concord doesn't cover
transport, so if that matters to you, use a client that supports Tor or a
similar transport. Vector does, for example.

### Two outer tags

By default a stream wrap has no identifying outer tags, because a tagged `1059`
wouldn't look like other giftwrap traffic. There are two exceptions:

- **Direct invites** carry `["k", "3313"]`, so recipients can find their
  invites without decrypting their whole giftwrap inbox. An observer learns
  that someone invited this npub to some community at roughly some time, but
  not which community, who sent the invite, or whether it was accepted. Direct
  invites are addressed to a person with ordinary NIP-59, not sent through a
  community's streams, so the tag reveals nothing about stream traffic.
- **Disappearing messages** carry an `["expiration", …]` tag on the wrap, so
  relays that honour NIP-40 delete the ciphertext. The tag shows the timer's
  value and marks those wraps as chat rather than control traffic. A community
  that doesn't want that can turn the timer off, at the cost of relays keeping
  the ciphertext.

### Media servers

Icons and banners are encrypted with a new random key per image before upload,
and the community's metadata stores only a pointer and a hash. The media server
can't see the image, and a swapped file fails the hash check. It does see that
a file of a certain size was uploaded.

### The voice broker

The token broker sees a room name, which is a derived pubkey that means nothing
to it. It can't tell which community a room belongs to or who is joining. It
does see IP addresses and connection times, and because a room name stays the
same for a whole epoch, a broker serving a long-lived channel can link that
channel's calls, participant counts, and call lengths over months.

The SFU only forwards encrypted media. Media is encrypted end to end with
per-sender keys that only members can derive.

## What a member sees

Members are inside the encryption, so they see a lot more. Any member can:

- read every public channel, and every private channel they have the key for;
- see the member list, the banlist, and the guestbook;
- confirm which members were included in a given key rotation;
- copy anything they can read, including messages with a disappearing timer.

No disappearing-message scheme can stop that last one. Disappearing messages
protect against what happens later, such as a seized device, a stolen key, or a
relay's archive. They don't protect you from the other people in the
conversation.
