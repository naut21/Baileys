# CLAUDE.md

This file is read by Claude Code at the start of every session in this repo.

The contributor and AI-agent guide lives in **[AGENTS.md](AGENTS.md)** — start there. It covers repo layout, setup, daily commands, code style, commit conventions, and what not to touch.

## Fork notes

This fork diverges from upstream WhiskeySockets/Baileys:

- **Built-in group metadata cache** (`src/Socket/messages-send.ts`), active unless the caller supplies `cachedGroupMetadata`. Invalidated on group events, not by expiry.
- **`disableLinkPreviews`** config option, to skip the blocking URL fetch on the send path.
- **Video duration and dimensions** (`src/Utils/video-metadata.ts`), read from the MP4/MOV container in-process. Upstream only computed duration for audio.
- **Message builders** (`src/Builders/`), exported from `src/index.ts`: `Button`, `ButtonV2`, `Carousel`, `AIRich`, `Toolkit`. TypeScript port of MessageBuilderV4.7 by Nixel (ValdazGT), with `fluent-ffmpeg`/`sharp` swapped for the in-repo `parseMoovBox` reader plus the same optional-`ffmpeg` and dynamic-`sharp` handling the rest of the repo uses, so no dependencies were added. Documented in the README under "Message Builders"; tests in `src/__tests__/Builders/`.
- Upstream governance docs, CI workflows, demo media, and release/docs tooling were removed. `yarn build:docs`, `yarn release`, and the changelog scripts no longer exist.
- `src/__tests__/e2e/send-receive-message.test-e2e.ts` still references the deleted `Media/` fixtures and will fail if the e2e suite is ever run.
