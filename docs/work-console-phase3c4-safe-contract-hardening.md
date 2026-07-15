# Work Console Phase 3C-4 — Safe Contract Hardening

Date: 2026-07-15
Status: fixture/default only; live connection disabled

## Final Goal

Homepage Work Console will let operators inspect Hermes work, cron, and profile status in a read-only console without exposing secrets or sensitive runtime data. Production live connection must remain disabled until server, environment, cron, and security approval gates are complete.

## This phase goal

Phase 3C-4 safe contract hardens the frontend contract, UI states, fixture metadata, verification scripts, and documentation while keeping the current safe runtime behavior:

- Fixture mode remains the default.
- Live read disabled remains enforced.
- Server handoff required is visible in the contract and UI.
- Production live connection not approved is visible in the contract and UI.
- No production live reader, server route, env flag, cron read, filesystem read, fetch, WebSocket, DB reader, or Vercel configuration is introduced.

## Phase order

1. Phase 3C-4 safe contract — current frontend-only contract hardening with fixture/default and disabled runtime gate.
2. Phase 3D server handoff design — server-owned design for sanitized runtime snapshots and approval artifacts.
3. Phase 3E local/staging spike — local or staging-only read-only spike after explicit approval; no production exposure.
4. Phase 3F staging integration — staging integration with cache, logging, redaction, policy, and rollback checks.
5. Phase 3G production enable — production live enablement only after all gates pass and server/security owners approve.

## Approval gates

Production live connection is blocked until all of the following are true and traceable to an approval artifact:

- Server handoff design is approved.
- Server/runtime sanitized snapshot contract is approved.
- Read-only boundary is verified.
- Write capability is absent.
- Network and endpoint behavior are reviewed by the server owner.
- Cron owner and domain policies are verified.
- Metadata and output redaction are verified.
- Cache, logging, safe error, and retention policies are verified.
- Dist leak scan and production bundle review pass.
- Kill switch and rollback path are verified.
- Production live connection approval is explicitly granted.

## Forbidden frontend behavior

Frontend direct VPS filesystem read is forbidden. The frontend must not read live Hermes profile paths, cron output paths, runtime files, secrets, auth files, DB data, gateway logs, or cron metadata directly.

The frontend must not implement live readers using:

- filesystem access
- fetch or WebSocket live sources
- database or Supabase readers
- gateway readers
- cron output readers
- direct jobs metadata reads
- environment or secret imports

## Required server/runtime principle

A future live console must receive only a server/runtime sanitized snapshot. That snapshot must be produced behind server-owned controls, with sensitive fields removed before reaching the browser. The browser contract is read-only display of already-sanitized fields, not runtime discovery.

Minimum server/runtime sanitized snapshot principles:

- no secret fields
- no raw paths
- no raw cron output
- no auth tokens
- no private account identifiers
- policy-filtered job visibility
- bounded timestamps and sizes
- safe error messages only
- auditable approval metadata
- explicit disabled state when a gate fails

## Current Phase 3C-4 contract state

```text
Fixture mode: enabled
Live read disabled: true
Server handoff required: true
Production live connection not approved: true
Current phase: 3C-4 safe contract
Next phase: 3D server handoff design
```

The runtime gate still returns `liveReadEnabled = false`. The disabled-live adapter remains a blocked fallback only. The fixture adapter remains the default.

## Read-only scope boundary

The Phase 3C-4 read-only guarantee applies to the Work Console data path and adapter contract only:

- `src/data/work-console/**`
- `src/components/work-console/**`
- `src/types/workConsole.ts`
- Work Console verification scripts and fixture/default adapters

The broader homepage bundle may still contain unrelated product code, including existing Supabase or application features outside the Work Console route. Those features are outside this phase's read-only claim and require separate security review. Production live enablement for Work Console must therefore re-check route isolation, bundle scope, auth/visibility, and write capability before any real runtime data is connected.

## Verification commands

```bash
npm run verify:work-console
npm run verify:work-console-policy
npm run verify:work-console-runtime-gate
npm run verify:work-console-source-boundary
npm run lint
npm run build
npm run verify:work-console-dist-leak
```

## Explicitly not done in Phase 3C-4

- No live reader implemented.
- No server route implemented.
- No environment variable added or changed.
- No cron configuration read, executed, or modified.
- No real cron output read.
- No live jobs metadata read.
- No Vercel environment or production configuration changed.
- No DB, Supabase, gateway, fetch, WebSocket, or filesystem live source added.
