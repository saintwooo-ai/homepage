# Work Console Phase 2 Data Boundary

## Phase 2 목표

Work Console Phase 2는 mock-only UI를 `WorkConsoleSnapshot` 기반 구조로 전환해 향후 Hermes read-only 연결을 준비한다. 단, 이번 단계에서는 실제 Hermes 연결을 절대 수행하지 않는다.

## 허용 범위

- `WorkConsoleSnapshot`, `WorkConsoleSourceStatus`, `WorkConsoleDataAdapter` 타입 정의
- mock fixture와 mock adapter 제공
- `liveHermesWorkConsoleAdapter` 이름의 disabled adapter 제공
- React 컴포넌트가 mock 파일을 직접 import하지 않고 snapshot props를 통해 데이터 소비
- 화면 상단 Source Status 카드에 다음 문구를 명시
  - read-only
  - live disabled
  - no Hermes DB/API/websocket/gateway call
- 기존 `src/data/mockWorkConsole.ts`는 호환 re-export만 유지
- 앱 기본 경로는 `getWorkConsoleSnapshot(mockWorkConsoleAdapter)`를 통해 snapshot을 받는다

## 금지 범위

Phase 2에서는 아래 작업을 금지한다.

- `.env*`, secret, auth, token 파일 읽기/수정
- Hermes session DB import/read/write
- Hermes API, gateway, websocket, fetch 연결
- DB migration/write 또는 Supabase write
- server/gateway/Vercel 설정 변경
- Docker/systemd/server/gateway 재시작
- 배포, main push, 운영 로그 검증

## disabled live adapter 원칙

`liveHermesWorkConsoleAdapter`는 실제 연결 준비용 타입 경계만 제공한다. 이 adapter는 다음만 수행한다.

- `mode: 'live-disabled'` summary 반환
- `connectionState: 'not_configured'` source status 반환
- 빈 `workItems`, `profileStates`, `events`, `agentFlow` 반환
- env/db/network/fetch/websocket/gateway/session 모듈 import 금지
- 앱 기본 경로에서는 live adapter를 선택하지 않는다

## SourceStatus 상태값 의미

- `fixture_ready`: mock fixture가 타입에 맞게 준비됐다는 뜻이다. live Hermes 연결 준비 완료나 실제 연결 성공을 뜻하지 않는다.
- `disabled`: live 연결을 의도적으로 막아둔 상태다.
- `not_configured`: live 연결 설정이 없고 연결 시도도 하지 않는 상태다.

Kanban의 승인 버튼은 브라우저 안에서 표시만 바꾸는 데모 동작이다. 실제 승인, Kanban 변경, API 호출, DB write를 수행하지 않는다.

## Phase 3 승인 게이트

실제 Hermes read-only 연결은 Phase 3에서 별도 승인 후에만 가능하다. 승인 전 반드시 아래가 확정되어야 한다.

1. 연결 대상 원천: session DB, API, gateway, websocket 중 무엇을 읽을지 명시
2. 인증/권한 방식: secret 파일 직접 참조 없이 안전하게 제공되는 방식 명시
3. read-only 보장: 쓰기, migration, 상태 변경, 승인 처리 호출이 불가능함을 검증
4. 운영 담당 인계: server/gateway/VPS/배포/로그 검증 필요 시 server 담당으로 분리
5. 실패 모드: 연결 실패 시 disabled/empty snapshot으로 안전하게 degrade
6. 테스트 게이트: lint/build와 mock fallback, no-write/no-network 검증 추가

Phase 3 승인 전까지 Work Console은 mock fixture 또는 disabled empty snapshot만 표시한다.
