# Work Console Phase 4B — Pre-Implementation Design

Date: 2026-07-15
Status: design-only; no live connection; no server route implemented

## Scope

Phase 4B pre-implementation defines how a future server-owned read-only collector may hand a sanitized snapshot to the Work Console.

This phase does not approve or implement live collection, does not add a server route, does not read Hermes/VPS/runtime/scheduler/profile/gateway/session/database/log/environment/output sources, and does not change Vercel production environment, VPS settings, gateway processes, cron jobs, Docker, database schema, or deployment infrastructure.

## Responsibility split

```text
Browser Work Console
  consumes only a sanitized snapshot envelope
  displays freshness, disabled, degraded, or unavailable state
  never reads runtime sources directly
  never receives raw records or internal identifiers

Future server-owned collector
  performs read-only collection only after separate approval
  converts raw observations into allowlisted summary buckets
  applies redaction before any response is created
  returns safe disabled/unavailable responses when blocked

Future internal delivery boundary
  admin-only or internal relay only
  no public operational endpoint
  no shared CDN caching for operational data
  kill switch defaults to fail-closed
```

## Browser-facing contract rules

The browser-facing shape must be an allowlist, not a filtered raw object. Allowed categories are limited to API version, source mode, audience label, read-only/approval booleans, cache/freshness timestamps, kill-switch state, endpoint policy summary, safe component summaries, safe errors, and approval gates.

The browser-facing shape must not contain raw logs, raw command output, stack traces, raw exception messages, filesystem locations, runtime database names, environment variable names/values, credentials, platform identifiers, prompt/session transcript content, full cron job definitions, or full profile/gateway/config contents.

## Minimum future source set

| Category | Safe browser value | Raw data allowed in browser? |
| --- | --- | --- |
| Gateway | status bucket and safe message | No |
| Scheduler | enabled/disabled/degraded bucket | No |
| Profile group | group health bucket | No |
| Session summary | count bucket only | No |
| System check | degraded or unavailable bucket | No |

The collector must map every raw observation into a safe component summary before it can leave the server boundary.

## Cache, stale, and kill switch behavior

A future implementation must include `generatedAt`, `staleAfter`, `expiresAt`, `cacheState`, and no-store-equivalent behavior for operational responses.

If collection fails, the server may return a previous sanitized snapshot only as stale/fallback. If no sanitized snapshot exists, it must return disabled or unavailable with a safe error only.

The kill switch must be server-side first. A client-side fallback is only a display safety net. In this policy, `forced_disabled` means the collector is blocked regardless of any later source result. A future `enabled` value would mean the kill switch is active as a blocking control, not that live collection is approved.

Current default for this stage:

```text
collector route implemented: false
live collection approved: false
kill switch: forced disabled
browser state: disabled or unavailable
```

## Local/staging spike readiness gates

Roadmap label note: `3E-local-staging-spike` is the legacy Work Console roadmap label for the next local/staging spike gate. In this document, it means the same future Phase 4B spike approval gate; it does not mean live collection is implemented now.

A later local/staging spike requires all of these to pass first:

1. server collector design review
2. endpoint/admin boundary review
3. allowlist serializer test
4. redaction/minimization test
5. safe error test
6. cache/freshness test
7. server-side kill-switch test
8. no raw path/log/output/session/config verification
9. local-only or staging-only run plan
10. explicit approval for any runtime, server, gateway, cron, database, environment, or production setting change

## Scanned dummy policy example

The following JSON block is scanned by the Phase 4B verifier. It must remain dummy-only and disabled.

<!-- work-console-phase4b-policy-scan:start -->
```json
{
  "apiVersion": "work-console-snapshot.v1",
  "audience": "admin-internal",
  "collectorState": "disabled",
  "sourceMode": "server-snapshot-disabled",
  "cacheState": "disabled",
  "generatedAt": "2026-07-15T00:00:00.000Z",
  "staleAfter": "2026-07-15T00:02:00.000Z",
  "expiresAt": "2026-07-15T00:10:00.000Z",
  "readOnly": true,
  "liveReadEnabled": false,
  "productionLiveApproved": false,
  "serverCollectorApproved": false,
  "privateIdsRedacted": true,
  "rawLogsIncluded": false,
  "rawRuntimeOutputIncluded": false,
  "endpointPolicy": {
    "routeImplemented": false,
    "adminOnly": true,
    "publicAccess": false,
    "cacheHeader": "no-store",
    "authBoundary": "admin-session-or-internal-relay"
  },
  "freshnessPolicy": {
    "maxFreshAgeSeconds": 120,
    "maxStaleFallbackSeconds": 600,
    "allowStaleFallback": true,
    "allowSharedCache": false
  },
  "killSwitch": {
    "state": "forced_disabled",
    "serverSideRequired": true,
    "clientFallbackOnly": true,
    "safeMessage": "Collector remains disabled until a separate local or staging approval is granted."
  },
  "safeComponents": [
    {
      "componentRef": "demo-component-a",
      "kind": "system-check",
      "status": "disabled",
      "safeMessage": "Phase 4B design fixture only. No runtime source is connected.",
      "countBucket": "0",
      "issueCode": "COLLECTOR_DISABLED"
    }
  ],
  "errors": [
    {
      "code": "WORK_CONSOLE_COLLECTOR_DISABLED",
      "safeMessage": "Server collector is not implemented or approved in this phase.",
      "retryable": false,
      "severity": "info",
      "opaqueCorrelationRef": "demo-correlation-b"
    }
  ],
  "approvalGates": [
    {
      "id": "local-staging-spike-approval",
      "label": "Local or staging spike approval",
      "status": "pending",
      "requiredForPhase": "3E-local-staging-spike",
      "note": "Required before any runtime source is connected."
    }
  ]
}
```
<!-- work-console-phase4b-policy-scan:end -->

## Completion definition

This phase is complete when design docs define the collector boundary, TypeScript contract candidates exist without enabling live read, a dummy policy fixture exists, the verifier rejects raw-looking or public/live-looking browser policy payloads, current build gates pass, and checker confirms the work is still design-only.

Completion does not mean production live Work Console is ready.
