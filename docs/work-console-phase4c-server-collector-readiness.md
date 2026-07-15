# Work Console Phase 4C / S13 — Server Collector Readiness Contract

Date: 2026-07-15
Status: contract-only; checklist-only; no live server/API/runtime connection

## Scope lock

This phase does **not** implement a collector, API route, gateway reader, cron reader, filesystem reader, database reader, or production live data connection.

This phase only defines the readiness contract that must be satisfied before a later local/staging read-only spike can be approved.

Current state remains:

```text
live read: disabled
route implemented: false
server collector approved: false
production live approved: false
browser source mode: fixture-only
```

## Why this phase exists

The Work Console is moving from fixture-only UI toward a future server-owned read-only operational snapshot. Read-only reduces mutation risk, but it does **not** reduce exposure risk by itself. A server collector can still leak private paths, raw outputs, prompts, session IDs, tokens, stack traces, or delivery targets if the contract is weak.

S13 therefore locks the approval checklist before any local/staging spike touches real sources.

## Required future architecture

```text
Browser Work Console
  imports only browser-safe fixture/static entrypoints
  receives only sanitized snapshot envelopes
  cannot select or enable runtime sources

Server-owned collector, future approved spike only
  observes only explicitly approved source kinds
  proves read-only permissions
  serializes through an allowlist DTO
  drops raw, unknown, and private-looking fields
  returns safe errors only
  obeys no-store cache policy
  can be forced disabled server-side

Checker/server review gate
  required before local/staging spike
  required again before any production connection
```

## Local/staging spike pre-approval checklist

A future local/staging read-only spike must have all of these gates reviewed before touching real runtime sources:

1. Traceable user approval naming local or staging read-only scope.
2. Server-owned route boundary with admin-only access.
3. No client-side flag that can enable runtime reads by itself.
4. Read-only permission proof: no write, run, delete, restart, or config mutation capability.
5. Exact allowed source list and exact forbidden source list.
6. Allowlist serializer proof: unknown/raw fields are dropped.
7. Safe error proof: thrown details become stable safe codes and short messages only.
8. No-store/cache proof: fresh, stale, fallback, disabled, and unavailable states are labeled.
9. Server-side kill switch proof: forced disabled snapshot regardless of client input.
10. Safe observability proof: only aggregate buckets and opaque refs in logs/analytics.
11. Rollback/disable plan that returns fixture-only or disabled safe snapshots.
12. Checker risk review.
13. Server profile sign-off for operational boundary.
14. Separate future approval before any production live connection.

## Allowed source kinds for the readiness contract

The current contract allows only dummy/sanitized categories:

- dummy in-memory observations
- sanitized safe component summaries
- safe error buckets
- cache state buckets
- approval gate statuses

## Forbidden source kinds until a later approval

The current contract forbids:

- runtime file reads
- scheduler output bodies
- gateway log reads
- session transcript reads
- profile home path reads
- environment value reads
- credential material reads
- database record reads

## Browser-facing forbidden data

A future snapshot must not expose:

- raw logs, raw output, raw runtime objects, command output, or exception causes
- stack traces, tracebacks, internal error messages, or private log text
- absolute host paths, profile home paths, scheduler output paths, gateway log paths, or database filenames
- prompt text, session transcript text, message IDs, channel IDs, thread IDs, guild IDs, or delivery targets
- API keys, bearer strings, access tokens, refresh tokens, secrets, passwords, cookies, auth headers, or private key blocks
- real source identifiers that can identify the user's operational infrastructure

## Scanned readiness example

The following JSON block is scanned by `npm run verify:work-console-server-collector-readiness`. It must remain a full mirror of `WORK_CONSOLE_SERVER_COLLECTOR_READINESS_FIXTURE`, dummy-only, and disabled.

<!-- work-console-collector-readiness-scan:start -->
```json
{
  "contractVersion": "work-console-collector-readiness.v1",
  "scope": "pre-live-local-staging-readiness",
  "liveReadEnabled": false,
  "routeImplemented": false,
  "serverCollectorApproved": false,
  "productionLiveApproved": false,
  "publicAccess": false,
  "sharedCacheAllowed": false,
  "rawPayloadAllowed": false,
  "requiresSeparateUserApproval": true,
  "ownerProfile": "server",
  "browserSourceMode": "fixture-only",
  "allowedSourceKinds": [
    "dummy-in-memory-observation",
    "sanitized-safe-component-summary",
    "safe-error-bucket",
    "cache-state-bucket",
    "approval-gate-status"
  ],
  "forbiddenSourceKinds": [
    "runtime-file-read",
    "scheduler-output-body",
    "gateway-log-read",
    "session-transcript-read",
    "profile-home-path-read",
    "environment-value-read",
    "credential-material-read",
    "database-record-read"
  ],
  "gates": [
    {
      "id": "traceable-user-approval",
      "category": "approval",
      "label": "Traceable local or staging spike approval",
      "status": "pending",
      "requiredEvidence": "A user-visible approval message naming local or staging read-only scope.",
      "stopCondition": "Stop if approval scope is missing, ambiguous, or includes production by implication."
    },
    {
      "id": "server-owned-route-boundary",
      "category": "source-boundary",
      "label": "Server-owned route boundary design",
      "status": "pending",
      "requiredEvidence": "A server-owned route contract with admin-only access and no client-side source selection.",
      "stopCondition": "Stop if a browser flag can enable source reads without a server-side gate."
    },
    {
      "id": "readonly-permission-proof",
      "category": "read-only-proof",
      "label": "Read-only permission proof",
      "status": "pending",
      "requiredEvidence": "Evidence that the spike can observe only approved sources and cannot write, run, delete, or restart.",
      "stopCondition": "Stop if the source requires write permission, command execution, restart, or credential changes."
    },
    {
      "id": "allowlist-serializer-proof",
      "category": "serialization",
      "label": "Allowlist serializer proof",
      "status": "pending",
      "requiredEvidence": "A test showing unknown fields and raw-like details are dropped before browser delivery.",
      "stopCondition": "Stop if raw payload fields are needed for the UI to render."
    },
    {
      "id": "safe-error-proof",
      "category": "safe-errors",
      "label": "Safe error proof",
      "status": "pending",
      "requiredEvidence": "A test showing thrown details become stable safe codes and short messages only.",
      "stopCondition": "Stop if stack, cause, command output, path, or private identifier text is exposed."
    },
    {
      "id": "nostore-freshness-proof",
      "category": "cache-freshness",
      "label": "No-store freshness proof",
      "status": "pending",
      "requiredEvidence": "A test covering fresh, stale, fallback, disabled, and unavailable safe states.",
      "stopCondition": "Stop if shared cache, CDN cache, or unlabeled stale fallback is required."
    },
    {
      "id": "server-kill-switch-proof",
      "category": "kill-switch",
      "label": "Server-side kill switch proof",
      "status": "pending",
      "requiredEvidence": "A test showing the server can force a disabled snapshot regardless of client input.",
      "stopCondition": "Stop if disabling depends only on frontend code or browser state."
    },
    {
      "id": "safe-observability-proof",
      "category": "observability",
      "label": "Safe observability proof",
      "status": "pending",
      "requiredEvidence": "A log and analytics plan with only aggregate buckets and opaque refs.",
      "stopCondition": "Stop if raw records, delivery targets, prompts, paths, or private identifiers are logged."
    },
    {
      "id": "rollback-disable-plan",
      "category": "rollback",
      "label": "Rollback and disable plan",
      "status": "pending",
      "requiredEvidence": "A documented disable path returning fixture-only or disabled safe snapshots.",
      "stopCondition": "Stop if rollback requires data deletion, server restart, credential rotation, or production setting changes."
    },
    {
      "id": "production-connection-approval",
      "category": "approval",
      "label": "Production connection approval",
      "status": "blocked",
      "requiredEvidence": "A separate future approval for production live operational data connection.",
      "stopCondition": "Always blocked in this pre-live contract."
    }
  ]
}
```
<!-- work-console-collector-readiness-scan:end -->

## Verification

```bash
npm run verify:work-console-server-collector-readiness
npm run verify:work-console-source-boundary
npm run verify:work-console-server-handoff-contract
npm run verify:work-console-dummy-serializer
npm run lint
npm run build
```

Passing this verification only means the pre-live readiness contract and scanned doc example remain disabled and dummy-only. It does **not** approve or verify a live Hermes operational data connection.
