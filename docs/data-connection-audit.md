# Homepage 데이터 연결 검수 메모

## 현재 기준선

- Frontend: Vercel `homepage` 배포가 정상 응답한다.
- Backend: Supabase `homepage` 프로젝트가 활성 상태다.
- Build: `npm ci && npm run build` 기준으로 통과해야 한다.
- 민감정보: Supabase key/service-role key 값은 문서에 남기지 않는다.

## 프론트에서 실제 연결된 영역

### Supabase Auth

- `src/auth/AuthContext.tsx`
- `src/components/AuthGate.tsx`
- `src/components/AccountView.tsx`

로그인/세션/계정 화면은 Supabase Auth를 사용한다.

### KnowledgeView 일부

`src/components/KnowledgeView.tsx`는 아래 3개 테이블을 직접 조회/수정한다.

| 테이블 | 현재 용도 |
| --- | --- |
| `knowledge_sources` | 수집 Source 목록/상세 |
| `knowledge_items` | 지식 카드 목록/상세 |
| `knowledge_review_queue` | 검토 대기열 및 승인/반려/수정 필요 상태 업데이트 |

## 아직 화면에 연결되지 않은 지식 테이블

아래 테이블/뷰는 DB에는 존재하지만 현재 KnowledgeView의 실제 화면 데이터 흐름에는 연결되어 있지 않다.

- `knowledge_evidence_items`
- `knowledge_tags`
- `knowledge_item_tags`
- `knowledge_links`
- `knowledge_collections`
- `knowledge_collection_items`
- `knowledge_ai_runs`
- `knowledge_approved_search`

## mock/static 상태로 남은 주요 영역

`src/App.tsx`는 아직 여러 화면에서 `src/mockData.ts`의 초기값과 local state를 사용한다.

- 대시보드
- 칸반/작업 보드
- 협업 프로필
- 이벤트 로그
- 일부 knowledge pipeline summary

따라서 현재 앱 전체를 “DB 원장 기반 앱”으로 보기는 어렵고, “Auth + 지식 콘솔 일부 DB 연결 + 나머지 mock 기반” 상태로 보는 것이 안전하다.

## 권한/빈 데이터 구분 원칙

Supabase anon REST 조회가 401/permission denied를 반환할 수 있다. 현재 앱은 로그인 후 authenticated 세션으로 접근하는 구조이므로, anon 401만으로 장애로 단정하지 않는다.

프론트에서는 아래 상태를 구분해서 보여준다.

| 상태 | 의미 |
| --- | --- |
| 연결 확인 중 | Supabase 요청 진행 중 |
| DB 연결됨 · 데이터 0건 | 스키마/권한 오류가 아니라 row가 없는 상태 |
| DB 연결됨 · 데이터 표시 가능 | 실제 row가 화면에 반영됨 |
| 권한 확인 필요 | 로그인 세션/JWT/RLS 정책 문제 가능성 |
| 스키마 확인 필요 | 테이블/컬럼 누락 또는 이름 불일치 |
| 알 수 없는 연결 오류 | 기타 Supabase 요청 실패 |

## `/api/admin-users` 상태

현재 운영 환경에서 `/api/admin-users`는 server-only Supabase env 미설정 시 500을 반환한다.

필요한 경우 Vercel server-only env로 아래 값이 필요할 수 있다.

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

주의: `SUPABASE_SERVICE_ROLE_KEY`는 절대 브라우저 번들에 들어가면 안 되며, `VITE_*` 이름으로 설정하면 안 된다.

## 다음 구현 우선순위

1. KnowledgeView의 연결/권한/빈 데이터 상태를 명확히 표시한다.
2. 로그인 후 authenticated 세션에서 `knowledge_sources`, `knowledge_items`, `knowledge_review_queue` 조회를 검증한다.
3. preview/local seed 또는 실제 파이프라인 insert로 최소 데이터 1세트를 만든다.
4. `knowledge_evidence_items`, `knowledge_tags`, `knowledge_links` 순서로 화면 연결을 확장한다.
5. 대시보드/칸반/프로필/이벤트는 도메인별 hook/service로 분리한 뒤 한 화면씩 mockData를 제거한다.
6. `/api/admin-users`는 service-role key가 필요한 관리자 기능이므로 별도 승인 후 env 설정/재배포를 진행한다.
