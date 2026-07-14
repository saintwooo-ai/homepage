# Work Console Phase 3C-1 fixture-only cron policy

Phase 3C-1 keeps Work Console cron summaries fixture-only. It does not add a live cron reader and must not read operational cron output, jobs metadata, env files, auth files, gateway config, databases, sessions, or profile runtime directories.

## Implemented policy surface

- `WorkConsoleJobRunSummary` now carries policy metadata:
  - `visibility`: `visible` or `hidden`
  - `domainPolicy`: `allowed`, `denied`, or `unknown`
  - `ownerPolicy`: `allowed`, `denied`, or `unknown`
  - `policyReasons`: deterministic reason strings for fixture tests and UI badges
- `cronMetadataSanitizer` sanitizes fixture-provided job metadata before summaries are built.
- `cronDomainPolicy` hides unknown domains by default and hides sensitive domains by default.
- `cronOwnerPolicy` hides unknown owners by default.
- `buildSafeCronDigest` creates a fixed-template summary from counts and risk flags only. It intentionally does not copy raw cron output lines into `safeSummary`.
- Timestamp fields are validated and normalized before summary construction. Only parseable timestamp values are emitted, and emitted values are normalized with `toISOString()` rather than passing raw fixture strings through. Invalid or sensitive timestamp strings are omitted.
- Hidden rows receive field-level suppression: semantic metadata, timestamps, output counts/sizes, and generated summaries are replaced with fixed safe placeholders or zero values.
- `latestOutputSizeBytes` is measured with `TextEncoder` byte length, not JavaScript string character length.

## Fixture-only rule

The only approved Phase 3C-1 input is caller-provided fixture data. `summarizeCronJobOutputFixture` treats any `sourcePathKind` other than `fixture` as hidden and adds `non_fixture_source_hidden` to `policyReasons`; the returned `sourcePathKind` preserves the caller-provided kind only as a guard signal, not as approval to display the row. Any future real filesystem reader must call `buildSafeCronDigest` for `safeSummary` construction and must pass metadata through `sanitizeCronMetadata` before policy evaluation.

A future live reader is out of scope for this phase and requires separate approval/design. Do not add filesystem/path imports or read operational cron output in this phase.

## Verification

Run:

```bash
npm run verify:work-console
npm run verify:work-console-policy
npm run lint
npm run build
```

The fixture verification checks hidden sensitive domains, hidden unknown owners, hidden-row field suppression, timestamp leak suppression, fixture-only source guarding, byte-length output sizing, sanitized metadata, fixed-template digest behavior, and snapshot leak patterns.
