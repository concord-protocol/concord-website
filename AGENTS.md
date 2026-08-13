# Agent instructions

## Committing

**Always commit after making changes. Never wait.** Do not leave work sitting in
the working tree and do not ask whether to commit — finish the change, verify it
builds, then commit it.

Commit messages follow the existing log: a single imperative sentence in
sentence case, no prefix or ticket number (e.g. "Use the real Concord logo").

## Verifying

`npm run build` before committing. It syncs the CORD specification from the spec
repo and then builds all 31 pages, so it catches broken links and bad frontmatter
as well as compile errors.

## Deploying

`npm run deploy` builds and then publishes to Nostr as an nsite. Everything that
identifies the site lives in `.nsite/config.json` — in particular `"id":
"concord"`, which makes it the named site (kind 35128) rather than the account's
root site. Do not pass `-d`; there is nothing to remember and nothing to get
wrong.

Two details in the script are load-bearing. It runs nsyte through
`deno run jsr:@nsyte/cli@<version>` rather than an installed binary, because the
binary is not on `PATH` and an unpinned install has been observed landing on an
ancient version that publishes the wrong event kind. And it scans at
`--scan-level low`, which still refuses to publish an nsec, an nbunksec, or a
`bunker://` URL, but no longer trips over the spec pages' prose about invite
tokens and secrets.

Gateways cache aggressively (`nsite.lol` sends `max-age=3600`), so a fresh deploy
can take an hour to show up. Confirm the deploy from the manifest instead: it
should be kind 35128 with `d=concord`, and its `/index.html` hash should match
`sha256sum dist/index.html`.
