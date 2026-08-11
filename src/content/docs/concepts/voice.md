---
title: Voice and video
description: Calls in any channel, with a blind token broker, an SFU that only forwards ciphertext, per-sender media keys, and signed presence over the channel itself.
sidebar:
  order: 6
---

Voice, video, and screenshare work in any channel, with no host and no roster.
Normative text: [CORD-07](/spec/cord-07/).

The problem is structural: no server can check membership before handing out
media tokens, because no server knows the membership. So clients prove
**possession of the channel's key** instead.

## Every channel is callable

There is no separate voice channel type and no per-channel flag. Two sub-keys
derive from whatever secret already addresses the channel's chat plane:

```
voice_key       = group_key("concord/voice-signer", channel_secret, channel_id, epoch)
voice_media_key = hkdf(channel_secret, "concord/voice-media", channel_id, epoch)
```

The voice key's pubkey is the SFU **room name**, and its secret signs token
requests. The media key is the root of media encryption.

Both ride the channel's epoch, so they rotate exactly when the channel's key
does. The same rotation that severs a removed member from chat severs them from
calls. Until the rotation lands, a removed member can still join — the same
window chat itself accepts.

## The blind broker

A broker is a small service that mints SFU tokens. It holds no community secrets
and keeps no state beyond a transient anti-replay set.

To get a token, a client signs a request with the derived voice key, so the
request's pubkey *is* the room name. The broker checks the signature, the
request binding, a ±60 second freshness window, and that it has not seen this
request id before.

Only a holder of the channel's key can derive that signing key, so the broker
needs no lookup and no community knowledge. **It cannot tell which community a
room belongs to, and it never learns who is joining.**

Blindness has stated costs, and the specification names them:

- The broker and SFU still see IPs and connection timing. Members who need those
  hidden should use an anonymising transport.
- A room name is stable for a whole epoch, so one broker serving a long-lived
  channel can link its calls, participant counts, and durations across months
  under a single meaningless label. A community that finds that intolerable
  spreads across brokers or rotates deliberately.
- Blindness makes a broker an **open service**. Anyone can mint a random keypair,
  call its pubkey a room, and pass every check. An operator carries strangers'
  media by design. Abuse is bounded by rate limits, participant caps, and short
  token lifetimes — never by allow-listing rooms or callers, which would end the
  blindness.

## Per-sender media keys

Media must be end-to-end encrypted, and the media key never feeds a cipher
directly. Every publisher encrypts under a **per-sender key** derived from the
media key and that publisher's broker-assigned SFU identity:

```
sender_key = hkdf(voice_media_key, "concord/voice-sender", sha256(identity))
```

The reason is specific: two senders colliding on an IV under one shared AEAD key
is catastrophic, while distinct keys make a collision harmless. Every member can
derive every publisher's key from the identity the SFU presents for the track, so
there is no in-band key exchange at all.

The SFU only ever forwards ciphertext. A frame layer may leave the few codec
header bytes an SFU needs for routing unencrypted — metadata, never content.

Honest limit: the media layer has **no sender authentication among keyholders**.
Any member can derive any sender key. The separation partitions nonces; it never
proves authorship. Attribution rests on presence, below.

## Presence

Who is in a call is announced over the channel itself, so relays and brokers stay
blind. Presence rides an *ephemeral* wrap that relays must not store, sealed like
everything else on the chat plane.

- On join and every 30 seconds after, a client publishes a `joined` carrying its
  broker-assigned identity and the broker's origin. On leave it best-effort
  publishes a `left`; a missed one heals by staleness.
- Per author, the latest presence wins. A `joined` older than 90 seconds — three
  missed heartbeats — counts as absent.
- A client renders an SFU participant as a member only if **exactly one** author's
  fresh signed presence claims that identity. Identities are member-visible, so a
  malicious member can copy a victim's into their own announcement; a contested
  claim proves nothing about either author, so all claimants render as unverified
  until the stale claims age out.

## Rendezvous

The broker hint on live presence lets members converge on one room with no
configuration:

1. If anyone is present, join their broker.
2. On a tie, pick the origin with the smallest hash of the room name and origin
   together — one canonical byte form, so every client settles the same tie.
3. If the room is empty, use your own preferred broker. Presence is ephemeral, so
   a joiner should listen for one full heartbeat interval before concluding a
   room is empty.
4. Probe the broker's capability endpoint first and fall back if unreachable.

A split — two subsets of one call on two brokers — heals by the same tie-break:
clients seeing presence for an origin that beats their own migrate to the winner.

The hint is untrusted input from a fellow member, not an authorisation. A
malicious member can steer the call to a broker and SFU of their choosing, which
then sees IPs and timing. End-to-end encryption means it can never decode the
media.

## Moderation in a call

No server checks permissions, so a call carries no enforceable mute. The SFU is
blind, and the permission bits never reach it.

Client-side discipline covers the polite cases: a client can locally silence any
participant, and clients should refuse to render tracks whose identity fails
presence verification. But a member determined to publish cannot be stopped
mid-call by any signed edict.

The enforceable lever is the one chat already has. Kick, ban, and rekey rotate
the room name and media key out from under the target. **Removal from the channel
is removal from its calls.**
