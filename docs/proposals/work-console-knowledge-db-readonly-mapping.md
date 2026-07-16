# Work Console Knowledge DB Read-only Mapping

작성일: 2026-07-16  
상태: 개발 지시/매핑 문서  
범위: **DB read-only 조회 설계**  
금지: DB write/delete/migration/env 변경/server-gateway 재시작

## 1. 결론

사용자가 원하는 Work Console 지식 정리 콘솔은 mock/fixture가 아니라 **Supabase DB의 실제 지식 테이블 값을 읽어서 표시**해야 한다.

따라서 1차 구현 목표는 다음과 같다.

```text
DB read-only 기반 Work Console 지식 정리 콘솔
= 실제 knowledge_items / knowledge_sources / knowledge_review_queue 값을 읽어
  상단 KPI, 필터, 테이블, 상세보기에 표시한다.
```

단, 1차 범위에서는 실제 생성/수정/삭제를 하지 않는다.

---

## 2. 확인된 Supabase 프로젝트

Supabase MCP metadata 기준 확인된 프로젝트:

| 프로젝트 | id/ref | 상태 | 비고 |
|---|---|---|---|
| homepage | `kknqgcbcuilatrvtwuln` | ACTIVE_HEALTHY | 실제 지식 테이블 존재 |
| hermes-status-dashboard | `jeznnilszayfqzkrviix` | ACTIVE_HEALTHY | public tables 없음 |

Work Console 지식 콘솔은 우선 `homepage` 프로젝트의 public schema를 대상으로 한다.

---

## 3. 확인된 실제 DB 테이블

`homepage` 프로젝트 public schema에 다음 지식 테이블이 존재한다.

| 테이블 | row 수 | 용도 |
|---|---:|---|
| `knowledge_sources` | 1 | 원문/자료 source |
| `knowledge_items` | 0 | 지식카드 본체 |
| `knowledge_review_queue` | 0 | 검토 큐 |
| `knowledge_evidence_items` | 0 | 근거 항목 |
| `knowledge_links` | 0 | 지식 간 연결 |
| `knowledge_tags` | 0 | 태그 마스터 |
| `knowledge_item_tags` | 0 | 카드-태그 연결 |
| `knowledge_collections` | 0 | 지식 묶음/컬렉션 |
| `knowledge_collection_items` | 0 | 컬렉션-카드 연결 |
| `knowledge_ai_runs` | 0 | AI 실행 기록 |

주의: 현재 `knowledge_items`가 0행이므로, 지식 테이블 KPI와 목록은 실제로 0으로 나와야 한다. 가짜 row/가짜 숫자를 보여주면 안 된다.

---

## 4. 기존 프론트 상태

홈페이지 레포:

```text
/opt/data/homepage-repo
```

확인된 주요 파일:

```text
src/components/work-console/WorkConsoleView.tsx
src/types/workConsole.ts
src/data/work-console/browser.ts
src/data/work-console/liveHermesWorkConsoleAdapter.ts
src/lib/supabase.ts
src/components/KnowledgeView.tsx
```

중요한 발견:

1. `src/lib/supabase.ts`는 이미 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 기반 Supabase client를 사용한다.
2. `src/components/KnowledgeView.tsx`는 이미 아래 테이블을 실제로 조회한다.
   - `knowledge_review_queue`
   - `knowledge_items`
   - `knowledge_sources`
3. 다만 `KnowledgeView.tsx`에는 source/card 생성 insert 기능도 포함되어 있다.
4. Work Console의 현재 source-boundary verifier는 `src/components/work-console`와 `src/data/work-console` 내부에서 `supabase/createClient/fetch/import.meta.env` 같은 live-source 패턴을 금지한다.

따라서 Work Console 내부에 직접 Supabase client를 넣으면 기존 verifier와 충돌한다.

---

## 5. 추천 구현 원칙

### 5.1 반드시 실제 DB 값을 읽는다

허용:

```text
- knowledge_items 목록 read
- knowledge_sources 목록 read
- knowledge_review_queue 목록 read
- KPI count 계산
- 필터 옵션 계산
- 상세보기 read
```

금지:

```text
- insert
- update
- delete
- migration
- service_role key 사용
- service_role key 브라우저 노출
- RLS 변경
- server/gateway/cron 재시작
```

### 5.2 DB가 비어 있으면 0/빈 상태를 표시한다

현재 `knowledge_items`는 0행이다. 그래서 1차 화면은 다음처럼 보여야 한다.

```text
전체 지식: 0
정리 필요: 0
승인 완료: 0
고등급: 0
삭제 후보: 0

테이블: 아직 지식카드가 없습니다.
```

단, `knowledge_sources`는 1행이 있으므로 source inbox 또는 최근 source 영역을 별도로 보여줄 수 있다.

### 5.3 Work Console은 read-only 전용이어야 한다

기존 `KnowledgeView.tsx`의 쓰기 기능을 Work Console에 그대로 가져오면 안 된다. Work Console 지식 정리 콘솔 1차는 read-only 운영판이다.

---

## 6. 실제 DB 필드 → UI 매핑

### 6.1 상단 KPI 매핑

기준 테이블: `knowledge_items`

| KPI | DB 계산 |
|---|---|
| 전체 지식 | `knowledge_items.count(*)` |
| 정리 필요 | `review_status in ('inbox', 'needs_verification')` 또는 `rfp_use = 'needs_review'` |
| 승인 완료 | `review_status = 'approved'` |
| 고등급 지식 | `reuse_grade in ('S', 'A')` 단, 현재 DB check/default 기준은 A-D이므로 S는 향후 확장 |
| 삭제 후보 | `review_status in ('deprecated', 'rejected')` 또는 `reuse_grade = 'D'` |

현재 실제 데이터 기준 예상:

```text
knowledge_items rows = 0
=> 모든 KPI 0
```

### 6.2 필터 매핑

| UI 필터 | DB 필드 | 현재 컬럼 존재 |
|---|---|---|
| 상태 | `knowledge_items.review_status` | 있음 |
| 등급 | `knowledge_items.reuse_grade` | 있음 |
| 유형 | `knowledge_items.item_type` | 있음 |
| 출처 | `knowledge_sources.source_type`, `publisher`, `title` | 있음 |
| 검색 | `title`, `one_line_summary`, `body`, `category`, `target_audience`, `brand`, `market` | 있음 |
| 생성일 | `knowledge_items.created_at` | 있음 |
| 업데이트일 | `knowledge_items.updated_at` | 있음 |
| 활용 목적 | `knowledge_items.rfp_use` | 있음 |
| 근거 수준 | `knowledge_items.evidence_level` | 있음 |

초기 화면에 노출할 필터는 다음 6개만 권장한다.

```text
상태 / 등급 / 유형 / 출처 / 검색 / 생성일
```

`활용 목적`, `근거 수준`, `카테고리`는 상세 또는 고급 필터로 후순위 배치한다.

### 6.3 테이블 컬럼 매핑

| UI 컬럼 | DB 필드 |
|---|---|
| 지식명 | `knowledge_items.title` + `one_line_summary` |
| 유형 | `knowledge_items.item_type` |
| 상태 | `knowledge_items.review_status` |
| 등급 | `knowledge_items.reuse_grade` |
| 출처 | `knowledge_sources.title` 또는 `source_type/publisher` |
| 생성일 | `knowledge_items.created_at` |
| 정리상황 | `review_status`, `evidence_level`, `rfp_use` 조합 |
| 작업 | 보기 / 정리(disabled or read-only preview) / 삭제(disabled or 삭제 후보 UI only) |

### 6.4 상세 Drawer 매핑

| 상세 항목 | DB 필드 |
|---|---|
| 제목 | `knowledge_items.title` |
| 요약 | `knowledge_items.one_line_summary` |
| 본문/정리 내용 | `knowledge_items.body` |
| 유형 | `item_type` |
| 상태 | `review_status` |
| 등급 | `reuse_grade` |
| 활용 목적 | `rfp_use` |
| 근거 수준 | `evidence_level` |
| 카테고리 | `category` |
| 타깃 | `target_audience` |
| 브랜드 | `brand` |
| 시장 | `market` |
| 리스크 | `risk_flags` |
| 원문 출처 | `knowledge_sources.title`, `url`, `summary`, `publisher` |
| 생성/수정일 | `created_at`, `updated_at` |

추가 상세 데이터:

```text
knowledge_evidence_items where item_id = selected item
knowledge_links where from_item_id/to_item_id = selected item
knowledge_item_tags join knowledge_tags
knowledge_review_queue where item_id = selected item
```

1차에서는 위 추가 테이블이 0행이므로 선택적으로만 표시한다.

---

## 7. 데이터 조회 방식 권장안

### 권장안 A: 기존 Supabase anon + RLS 기반 read-only

현재 앱은 이미 브라우저에서 Supabase anon client를 사용한다.

```text
src/lib/supabase.ts
```

따라서 가장 빠른 구현은 기존 `KnowledgeView.tsx`의 read query를 분리해 Work Console 지식 콘솔에서 read-only로 재사용하는 것이다.

장점:

```text
- 빠름
- 기존 앱 패턴 재사용
- env 추가 없음
- service_role 노출 없음
```

주의:

```text
- RLS가 read 허용되어 있어야 함
- Work Console source-boundary verifier 수정 필요
- 쓰기 함수는 절대 재사용하지 않음
```

### 권장안 B: 서버 API 경유 read-only

브라우저가 직접 Supabase를 읽지 않고 서버 API가 sanitized JSON을 제공한다.

```text
Browser Work Console
→ /api/work-console/knowledge
→ Supabase read-only query
→ sanitized JSON
```

장점:

```text
- 보안/감사에 더 좋음
- service key를 브라우저에 노출하지 않음
- 응답 형태를 Work Console에 맞게 통제 가능
```

주의:

```text
- Vercel API route 또는 별도 서버 구현 필요
- env/Vercel 설정이 필요할 수 있음
- 현재 승인 범위보다 커질 수 있음
```

### 현재 추천

1차 구현은 **권장안 A**가 현실적이다. 단, Work Console verifier를 무력화하지 말고, `src/services/knowledgeReadModel.ts` 같은 공용 read-only 계층을 만들고 verifier 예외를 명확히 좁혀야 한다.

---

## 8. 구현 지시서

### Goal

```text
Work Console에 실제 Supabase DB 값을 읽는 read-only 지식 정리 콘솔을 추가한다.
```

### Sub-goals

1. `KnowledgeView.tsx`의 read query를 분석하고, 쓰기 함수와 분리한다.
2. `knowledge_items`, `knowledge_sources`, `knowledge_review_queue`를 읽는 read-only service/hook을 만든다.
3. Work Console에 지식 정리 섹션 또는 탭을 추가한다.
4. 상단 KPI는 실제 DB row 기준으로 계산한다.
5. 필터 옵션은 실제 DB rows 기준으로 계산한다.
6. 테이블은 실제 `knowledge_items` row를 표시한다.
7. 상세 Drawer는 실제 selected item/source 값을 표시한다.
8. 삭제/정리/등급 변경은 1차에서 disabled 또는 read-only preview로 둔다.
9. DB가 비어 있으면 가짜 데이터 없이 empty state를 표시한다.
10. `npm run lint`, `npm run build`로 검증한다.

### 금지

```text
- DB insert/update/delete
- migration
- Supabase service_role 사용
- RLS 변경
- env 값 변경
- Vercel env 변경
- server/gateway/cron restart
- mock 숫자 fallback
```

---

## 9. UI 문구

### DB 연결됨 + 빈 상태

```text
DB 연결됨 · read-only
실제 Mimir 지식 테이블을 읽고 있습니다.
현재 knowledge_items에 등록된 지식카드가 없습니다.
Source inbox에는 1개의 원문 자료가 있습니다.
```

### 권한/RLS 오류

```text
DB는 응답했지만 읽기 권한에서 막혔습니다.
로그인 세션 또는 Supabase RLS read policy 확인이 필요합니다.
```

### 미설정

```text
Supabase 연결 정보가 없어 실제 DB를 읽을 수 없습니다.
VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 설정을 확인해야 합니다.
```

### 삭제 버튼

```text
현재 단계에서는 실제 삭제를 실행하지 않습니다.
삭제 요청/삭제 후보 UI는 다음 단계에서 연결합니다.
```

---

## 10. 검증 기준

### 기능 검증

- DB row 수가 0이면 KPI와 테이블도 0/empty로 표시된다.
- `knowledge_sources` 1행은 source 관련 표시에서 실제 count로 반영된다.
- 필터는 DB에서 가져온 rows 기준으로만 옵션을 만든다.
- mock/fixture 숫자가 사용자 화면에 섞이지 않는다.
- 삭제/정리/등급 변경은 실제 write를 하지 않는다.

### 코드 검증

```bash
npm run lint
npm run build
```

### 안전 검증

- 브라우저에 service_role key 없음.
- DB write 함수가 Work Console read-only 화면에서 호출되지 않음.
- `insert`, `update`, `delete`, `upsert`, `rpc` 호출 없음.
- source-boundary verifier 예외가 필요하면 범위를 read-only service로 한정하고 문서화.

---

## 11. 다음 구현 시 주의점

현재 `KnowledgeView.tsx`에는 실제 DB read와 write가 한 컴포넌트에 섞여 있다. Work Console에는 이 컴포넌트를 그대로 넣지 말고, 다음처럼 분리해야 한다.

```text
read-only data layer
→ useKnowledgeReadOnlyData()
→ WorkConsoleKnowledgePanel
```

쓰기 기능은 별도 승인 전까지 연결하지 않는다.

---

## 12. Checker 반영: 구현 전 필수 게이트

checker 검토 결과, “실제 DB read” 방향은 맞지만 기존 Work Console의 fixture-only source-boundary 보증과 충돌한다. 따라서 구현 전/구현 중 아래 게이트를 추가한다.

### 12.1 UI read-only와 DB-level read-only를 분리한다

이 문서의 read-only는 1차적으로 **화면/UI read-only**를 뜻한다. DB 권한 자체가 read-only라는 의미가 아니다.

구현 전 확인:

```text
- Work Console 접근 경로가 public인지 auth-protected인지 확인
- Supabase RLS read/write policy 확인
- anon key로 읽을 수 있는 테이블/컬럼/메서드 확인
```

금지:

```text
- RLS 정책 변경
- env 변경
- service_role 사용
- DB write/delete/migration
```

### 12.2 기존 source-boundary verifier를 우회하지 않는다

현재 verifier는 Work Console이 live source를 읽지 않는다는 보증을 한다. DB read-only Work Console로 방향을 바꾸면 이 보증은 그대로 유지될 수 없다.

따라서 단순 예외/우회가 아니라 별도 `knowledge-db-readonly` verifier를 추가한다.

새 verifier가 검사해야 할 것:

```text
- 허용 테이블 allowlist: knowledge_items, knowledge_sources, knowledge_review_queue 등 명시된 read 대상만
- 허용 메서드: select/count/order/limit/range 등 read 계열만
- 금지 메서드: insert/update/delete/upsert/rpc
- 금지 REST method: POST/PATCH/DELETE/PUT
- 기존 KnowledgeView 컴포넌트 import 금지
- write 함수 포함 파일 직접 재사용 금지
- read-only 모듈 내부에 insert/update/delete/upsert/rpc 문자열 금지
```

### 12.3 KnowledgeView 재사용 금지

`KnowledgeView.tsx`에는 read뿐 아니라 다음 write 동작이 섞여 있다.

```text
- knowledge_sources.insert
- knowledge_items.insert
- knowledge_review_queue.insert
- knowledge_review_queue.update
```

따라서 Work Console 구현에서는 `KnowledgeView` 컴포넌트 자체를 import하지 않는다. 필요한 read query만 별도 read-only hook/service로 새로 분리한다.

### 12.4 민감 가능 컬럼 노출 제한

브라우저에 DB 값을 그대로 모두 노출하지 않는다.

주의 컬럼:

```text
raw_text
body
url
risk_flags
metadata
```

1차 UI에서는 column allowlist와 preview truncation을 적용한다. 상세 Drawer에서도 원문 전체 노출은 별도 정책을 둔다.

### 12.5 0행 UI acceptance criteria

현재 `knowledge_items = 0`, `knowledge_sources = 1`이므로 UI는 다음을 구분해야 한다.

```text
- DB 전체 empty 아님
- source는 있음
- knowledge card는 없음
- 현재 필터 결과 0건과 전체 지식카드 0건을 구분
```

필수 기준:

```text
- KPI는 실제 exact count로 0 표시
- 목록은 “아직 지식카드가 없습니다” 표시
- 필터 옵션은 빈 배열이면 비활성/숨김 처리
- 상세 Drawer는 자동으로 열지 않거나 “선택할 지식카드 없음” 표시
- Source inbox count는 hardcode하지 않고 runtime count 사용
```

### 12.6 KPI count 방식

목록 조회 결과 길이를 KPI로 사용하지 않는다.

```text
잘못된 방식: .limit(50) 결과 배열 length를 전체 지식 수로 표시
권장 방식: Supabase { count: 'exact', head: true } 또는 별도 exact count query
```

목록 pagination과 KPI count는 분리한다.

### 12.7 상태/등급 값 주의

현재 DB check/default 기준이 A-D라면 UI에서 S등급을 기본 노출하지 않는다. `review_status`와 `knowledge_review_queue.queue_status`는 서로 다른 필드이므로 KPI 계산에서 섞지 않는다.

### 12.8 서버 API 방식은 미래 대안

서버 API 경유 방식은 보안상 좋지만 이번 구현 범위에서는 제외한다.

```text
이번 범위 금지:
- Vercel API route 추가
- Vercel env 변경
- 별도 server collector 추가
- server/gateway/cron 재시작
```

---

## 13. 현재 상태 요약

완료:

```text
- Supabase 프로젝트 확인
- 실제 지식 테이블 확인
- 현재 row 수 확인
- 기존 KnowledgeView read/write 구조 확인
- Work Console read-only 매핑안 작성
```

아직 안 함:

```text
- 코드 구현
- DB write/delete
- migration
- Vercel/env/server 변경
- 배포
```
