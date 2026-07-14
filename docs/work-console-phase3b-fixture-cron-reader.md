# Work Console Phase 3B — Fixture Cron Reader Verification

## Goal

Phase 3B의 목표는 실제 cron output을 읽기 전에, in-memory fixture 기반 `CronJobOutputReader`와 redactor/sanitizer를 추가해 `safeSummary` 변환 규칙을 검증하는 것이다.

## Scope

허용:

- Work Console job summary 타입 추가
- in-memory fixture input을 summary로 변환하는 reader 추가
- token/path/platform id/email/phone/webhook 등 민감 문자열 redaction utility 추가
- fixture-only verification script 추가
- `npm run verify:work-console`, `npm run lint`, `npm run build`로 검증

금지:

- 실제 `/opt/data/profiles/router/cron/output` 읽기
- 앱 코드에서 `/opt/data/profiles/**` 탐색/접근
- `.env`, auth, token, secret 파일 열람
- DB/API/websocket/gateway/Supabase/Mimir/session DB 연결
- cron job 실행 또는 cron 설정 변경
- server/gateway restart
- commit/push/deploy
- 실제 운영 output을 fixture로 복사
- redaction 전 원문을 UI-facing 구조에 저장

## Added contract surface

`src/types/workConsole.ts`에 fixture-only 검증용 타입을 추가했다.

- `WorkConsoleJobOutputFixture`
- `WorkConsoleJobRunSummary`
- `WorkConsoleJobRunState`
- `WorkConsoleJobRunStatus`
- `WorkConsoleSourceFreshness`
- `WorkConsoleJobSourcePathKind`

`riskFlags`는 `string[]`로 둔다. Phase 3A checker가 지적한 것처럼 denylist는 계속 늘어날 수 있으므로 좁은 enum으로 고정하지 않는다.

## Added fixture-only modules

- `src/data/work-console/cronOutputSanitizer.ts`
  - caller-provided text를 deterministic하게 redaction한다.
  - `fs`, env, DB, fetch, websocket, gateway, session module을 import하지 않는다.

- `src/data/work-console/cronJobOutputReader.ts`
  - `WorkConsoleJobOutputFixture` 배열을 `WorkConsoleJobRunSummary`로 변환한다.
  - 실제 파일을 읽지 않는다.
  - freshness는 fixture의 `outputCreatedAt`과 테스트용 `now` 값으로 계산한다.

## Verification script

- `scripts/verify-work-console-cron-fixtures.ts`
  - 실제 cron output이 아니라 in-memory fixture만 사용한다.
  - secret/path/email/platform id/webhook dummy 값을 넣고 safe summary에 남지 않는지 확인한다.
  - fresh/stale/missing 상태 계산을 확인한다.

실행 명령:

```bash
npm run verify:work-console
npm run lint
npm run build
```

## Phase 3B result boundary

Phase 3B 통과는 다음을 의미한다.

- fixture input → safe summary output 변환 규칙이 검증됨
- redaction 대상 문자열이 safe summary에 남지 않는지 검증됨
- Work Console job summary contract 후보가 생김

주의: Phase 3B의 `jobId`, `jobName`, `scheduleLabel`은 fixture용 dummy metadata만 허용한다. 실제 cron metadata는 `safeSummary`와 별개로 민감할 수 있으므로 Phase 3C에서 별도 metadata sanitizer/domain filter/owner policy를 통과해야 한다.

Phase 3B 통과가 의미하지 않는 것:

- 실제 cron output live read 준비 완료
- 실제 Hermes cron/job source 연결 완료
- production/preview UI에 cron data 노출 가능
- server/gateway/env/DB/API/websocket 연결 승인

## Next gate

실제 cron output을 읽는 Phase 3C로 넘어가려면 별도 승인이 필요하다.

Phase 3C 승인 전 확인할 것:

1. 읽을 source path allowlist
2. server 인계 필요 여부
3. 실제 output의 redaction 적용 방식
4. preview/production 노출 금지 또는 허용 정책
5. 생활/투자/부동산 job의 domain visibility policy
