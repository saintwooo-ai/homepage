# Work Console Phase 3A — Cron/Job Output Discovery

## Goal

Work Console Phase 3A의 목표는 `cron/job output`이 첫 번째 Hermes read-only 데이터 원천으로 적합한지 조사하고, 실제 연결 전에 데이터 계약·민감정보 차단·완료 조건을 문서화하는 것이다.

Phase 3A는 live dashboard 구현 단계가 아니다. 이번 단계에서는 Hermes DB, API, websocket, gateway, Supabase, Mimir, session DB를 연결하지 않는다.

이 문서는 내부 discovery 기록이다. 실제 job 이름과 도메인 정보가 포함될 수 있으므로 외부 공유, preview UI, fixture seed로 재사용하기 전에는 별도 redaction과 도메인 정책 검토가 필요하다.

## Current baseline

- Phase 1: mock 기반 Work Console UI production 배포 완료.
- Phase 2: `WorkConsoleSnapshot` / source status / adapter boundary / live-disabled adapter production 배포 완료.
- Current production commit: `2a69339 feat: prepare work console data adapter boundary`.
- Current default data path: mock fixture → mock adapter → `getWorkConsoleSnapshot()`.
- Current live path: `liveHermesWorkConsoleAdapter` exists but is intentionally disabled.

## 조사 방식

이번 discovery는 read-only 조회만 수행했다. Phase 3A의 산출물은 적합성 확정이 아니라 안전 구현 전 사전 조사 기록이다.

허용한 것:

- `cronjob list`로 job metadata 확인
- `/opt/data/profiles/router/cron/jobs.json` 존재와 안전한 요약 확인
- `/opt/data/profiles/router/cron/output` 파일 metadata, 크기, 확장자, 최신성, risk pattern 요약 확인

하지 않은 것:

- cron job 실행
- cron 설정 변경
- gateway/server 재시작
- `.env`, secret, auth token 열람
- DB/API/websocket/Supabase/Mimir/session DB 연결
- production push/deploy
- raw output 원문 UI 노출

본문 접근 범위:

- 파일명, 크기, 수정시각, 확장자, job별 grouping을 우선 확인했다.
- 최근/표본 파일에 대해서는 민감 pattern 탐지를 위해 제한된 텍스트 스캔을 수행했다.
- 조사 결과에는 원문 본문을 싣지 않고, header 수준의 redacted preview와 risk flag만 사용했다.
- 앱 코드가 실제 `/opt/data/...` 경로를 import/read하도록 연결하지 않았다.
- 향후 reader 구현 전까지 Work Console 앱/서버/API에서 실제 cron output 경로를 읽는 것은 금지한다.

## 발견된 후보 위치

| 후보 | 상태 | Phase 3A 판단 |
| --- | --- | --- |
| `/opt/data/profiles/router/cron/jobs.json` | 존재 | job metadata source 후보. job id/name/schedule/state/last status 정도만 allowlist 필요 |
| `/opt/data/profiles/router/cron/output` | 존재 | output summary source 후보. raw body 직접 노출 금지 |
| `/opt/data/profiles/router/cron/output/<job_id>/*.md` | 존재 | scheduler가 job별 markdown 결과물을 저장하는 구조로 보임 |
| `/opt/data/profiles/router/cron/output/*.txt` | 일부 존재 | legacy flat output으로 보임. 호환 처리 필요 |
| `/opt/data/profiles/router/logs` | 존재 | 일반 gateway/agent log라 Phase 3A 첫 원천에서 제외 |
| `/opt/data/jobs` | 없음 | 후보 아님 |

## 관측 요약

조사 시점 기준 관측값:

- `jobs.json`: 존재, job 7개 확인
- `cron/output`: 파일 168개 확인
- 확장자: `.md` 163개, `.txt` 5개
- 파일 크기: 최소 188 bytes, 중앙값 약 5.9 KB, 최대 약 22 KB
- 보존 분포: 최신은 당일, 중앙값 약 6.56일, 최대 약 26.57일 전
- 포맷: 대다수는 `# Cron Job:` header를 가진 markdown 형태
- output grouping: 최신 scheduler output은 `output/<job_id>/YYYY-MM-DD_HH-MM-SS.md` 형태로 저장됨
- 일부 과거 output은 `output/<job_id>_YYYYMMDD_HHMMSS.txt` 형태로 남아 있음

## 현재 job metadata 요약

`cronjob list`와 `jobs.json` 기준으로 다음 job들이 확인됐다.

| job id | 이름 | 상태 | Phase 3A 표시 가능성 |
| --- | --- | --- | --- |
| `76f26b4c9be2` | 매일 08시 장전 핵심 보고서 | paused | 생활 영역 이관/중복 방지 사유가 있어 표시 시 owner/paused reason 주의 |
| `38aa1a9a59cd` | 매일 16시20분 한국장 마감 보고서 | paused | 생활 영역 이관/중복 방지 사유가 있어 표시 시 owner/paused reason 주의 |
| `e77621e9f2ec` | 매일 22시 미국장 프리뷰 보고서 | paused | 생활 영역 이관/중복 방지 사유가 있어 표시 시 owner/paused reason 주의 |
| `6ce401562ed0` | 강남권 청약 액션 체크 알림 | paused | 생활 영역 이관/중복 방지 사유가 있어 표시 시 owner/paused reason 주의 |
| `9309a75510f6` | 뉴스레터 일일 요약 리포트 | scheduled | 업무/광고 지식화 계열로 Work Console 표시 후보 |
| `68955ece0960` | Weekly Obsidian insight review | scheduled | 업무/Obsidian 계열로 Work Console 표시 후보 |
| `146066d55407` | 업무대장 게이트웨이 재연결 ai-home 알림 | scheduled | watchdog성 job. output 빈도 높으므로 집계/축약 필요 |

## 민감정보/노출 리스크

`cron/output`은 첫 원천 후보로 검토 가능하지만 raw output을 그대로 Work Console에 노출하면 안 된다. 또한 output body뿐 아니라 job metadata 자체도 민감할 수 있다.

관측된 risk pattern:

- local path/env term: `/opt/data`, `/Users`, `.hermes`, `profiles/`, `.env` 등 경로성 문자열 가능
- platform routing term: Discord/Telegram/channel/thread/chat id 관련 단어 가능
- long numeric id: Discord snowflake 등 긴 숫자 id 가능
- secret-like keyword: token, secret, bearer, authorization, password, oauth 등 키워드 가능
- webhook URL, JWT/session cookie, email/phone, account/user name, URL query token/code/key, 외부 서비스 응답 원문, 개인 금융/부동산/법률 관련 job title/summary 가능성

중요: `secret-like keyword`는 실제 secret이 있다는 확정이 아니라, 원문 로그/보고서에 관련 단어가 포함될 수 있다는 risk signal이다. 그래도 UI 노출 전 redaction 대상이다.

## 표시 가능 필드 allowlist

Work Console Phase 3A/3B에서 안전하게 노출 가능한 후보 필드:

```ts
interface WorkConsoleJobRunSummary {
  jobId: string;
  jobName: string;
  jobState: 'scheduled' | 'paused' | 'disabled' | 'unknown';
  enabled: boolean;
  scheduleLabel: string;
  lastRunAt?: string;
  nextRunAt?: string;
  lastStatus?: 'ok' | 'error' | 'unknown';
  latestOutputAt?: string;
  latestOutputSizeBytes?: number;
  outputCount?: number;
  freshness: 'fresh' | 'stale' | 'missing' | 'unknown';
  safeSummary: string;
  riskFlags: string[];
  sourcePathKind: 'cron_jobs_json' | 'cron_output_dir' | 'legacy_flat_output';
}
```

권장 표시 원칙:

- job id/name/status/schedule/last run/next run/output count 정도만 우선 표시
- 단, job id/name/schedule/paused reason도 owner/domain filter를 통과한 뒤에만 표시
- output body는 표시하지 않음
- 표시하더라도 `safeSummary` 1~2줄만 허용. `safeSummary`는 raw line copy가 아니라 redaction 이후 생성하며, 위험 판단 불가 시 빈 문자열 또는 상태값만 표시
- stale/missing/error 상태를 명확히 표시
- 생활 영역 cron은 Work Console에 표시하더라도 owner가 life-router 이관 대상임을 표시

`riskFlags`는 Phase 3B 구현 시 `local_path`, `platform_id`, `secret_like_keyword`, `long_numeric_id`뿐 아니라 `webhook`, `jwt`, `email`, `phone`, `query_token`, `account_name`, `personal_domain` 등으로 확장될 수 있으므로 초기 contract에서는 좁은 enum보다 일반화된 string list가 안전하다.

## 금지 필드 denylist

다음은 Work Console UI payload에 넣지 않는다.

- raw output 전체 본문
- raw stack trace
- raw error 객체
- `.env` 내용 또는 환경변수 값
- token/secret/password/bearer/authorization 값
- API 응답 원문
- Discord/Telegram raw id, channel id, thread id, guild id
- 사용자 발화 원문 전체
- absolute local path 전체
- service role key, publishable key, anon key 등 key-like 문자열
- DB connection string
- webhook URL
- JWT/session cookie
- email/phone/account/user name
- URL query parameter의 token/code/key
- 개인 금융/부동산/법률 관련 원문 job summary

## redaction/sanitizer 기준

Phase 3B 이상에서 reader를 만든다면 모든 output은 아래 순서를 거친다.

1. read-only metadata read
2. raw text length limit 적용
3. deny pattern redaction
4. path/id/token masking
5. line count limit 적용
6. safeSummary 생성
7. `WorkConsoleJobRunSummary`로 normalize
8. SourceStatus에 freshness/risk/degraded 상태 반영

권장 masking:

- secret/token 계열: `[REDACTED_SECRET]`
- 긴 숫자 id: `[REDACTED_ID]`
- local absolute path: `[REDACTED_PATH]`
- channel/thread/chat/guild id: `[REDACTED_PLATFORM_ID]`
- 긴 본문: `[TRUNCATED]`

## SourceStatus 확장 제안

Phase 2의 `WorkConsoleSourceStatus`는 다음 필드를 갖고 있다.

- kind
- connectionState
- readOnly
- liveDisabled
- label
- message
- safetyNotes
- checkedAt

Phase 3A 이후 확장 후보:

```ts
type WorkConsoleSourceMode = 'fixture' | 'live-readonly-disabled' | 'local-readonly-discovery';
type WorkConsoleSourceFreshness = 'fresh' | 'stale' | 'missing' | 'unknown';
type WorkConsoleSourceState = 'ok' | 'degraded' | 'unavailable' | 'disabled' | 'error';

interface WorkConsoleSourceStatusV2 {
  kind: WorkConsoleSourceKind;
  mode: WorkConsoleSourceMode;
  state: WorkConsoleSourceState;
  freshness: WorkConsoleSourceFreshness;
  readOnly: true;
  liveDisabled: boolean;
  label: string;
  safeMessage: string;
  safetyNotes: string[];
  checkedAt: string;
  itemCount?: number;
  riskFlags?: string[];
}
```

주의:

- `safeMessage`만 UI에 표시한다.
- raw error/message/path는 SourceStatus에 넣지 않는다.
- live 연결 성공처럼 보이는 `ready` 표현은 피한다.

## Phase 3A 판단

cron/job output은 첫 read-only 원천으로 확정된 것이 아니라, Phase 3B에서 더 검증할 조건부 후보로 유지한다.

조건부 후보로 유지하는 이유:

- 이미 scheduler metadata와 output 저장소가 존재한다.
- Work Console의 “최근 작업 상태” 목적과 잘 맞는다.
- output을 읽지 않고도 metadata 기반 상태 카드 후보를 설계할 수 있다. 다만 실제 사용자 가치와 도메인 노출 정책은 별도 검증이 필요하다.
- live DB/API/websocket/gateway보다 운영 리스크가 낮다.

조건:

- raw output 본문을 그대로 표시하지 않는다.
- metadata + safe summary 중심으로 시작한다.
- redactor/sanitizer 없이는 output body를 UI payload에 넣지 않는다.
- `safeSummary`는 raw line copy가 아니라 redaction 이후 생성한다.
- redaction 실패 또는 위험 판단 불가 시 `safeSummary`는 빈 문자열 또는 상태값만 표시한다.
- job id/name/schedule/paused reason도 무조건 공개 가능 필드가 아니며, owner/domain filter를 통과해야 한다.
- production default는 계속 mock fixture로 둔다.
- 실제 local read-only reader 활성화는 별도 승인 후 진행한다.

확인된 사실 / 추정 / 추가 검증 필요:

| 구분 | 내용 |
| --- | --- |
| 확인된 사실 | `jobs.json`과 `cron/output`이 존재하고, job metadata와 markdown/txt output 파일이 있다 |
| 확인된 사실 | output에는 local path, platform routing term, long numeric id, secret-like keyword 같은 risk signal이 일부 관측된다 |
| 추정 | `output/<job_id>/YYYY-MM-DD_HH-MM-SS.md`는 최신 scheduler 저장 구조로 보인다 |
| 추정 | `output/<job_id>_YYYYMMDD_HHMMSS.txt`는 legacy flat output으로 보인다 |
| 추가 검증 필요 | 실제 보존 정책, output 생성 규칙, job owner/domain policy, safeSummary 사용자 가치 |

## Phase 3A 완료 기준

Phase 3A는 아래를 만족하면 완료로 본다.

- cron/job output 후보 위치가 식별됨
- output 포맷과 보존 특성이 요약됨
- 민감정보 risk pattern이 정리됨
- 표시 가능 필드 allowlist와 금지 필드 denylist가 정의됨
- SourceStatus/freshness/safeMessage 확장 방향이 정리됨
- live DB/API/websocket/gateway 연결 없이 완료됨
- checker 검토를 통과함

## Phase 3B 제안

다음 단계는 구현이 아니라도 작은 안전 구현 후보를 둘 수 있다.

추천 Phase 3B Goal:

> fixture 기반 `CronJobOutputReader`와 redactor/sanitizer 테스트를 추가해, 실제 cron output을 읽기 전에 safe summary 변환 규칙을 검증한다.

Phase 3B에서 여전히 금지:

- production cron output live read 활성화
- 실제 cron output 파일을 앱/서버/API에서 읽기
- server/gateway restart
- env/secret 접근
- DB/API/websocket 연결
- production deploy
- preview deploy에서 실제 cron data 노출
- 실제 사용자 데이터 fixture 또는 실 output을 테스트 fixture에 넣기

별도 승인 후 가능한 것:

- 테스트 fixture 추가
- redaction utility 추가
- `WorkConsoleJobRunSummary` 타입 추가
- mock snapshot에 job run summary 섹션 추가
- lint/build/test 실행

주의: Phase 3B에서 mock snapshot에 job summary를 추가하더라도 실제 job 이름/생활 영역 job을 그대로 fixture로 쓰기 전에 도메인 정책 승인이 필요하다.

## Server 인계 조건

아래 중 하나라도 필요해지면 dev-builder가 아니라 server에게 인계한다.

- production filesystem read path를 앱/API에서 접근해야 함
- Docker volume mount 또는 권한 조정 필요
- gateway event log 또는 websocket 연결 필요
- Vercel env 추가/수정 필요
- Supabase/Mimir/session DB credential 필요
- cron output을 외부 API로 노출해야 함
- 운영 재시작/배포/로그 검증 필요

server 인계 전 dev-builder가 하지 말아야 할 일:

- production filesystem path를 앱 코드에 직접 연결
- Docker volume/권한/소유자 변경
- Vercel env 추가 또는 수정
- gateway/websocket/API endpoint 임시 연결
- 실제 cron output을 preview/production UI payload에 포함

