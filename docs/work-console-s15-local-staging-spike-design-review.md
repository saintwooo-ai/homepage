# Work Console S15 — Local/Staging Read-only Spike Design Review

Date: 2026-07-15
Status: design-review-only; fixture-only; no live server/API/runtime connection

## Decision

S15 locks the local-only safe scope before any local or staging read-only spike can begin. It does **not** approve the spike execution itself.

The safe interpretation is:

```text
S15 = design review + scope lock + fixture/verifier guardrail
S15 ≠ server collector implementation
S15 ≠ API route implementation
S15 ≠ local runtime source read
S15 ≠ staging runtime source read
S15 ≠ production live connection approval
```

## Local-only safe scope

Allowed in S15:

- documentation that clarifies the local/staging spike boundary
- checked-in fixture-only contracts
- scanned JSON blocks that mirror TypeScript fixtures
- verifier-only guardrails
- dummy/sanitized source categories
- build gate integration

The browser Work Console must remain fixture-only. The UI must not gain fetch, WebSocket, EventSource, Supabase, server route, environment flag, or runtime source selection behavior as part of S15.

## Deferred scope

The following remains unapproved after S15:

- server collector implementation
- API route implementation
- local runtime source read
- staging runtime source read
- production live data connection
- environment, secret, credential, or Vercel env access
- filesystem/profile path read
- gateway log read
- scheduler output read
- session/database read
- VPS, Docker, gateway, cron, or server restart

Stage 4 staging candidate review still requires a separate future approval, server sign-off, and checker review.

## Stop conditions

Stop immediately if the next step requires a real source, route, collector, environment value, secret, credential, raw output, raw log, private path, private identifier, stack trace, staging source, production source, or language that treats a verifier pass as live approval.

## Scanned S15 scope decision

The following JSON block is scanned by `npm run verify:work-console-local-spike-scope`. It must remain a full mirror of `WORK_CONSOLE_LOCAL_SPIKE_SCOPE_FIXTURE`.

<!-- work-console-local-spike-scope:start -->
```json
{
  "contractVersion": "work-console-local-spike-scope.v1",
  "scope": "s15-local-only-design-review",
  "fixtureOnly": true,
  "dummyOnly": true,
  "readOnly": true,
  "liveReadEnabled": false,
  "routeImplemented": false,
  "serverCollectorImplemented": false,
  "apiRouteImplemented": false,
  "stagingRuntimeSourceApproved": false,
  "productionLiveApproved": false,
  "envSecretAccessApproved": false,
  "filesystemReadApproved": false,
  "gatewayReadApproved": false,
  "schedulerReadApproved": false,
  "sessionDatabaseReadApproved": false,
  "requiresSeparateStage4Approval": true,
  "requiresSeparateProductionApproval": true,
  "verifierPassDoesNotApproveLiveConnection": true,
  "allowedS15Work": [
    "docs-only-scope-lock",
    "fixture-only-contract",
    "scanned-json-deep-equality",
    "verifier-only-guardrails",
    "dummy-sanitized-source-categories",
    "build-gate-integration"
  ],
  "deferredWork": [
    "server-collector-implementation",
    "api-route-implementation",
    "local-runtime-source-read",
    "staging-runtime-source-read",
    "production-live-data-connection",
    "env-secret-access",
    "filesystem-profile-read",
    "gateway-log-read",
    "scheduler-output-read",
    "session-database-read",
    "vps-docker-gateway-cron-restart"
  ],
  "stopConditions": [
    "stop-if-real-source-access-is-needed",
    "stop-if-api-route-or-collector-code-is-needed",
    "stop-if-env-secret-or-credential-access-is-needed",
    "stop-if-raw-output-log-path-id-or-stack-is-needed",
    "stop-if-staging-or-production-live-source-is-implied",
    "stop-if-verifier-pass-is-described-as-live-approval"
  ],
  "nextGoal": "s16-stage1-dummy-approval-packet"
}
```
<!-- work-console-local-spike-scope:end -->

## Verification

```bash
npm run verify:work-console-local-spike-scope
npm run verify:work-console-server-collector-readiness
npm run verify:work-console-source-boundary
npm run verify:work-console-dummy-serializer
npm run lint
npm run build
```

Passing this verifier only means the S15 local-only scope lock, fixture, and documentation are consistent. It does **not** approve a server collector, API route, local runtime source read, staging source read, or production live data connection.

## Recommended next goal

S16 should be: Stage 1 dummy-only approval packet and evidence harness. It should still avoid live source access, API route implementation, server collector implementation, environment/secret access, and server restarts.
