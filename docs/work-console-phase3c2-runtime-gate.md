# Work Console Phase 3C-2 — Server/Runtime Gate Design

Date: 2026-07-15
Status: design gate only

## Scope

Phase 3C-2 is a design and approval-gate phase before any real cron read-only connection.

It does **not** read real Hermes cron output, `jobs.json`, server logs, session DB, environment files, or gateway state. It does **not** change server, gateway, cron, database, Vercel, or production runtime settings.

## Baseline

Phase 3C-1 completed and deployed fixture-only Work Console policy guards:

- metadata sanitizer
- domain policy
- owner policy
- safe digest builder
- hidden row suppression
- timestamp normalization
- fixture-only verification

Phase 3C-1 means the mock/fixture surface is hardened. It does **not** mean live cron data is safe to expose.

## Core principle

Read-only lowers mutation risk only. It does not remove exposure, privacy, cache, log, frontend bundle, authorization, or brand risk.

The next live-read phase must answer this first:

> Which cron-derived fields can be shown, to which user, under which runtime mode, through which serializer, cache, log, and frontend boundary?

Until that is answered field-by-field, live cron read must remain disabled.

## Recommended architecture

```text
Work Console UI
  ↓ safe DTO only
WorkConsoleDataService
  ↓ adapter factory only
createWorkConsoleAdapter(config)
  ├─ FixtureWorkConsoleAdapter          default
  └─ LocalCronReadOnlyAdapter           future, disabled by default
       ↓
server-side serializer / sanitizer only
       ↓
cron-derived read model or sanitized summary
```

Rules:

1. UI must not import cron readers, filesystem modules, env readers, gateway clients, or raw cron schemas.
2. Adapter selection must happen in one factory/gate path.
3. Fixture remains the default source.
4. Local cron read-only adapter must not be constructed unless every runtime gate condition passes.
5. Unknown source or partial config must fail closed.
6. Browser bundle must receive only sanitized DTOs.

## Runtime gate conditions

A future `local-cron-readonly` adapter may be enabled only if all of these pass:

1. Explicit user approval exists for the phase.
   - Approval must be traceable to a concrete artifact such as a Discord message, issue, PR comment, changelog entry, or signed-off report.
   - The artifact must name the approved scope: design-only, fixture-only gate implementation, local read-only spike, or production enablement.
   - A design approval must never be inferred as live-read approval.
2. Server read-only boundary has been verified.
   - Process user and group are known.
   - Runtime account has no write access to the cron source.
   - Adapter exposes no write, delete, update, run-now, pause, resume, or schedule mutation method.
   - Tests or probes show no filesystem write APIs are called.
   - Network is disabled for the local reader path.
   - Allowed base path, realpath, and symlink traversal checks pass.
   - Verification evidence is recorded without printing raw cron payloads or secrets.
3. Runtime source is explicitly set to `local-cron-readonly`.
4. Feature flag is explicitly true; missing/unknown values are false.
5. Runtime is not production/public unless a later production gate has separately passed.
6. Read-only capability is true.
7. Write capability is false.
8. Network capability is false for the local reader path.
9. Allowed base path is explicitly configured server-side.
10. Requested paths cannot escape the allowed base path.
11. Symlink/path traversal protections are verified.
12. Domain policy passes.
13. Owner policy passes.
14. Metadata sanitizer passes.
15. Raw output body is omitted from all UI/API DTOs.
16. Error payload normalization strips paths, stack traces, env names, and raw data.
17. Cache policy is no-store or otherwise private and role-safe.
18. Logs/analytics exclude raw cron payloads and job metadata beyond safe aggregates.
19. Build artifacts and source maps contain no real cron paths or sensitive fixture strings.
20. Kill switch and rollback path have been tested.

Failure of any condition must produce one of:

- fixture fallback,
- empty/degraded state,
- safe blocked error.

It must never produce best-effort raw display.

If fixture fallback is used after a live-read attempt is blocked, the UI must clearly label the state as `fixture/demo`, `degraded`, or `live disabled`. Fallback must never make fixture data look like current live cron state.

## Field policy

### Allowed candidate fields after server-side serialization

These are candidates, not automatically public fields:

- aggregate job count
- enabled/paused/error counts
- coarse status
- last checked timestamp
- stale/degraded/fresh state
- output exists yes/no
- sanitized duration bucket
- sanitized source label
- sanitized risk flags

### Fields requiring strict review or default hiding

- job name
- job id
- schedule
- paused reason
- owner/profile
- workdir
- command
- prompt/context
- model/provider
- deliver target
- output path
- latest output body
- stdout/stderr
- stack traces
- channel/thread/chat/guild IDs
- email/phone/account names
- finance/real-estate/health/legal/personal automation summaries

### Never pass to the browser as raw values

- raw `jobs.json`
- raw cron output body
- `.env`/auth/secret values
- API keys or token-like strings
- webhook URLs
- full local absolute paths
- raw error objects
- raw prompt/script/tool output
- internal gateway/session/DB data

## API/cache/log policy

If a server/API route is added in a later phase:

- deny by default
- require authentication/authorization before returning data
- use server-side allowlist serializer
- send `Cache-Control: no-store` unless a private role-safe cache is proven
- disable CDN/edge/shared caching for operational cron-derived responses by default
- disable browser caching for operational cron-derived responses by default
- apply `no-store` to unauthorized, degraded, blocked, and error responses too
- allow server memory cache only for sanitized aggregate data with documented TTL, purge behavior, and role-scoped cache keys
- never log raw cron objects or raw output
- normalize errors before returning or logging
- never include raw stack traces in UI/API payloads
- avoid analytics events containing job/profile/channel identifiers
- show `lastUpdated`, `stale`, and `degraded` state separately

## Frontend bundle policy

The client bundle must not contain:

- filesystem adapter implementation
- real cron base path
- `jobs.json` real path
- Hermes profile cron paths
- server/gateway internal hostnames
- public env flags that expose live path information
- realistic sensitive fixture strings

Build artifact and source-map scans are required before any live-read rollout.

The scan must fail closed if it finds patterns such as:

- `/opt/data`
- `/profiles/` combined with `/cron`
- `jobs.json`
- `cron/output`
- real profile names used as runtime paths
- gateway/internal hostnames
- token-like strings
- realistic fixture secrets
- raw webhook-like URLs
- public env values pointing to live cron infrastructure

## Server handoff checklist for a later approved phase

Do this only after a separate approval:

1. Confirm actual runtime location: Vercel, VPS, Docker container, or local CLI.
2. Confirm process user and read/write permissions.
3. Confirm cron metadata/output candidate paths.
4. Confirm Vercel cannot directly read VPS filesystem.
5. Decide whether to use:
   - VPS internal API,
   - sanitized summary artifact,
   - external read model/storage.
6. Verify path traversal/symlink protections.
7. Verify no raw output body or raw jobs object reaches API responses.
8. Verify logs, browser network, cache headers, and error boundaries.
9. Verify kill switch and rollback.
10. Run checker before deployment.

Server recommendation from the Phase 3C-2 meeting:

> Do not expose raw cron files to the homepage. Prefer a sanitized read model or summary artifact. The Work Console should consume only that sanitized view.

## Approval gates

### Gate A — Data contract approval

Required:

- field allowlist
- field denylist
- privacy class per field
- server-side serializer plan

Blockers:

- sending raw cron object to frontend
- frontend-only filtering
- previewing prompt/output/path/delivery values

### Gate B — Runtime/source gate approval

Required:

- server-side source switching
- local-readonly disabled by default
- production/public default remains fixture or disabled
- fail-closed tests

Blockers:

- client-only feature flag
- env value alone enabling live read
- preview/staging accidentally reading real data

### Gate C — Auth/permission approval

Required:

- public/internal route decision
- user/role policy
- unauthorized response policy
- CORS/cache policy

Blockers:

- public unauthenticated cron state
- same payload for all roles
- partial metadata leakage on unauthorized requests

### Gate D — Privacy/logging approval

Required:

- logging allowlist
- raw payload logging ban
- safe error payload schema
- analytics field review

Blockers:

- raw cron object logs
- raw stack traces in UI/API
- analytics carrying job/profile/channel metadata

### Gate E — Frontend/cache/bundle approval

Required:

- no-store/private cache policy
- stale/degraded UI state
- client bundle scan
- source map policy
- public env review

Blockers:

- shared cache for operational data
- fixture/live status ambiguity
- live adapter/path/schema in client bundle

### Gate F — Brand/comms approval

Required:

- external vs internal Work Console decision
- fixture/live/degraded labels
- error/blocked copy
- forbidden claim list

Blockers:

- “real-time operations console complete”
- “read-only so safe”
- “secure cron integration complete” before runtime proof

## Recommended next implementation goal

The next safe code goal is still fixture-only:

> Phase 3C-3: Add a disabled runtime gate contract and verification tests without reading real cron files.

Allowed scope for Phase 3C-3:

- adapter factory contract
- runtime gate pure function
- source selection tests
- safe error payload tests
- dist/source-map forbidden string scan
- docs/checker checklist

Still forbidden:

- actual `/opt/data/profiles/router/cron/output` read
- actual `jobs.json` read
- filesystem reader connected to production
- server/gateway/env/DB/cron changes
- public live endpoint
- raw output body display

## Reporting language

Use:

- “server/runtime gate design completed”
- “live cron read remains disabled”
- “fixture-only guard remains the deployed default”
- “read-only reduces mutation risk, not exposure risk”

Do not use:

- “actual cron connection ready”
- “safe because read-only”
- “real-time operations console complete”
- “cron data is safely displayed”
- “production live data verified”
