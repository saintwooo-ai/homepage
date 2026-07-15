# Work Console S17 — Stage 4 Review Packet Checklist

Date: 2026-07-15
Status: checklist-only; fixture-only; no Stage 4 execution; no live server/API/runtime connection

## Decision

S17 defines the review checklist required before a future Stage 4 local-only read-only spike can be approved. It does **not** approve or execute Stage 4.

The safe interpretation is:

```text
S17 = Stage 4 review packet checklist only
S17 ≠ Stage 4 execution approval
S17 ≠ local runtime source read approval
S17 ≠ staging source read approval
S17 ≠ production live data approval
S17 ≠ API route or server collector implementation
S17 ≠ browser display approval
```

## Required future approvals

A future Stage 4 local-only spike must still have all of these before implementation:

- fresh user approval that explicitly names local-only read-only scope
- server sign-off for exact runtime source boundary
- checker GREEN for raw/private/browser exposure risk
- rollback and kill-switch plan
- separate staging and production approval path

## What remains blocked

The following remains blocked after S17:

- Stage 4 execution
- local runtime source read
- staging source read
- production live data connection
- API route implementation
- server collector implementation
- browser evidence display
- env/secret/filesystem/gateway/scheduler/session/database access
- VPS, Docker, gateway, cron, or server restart

## Scanned S17 review packet

The following JSON block is scanned by `npm run verify:work-console-stage4-review-packet`. It must remain a full mirror of `WORK_CONSOLE_STAGE4_REVIEW_PACKET`.

<!-- work-console-stage4-review-packet:start -->
```json
{
  "contractVersion": "work-console-stage4-review-packet.v1",
  "stage": "s17-stage4-review-packet-checklist",
  "checklistOnly": true,
  "fixtureOnly": true,
  "liveReadEnabled": false,
  "stage4Approved": false,
  "localRuntimeSourceApproved": false,
  "stagingRuntimeSourceApproved": false,
  "productionLiveApproved": false,
  "apiRouteImplemented": false,
  "serverCollectorImplemented": false,
  "browserDisplayApproved": false,
  "envSecretAccessApproved": false,
  "filesystemReadApproved": false,
  "gatewayReadApproved": false,
  "schedulerReadApproved": false,
  "sessionDatabaseReadApproved": false,
  "requiresFreshUserApproval": true,
  "requiresServerSignoff": true,
  "requiresCheckerGreen": true,
  "requiresRollbackPlan": true,
  "requiresKillSwitchPlan": true,
  "gates": [
    {
      "id": "fresh-user-approval",
      "owner": "user",
      "status": "required-not-yet-approved",
      "safeSummary": "Future Stage 4 work needs a fresh approval that explicitly names local-only read-only scope."
    },
    {
      "id": "server-runtime-boundary-signoff",
      "owner": "server",
      "status": "required-not-yet-approved",
      "safeSummary": "Server must sign off the exact source boundary before any runtime source can be read."
    },
    {
      "id": "checker-risk-review",
      "owner": "checker",
      "status": "required-not-yet-approved",
      "safeSummary": "Checker must confirm no raw logs, private paths, private identifiers, secrets, or browser exposure are introduced."
    },
    {
      "id": "rollback-and-kill-switch-plan",
      "owner": "router",
      "status": "required-not-yet-approved",
      "safeSummary": "A disable path and rollback plan must exist before any local-only runtime source read is attempted."
    },
    {
      "id": "staging-and-production-separated",
      "owner": "router",
      "status": "required-not-yet-approved",
      "safeSummary": "Local-only approval must not imply staging or production live data approval."
    }
  ],
  "explicitNonApprovals": [
    "no-stage4-execution-approval",
    "no-local-runtime-source-read-approval",
    "no-staging-source-read-approval",
    "no-production-live-data-approval",
    "no-api-route-implementation-approval",
    "no-server-collector-implementation-approval",
    "no-browser-display-approval",
    "no-env-secret-filesystem-gateway-scheduler-session-database-access-approval",
    "no-vps-docker-gateway-cron-server-restart-approval"
  ],
  "nextGoal": "s18-stage4-local-only-approval-decision-or-dummy-ui-preview"
}
```
<!-- work-console-stage4-review-packet:end -->

## Verification

```bash
npm run verify:work-console-stage4-review-packet
npm run verify:work-console-dummy-approval-evidence
npm run verify:work-console-local-spike-scope
npm run lint
npm run build
```

Passing this verifier only means the S17 checklist, fixture, and documentation are consistent. It does **not** approve Stage 4 execution, local runtime source reads, staging source reads, production live data, API routes, server collectors, browser display, env/secret/filesystem/gateway/scheduler/session/database access, or server restarts.

## Recommended next goal

S18 must stop for a decision if it would change any approval flag from false to true. Safe non-live options remain:

1. strengthen the Stage 4 checklist/verifier further; or
2. create a dummy-only UI preview only if browser display approval is explicitly granted and the preview remains static fixture-only with no fetch/network/live toggle.
