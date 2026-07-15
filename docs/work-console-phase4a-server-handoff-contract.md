# Work Console Phase 4A — Server Handoff Contract

Date: 2026-07-15
Status: contract-only; fixture-only; live connection disabled

## Scope lock

Phase 4A does not implement live collection.

Phase 4A does not add API routes.

Phase 4A does not read Hermes, VPS, runtime, scheduler, profile, gateway, session, database, or output files.

Phase 4A does not modify env, secrets, database, scheduler, gateway, server, Vercel production env, or deployment infrastructure.

Phase 4A only defines a future server handoff contract, a dummy fixture example, TypeScript types, and non-live verification.

## Plain-language summary

This phase does **not** make the Work Console show real Hermes operating status.

It adds the safety contract that a future server-owned collector must follow before live status can ever be shown. The current browser remains fixture/default or disabled-only.

## Required architecture

```text
Browser Work Console
  reads only an already-sanitized snapshot
  never reads runtime files directly

Server-owned collector, future phase only
  collects read-only runtime facts after approval
  applies allowlist serialization
  removes sensitive details
  writes or serves a safe snapshot

Snapshot delivery layer, future phase only
  admin-only/internal boundary
  cache/freshness state
  safe errors only
  kill switch defaults to disabled
```

A proposed future internal endpoint shape may be documented as a target contract, but it is **not implemented in Phase 4A**.

## Snapshot envelope required fields

`WorkConsoleServerSnapshotEnvelope` must contain:

- `apiVersion`
- `sourceMode`
- `cacheState`
- `generatedAt`
- `staleAfter`
- `expiresAt`
- `readOnly`
- `liveReadEnabled`
- `productionLiveApproved`
- `serverCollectorApproved`
- `privateIdsRedacted`
- `rawLogsIncluded`
- `rawRuntimeOutputIncluded`
- `safeComponents`
- `errors`
- `approvalGates`

The client may ignore unknown future fields, but the Phase 4A verifier must fail when the fixture omits required fields or when it contains disallowed raw-looking fields.

## Allowed browser data

Only sanitized allowlist fields may reach the browser:

- schema version
- source mode
- cache/freshness state
- generated/stale/expiry timestamps
- read-only boolean
- production approval boolean
- collector approval boolean
- redaction confirmation booleans
- safe component category
- safe status bucket
- safe display message
- bucketed counts such as `0`, `1-5`, `5+`
- safe issue code
- safe retryable error code
- approval gate labels and statuses

## Forbidden browser data policy

The browser contract must not contain original runtime records, raw outputs, raw logs, local host paths, private IDs, stack traces, command output, request headers, secret names, secret values, config contents, or transcript content.

Forbidden examples include:

- absolute host paths
- profile home paths
- scheduler output paths
- runtime database names
- gateway log locations
- platform message or channel identifiers
- account tokens and API credentials
- authorization headers
- raw command results
- stack traces and exception causes
- session titles or prompt text
- full config, auth, or env content

## Safe error policy

Browser-facing errors must include only:

- `code`
- `safeMessage`
- `retryable`
- severity bucket
- optional dummy/opaque correlation reference

Browser-facing errors must not wrap a raw thrown message, stack trace, cause chain, command output, request header, private path, or internal log text.

## Cache and freshness policy

A future snapshot must be cache-aware:

- `generatedAt`: when the safe snapshot was produced
- `staleAfter`: when the UI should label it stale
- `expiresAt`: when it should no longer be treated as useful
- `cacheState`: `fresh`, `stale`, `fallback`, `disabled`, or `unavailable`

If collection fails, the server may return the last sanitized snapshot as stale. If no safe snapshot exists, it must return a disabled or unavailable response with a safe error only.

## Kill switch and rollback

The default state is disabled and fail-closed.

Future live connection requires a server-side kill switch that can immediately return a disabled safe snapshot. The frontend must be able to fall back to fixture/default or live-disabled display without breaking the rest of the homepage.

## Phase 4B approval gates

The current type enum still retains legacy internal labels from the previous planning sequence:

```text
3D-server-handoff-design = Phase 4A contract/design work
3E-local-staging-spike = Phase 4B local or staging spike candidate
3F-staging-integration = later staging integration
3G-production-enable = later production enablement
```

These legacy labels are compatibility markers only. They do not mean live collection is implemented in Phase 4A.

No live collector, API route, runtime read, environment variable, server process, gateway process, database, cron, or Vercel production setting may be changed without a separate approval step.

Before Phase 4B or any live-like spike, the following must be approved and verified:

1. Server-owned collector design review
2. Admin-only route boundary review
3. Allowlist serialization test
4. Sanitizer/redactor test
5. Safe error test
6. Cache/freshness/stale/fallback test
7. Kill switch disabled/fail-closed test
8. No raw path/log/output/env/session/config verification
9. Local or staging dry-run plan
10. Explicit approval for any server, gateway, cron, env, secret, database, or production setting change

## Scanned dummy example

The following block is the only documentation example scanned by the Phase 4A verifier. It must stay dummy-only.

<!-- work-console-contract-scan:start -->
```json
{
  "apiVersion": "work-console-snapshot.v1",
  "sourceMode": "fixture-only",
  "cacheState": "disabled",
  "generatedAt": "2026-07-15T00:00:00.000Z",
  "staleAfter": "2026-07-15T00:05:00.000Z",
  "expiresAt": "2026-07-15T00:30:00.000Z",
  "readOnly": true,
  "liveReadEnabled": false,
  "productionLiveApproved": false,
  "serverCollectorApproved": false,
  "privateIdsRedacted": true,
  "rawLogsIncluded": false,
  "rawRuntimeOutputIncluded": false,
  "safeComponents": [
    {
      "componentRef": "demo-component-a",
      "kind": "gateway",
      "status": "disabled",
      "safeMessage": "Fixture-only contract. No live Hermes runtime is connected.",
      "countBucket": "0",
      "issueCode": "LIVE_SOURCE_NOT_CONNECTED"
    }
  ],
  "errors": [
    {
      "code": "WORK_CONSOLE_LIVE_NOT_APPROVED",
      "safeMessage": "Live Work Console data is not connected in Phase 4A.",
      "retryable": false,
      "severity": "info",
      "opaqueCorrelationRef": "demo-correlation-a"
    }
  ],
  "approvalGates": [
    {
      "id": "server-collector-design-review",
      "label": "Server collector design review",
      "status": "pending",
      "requiredForPhase": "3E-local-staging-spike",
      "note": "Required before any runtime source is connected."
    }
  ]
}
```
<!-- work-console-contract-scan:end -->

## Verification

```bash
npm run verify:work-console-server-handoff-contract
npm run verify:work-console-source-boundary
npm run verify:work-console-runtime-gate
npm run build
```

Passing this verifier only means the Phase 4A contract fixture and scanned example do not contain forbidden contract patterns. It does **not** prove that a future live server collector is safe.
