---
title: SDKs and libraries
description: Libraries for building Concord clients and bots, and what you need to implement if you write your own.
sidebar:
  order: 1
---

## vector_sdk

A Rust SDK for bots and clients, built on `vector-core`. It handles keys,
relays, streams, and encryption, so you write handlers instead of cryptography.

- **Crate:** [`vector_sdk`](https://crates.io/crates/vector_sdk)
- **Docs:** [docs.rs/vector-sdk](https://docs.rs/vector-sdk)
- **Source:** [VectorPrivacy/Vector](https://github.com/VectorPrivacy/Vector)
- **License:** MIT
- **Author:** JSKitty

```toml
[dependencies]
vector_sdk = "0.8"
```

The optional `tor` feature sends traffic over Tor. Concord hides what you say
and who is in a community, but relays still see your IP address unless you use
a transport like this.

[price-bot](https://github.com/JSKitty/price-bot) is a small example of the
SDK's command handling, and [concord-bots](https://github.com/CentauriAgent/concord-bots)
is a bot template built on it.

## applesauce-concord

CORD-01 to 06 for hzrd149's [applesauce](https://github.com/hzrd149/applesauce)
TypeScript toolkit: protocol helpers, RxJS models, and a reactive client.
It isn't published to npm or JSR yet, so install it
from the
[repository](https://gitworkshop.dev/npub1ye5ptcxfyyxl5vjvdjar2ua3f0hynkjzpx552mu5snj3qmx5pzjscpknpr/git.shakespeare.diy/applesauce-concord).

## Writing your own

You don't need an SDK. Concord uses ordinary Nostr events, so any Nostr library
with NIP-44 support covers most of it. On top of that you need:

**Key derivation.** The `group_key` construction: HKDF into a normalized
secp256k1 scalar, then the x-only pubkey and a NIP-44 self-ECDH conversation
key. The labels are fixed; the table is in
[CORD-02 Appendix A](/spec/cord-02/).

**The three-layer event.** Wrap, seal, rumor. The seal is kind `20013` when its
content is encrypted and kind `20014` when it carries the rumor's JSON as is.
Which one to use is fixed per plane, not chosen per message.

**The fold.** Reducing chained editions to the same head every other client
reaches.

**Epoch handling.** Querying every epoch address you have a key for,
subscribing to the next rekey address so you see rotations as they happen, and
checking continuity before adopting a new key.

## Reading a client

Most clients on the [clients page](/clients/) are open source, and reading one
is the quickest way to see the protocol in practice. Three that differ in
useful ways:

| Client | Language | Look at it for |
| --- | --- | --- |
| [Vector](https://github.com/VectorPrivacy/Vector) | Rust (Tauri) | Native desktop and mobile, Tor, the code `vector_sdk` comes from |
| [Armada](https://gitworkshop.dev/soapbox.pub/armada) | TypeScript (Capacitor) | The full feature set, including voice and video, alongside other community protocols |
| [Accordion](https://github.com/hzrd149/accordion.chat) | TypeScript | A small browser-only client on applesauce, showing how little code the protocol needs |

## What to test first

When an implementation gets something wrong, it usually ends up at a different
address and shows an empty community instead of an error. Test in this order:

1. **Derive a known address.** Take a community you can open in an existing
   client and check that you compute the same `control_pk` and channel
   addresses.
2. **Decrypt one message.** All three layers, ending at a rumor whose `channel`
   and `epoch` tags match what you expect.
3. **Fold a roster.** Check that you reach the same head as another client,
   including refusing to downgrade.
4. **Survive a rotation.** Implementations most often diverge on the rekey
   path, and the result is a member locked out without any error.
