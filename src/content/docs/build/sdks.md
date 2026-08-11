---
title: SDKs and libraries
description: The libraries available for building on Concord today, and what to look for if you are writing an implementation from scratch.
sidebar:
  order: 1
---

## vector_sdk

An ergonomic Rust SDK for building bots and clients on top of `vector-core`. It
handles keys, relays, streams, and encryption so you write handlers instead of
cryptography.

- **Crate:** [`vector_sdk`](https://crates.io/crates/vector_sdk)
- **Docs:** [docs.rs/vector-sdk](https://docs.rs/vector-sdk)
- **Source:** [VectorPrivacy/Vector](https://github.com/VectorPrivacy/Vector)
- **License:** MIT
- **Author:** JSKitty

```toml
[dependencies]
vector_sdk = "0.8"
```

An optional `tor` feature routes traffic through an anonymising transport, which
matters more here than in most protocols: Concord hides *what* you say and *who
is in the room*, but the network layer still sees that you connected to a relay.

The [`price-bot`](https://github.com/JSKitty/price-bot) repository is a compact
worked example of the SDK's command handling.

## Writing your own

There is no requirement to use an SDK. Concord rides on ordinary Nostr events, so
any Nostr library plus NIP-44 gets you most of the way. What you have to add is
specific and small in surface area, if not in care:

**Key derivation.** The `group_key` construction — HKDF into a normalized
secp256k1 scalar, then the x-only pubkey and a NIP-44 self-ECDH conversation key.
Every label is frozen; the table is in [CORD-02 Appendix A](/spec/cord-02/).

**The three-layer event.** Wrap, seal, rumor. Note that the seal is kind `20013`
when its content is encrypted and kind `20014` when it carries the rumor's JSON
verbatim, and that the choice is a fixed property of the plane, never a
per-message decision.

**The fold.** Reducing chained editions to a converged head, identically to every
other client.

**Epoch handling.** Querying every epoch address you hold, precomputing the next
rekey address to catch rotations in real time, and verifying continuity before
adopting a new key.

## Reference implementations

The three shipping clients are all open source, and reading one is the fastest
route to understanding the protocol in practice. They are usefully different from
each other:

| Client | Language | Notable for |
| --- | --- | --- |
| [Vector](https://github.com/VectorPrivacy/Vector) | Rust (Tauri) | Native desktop and mobile, Tor transport, the `vector_sdk` foundation |
| [Armada](https://gitworkshop.dev/soapbox.pub/armada) | TypeScript (Capacitor) | Full Discord-shaped feature set, multi-protocol, voice and video |
| [Accordion](https://github.com/hzrd149/accordion.chat) | TypeScript | A compact browser-only implementation built on the applesauce toolkit |

Accordion in particular is worth reading if you want to see how little code it
takes to speak Concord once the derivations are right.

## What to test first

Interoperability failures in Concord are usually silent — you land at a different
address and simply see an empty room rather than an error. So test in this order:

1. **Derive a known address.** Take a community you can already open in an
   existing client and confirm your implementation computes the same
   `control_pk` and channel addresses.
2. **Decrypt one message.** All three layers, ending at a rumor whose `channel`
   and `epoch` tags match what you expected.
3. **Fold a roster.** Confirm you reach the same head as another client,
   including the refuse-downgrade rule.
4. **Survive a rotation.** The rekey path is where implementations most often
   diverge, and where the failure mode is a member silently locked out.
