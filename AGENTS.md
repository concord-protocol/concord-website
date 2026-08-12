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
