# Work Console Phase 3C-3 — Disabled Runtime Gate Contract

Date: 2026-07-15
Status: fixture-only gate implementation

## Goal

Add a disabled runtime gate contract so the Phase 3C-3 code path has no enabled live reader and attempted live sources are blocked by default.

Phase 3C-3 still does **not** read real cron output, `jobs.json`, server logs, session DB, environment files, or gateway state. It does **not** change server, gateway, cron, database, Vercel, or production runtime settings.

## Implemented boundary

Phase 3C-3 adds:

- `runtimeGate.ts`: pure runtime gate decision logic
- `adapterFactory.ts`: one source-selection path for fixture vs disabled-live adapter
- safe error payload normalization
- `verify:work-console-runtime-gate`: fixture-only gate tests
- `verify:work-console-dist-leak`: build artifact leak scan after build; source maps are included only if the build generated them

The future local cron reader is intentionally **not implemented**.

## Default behavior

Default source remains:

```text
fixture
```

Default adapter remains:

```text
mock-work-console-adapter
```

Live-read state remains:

```text
liveReadEnabled = false
```

Unknown source or attempted `local-cron-readonly` source returns the disabled-live adapter unless a future approved phase adds a real reader and passes all gates.

## Runtime gate blockers

A `local-cron-readonly` attempt is blocked by default for reasons including:

- missing traceable approval
- approval scope too narrow
- read-only boundary unverified
- production live read blocked
- feature flag disabled
- write capability present
- network capability present
- path boundary unverified
- domain policy unverified
- owner policy unverified
- metadata sanitizer unverified
- cache policy unverified
- logging policy unverified
- safe error policy unverified
- bundle leak scan unverified
- kill switch unverified
- live cron reader not implemented

Even if every other flag is passed in a test, `live_cron_reader_not_implemented` keeps live-read blocked in this phase.

## Verification commands

```bash
npm run verify:work-console
npm run verify:work-console-policy
npm run verify:work-console-runtime-gate
npm run lint
npm run build
npm run verify:work-console-dist-leak
```

## Dist artifact forbidden strings

The dist leak scan fails closed on patterns such as:

- host data path
- profile cron path
- jobs metadata filename
- cron output path
- internal gateway hostname
- bearer-token-like strings
- webhook URL patterns

The scan only inspects generated build artifacts under `dist` after `npm run build`. It is a Work Console artifact string guard, not a replacement for a full production secret scanner or live-runtime security review. Source maps are scanned only when they exist in `dist`.

## Safe error boundary

The safe error payload is a blocked-path/default guard for this fixture-only phase. It redacts common secret, ID, path, email, query-token, and environment-name patterns, but it is not sufficient evidence for live-reader production safety by itself. A future live reader still needs server/runtime/privacy/cache/log/error review.

## Reporting language

Use:

- “disabled runtime gate contract implemented”
- “fixture remains the default adapter”
- “live cron read remains disabled”
- “future live reader is still not implemented”

Do not use:

- “actual cron connection complete”
- “live data connected”
- “production cron dashboard ready”
- “read-only integration is safe”

## Next safe goal

The next safe goal after Phase 3C-3 is one of:

1. commit/push/deploy this fixture-only gate after approval, or
2. Phase 3C-4 local-only spike design review, still without production exposure.

A real cron reader, server route, environment flag, Vercel production live enablement, or public endpoint requires separate approval and server/runtime review.
