# Work Console Phase 4B — Local/Staging Spike Plan

Date: 2026-07-15
Status: plan-only; disposable spike candidate; no server work executed

## Plain-language summary

This plan says how to test the future Work Console server collector safely later. It does not start that test now and does not connect to live Hermes data now.

## Spike objective

Validate that a future server-owned collector can produce a sanitized read-only snapshot while failing closed when collection is disabled, blocked, stale, or unavailable.

## Non-goals

The spike must not modify VPS, Docker, gateway, cron, database, environment, or Vercel production settings; read production runtime sources; expose raw logs, paths, command output, prompts, sessions, or private identifiers; become a permanent API route without follow-up review; or use browser-side flags as the only safety gate.

## Proposed spike stages

### Stage 1 — Local dummy collector

- Input: dummy in-memory observations only
- Output: sanitized snapshot envelope
- Required proof: serializer drops unknown/raw fields and returns only allowlisted fields

Success criteria: no production dependency, no filesystem/runtime read, and dummy snapshot validates against the Phase 4B policy verifier.

Stop criteria: any real operational source is needed, any secret/environment value is required, or any browser payload contains raw-like fields.

### Stage 2 — Safe error and cache behavior

- Input: dummy success, dummy timeout, dummy unavailable, dummy partial states
- Output: fresh, stale, fallback, disabled, and unavailable responses
- Required proof: raw failure details never leave the server boundary

Success criteria: no-store policy represented, stale fallback clearly labeled, and unavailable state does not pretend to be healthy.

### Stage 3 — Admin boundary mock

- Input: mock admin/internal boundary decision only
- Output: blocked or safe snapshot response
- Required proof: public access state fails closed

Success criteria: public access is false, admin-only is required, and route remains unimplemented unless separately approved.

### Stage 4 — Staging candidate review

This stage requires a new approval before any staging runtime source is touched.

Required review packet:

- exact source list
- exact route boundary
- read-only permission evidence
- redaction test results
- cache/kill-switch test results
- rollback/disable plan
- server owner sign-off
- checker risk review

## Handoff to server profile

Only after approval, the server profile should receive the allowed source list, forbidden source list, minimal read-only permission needs, safe serializer contract, endpoint/cache/kill-switch rules, local/staging test commands, and rollback/disable instructions.

## Final approval gate before production

Production enablement remains a separate future phase. It requires local spike pass, staging spike pass or explicit staging waiver, server read-only permission proof, admin-only route proof, safe serializer proof, kill-switch proof, cache/no-store proof, dist/source leak scan, checker final review, and explicit user approval for production connection.

## Current state after this plan

```text
live read: disabled
server collector: not implemented
production connection: not approved
browser source: fixture/default or disabled snapshot only
```
