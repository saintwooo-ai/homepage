# Supabase 지식화 DB MVP

뉴스레터 지식화를 Obsidian 파일이 아니라 Supabase DB에 저장하기 위한 MVP 설계/적용 문서입니다.

## 핵심 방향

```text
뉴스레터 원문 → knowledge_sources → knowledge_items(report/insight/seed/frame) → knowledge_review_queue → 승인된 지식만 검색/재사용
```

## 적용 대상

- Supabase project: `kknqgcbcuilatrvtwuln`
- Supabase Dashboard > SQL Editor에서 아래 SQL을 실행합니다.

## 생성 테이블

| 테이블 | 역할 |
|---|---|
| `knowledge_sources` | 뉴스레터/기사/PDF/영상/사용자 관찰 등 원문 출처 |
| `knowledge_items` | Report/Insight/Seed/Frame 지식 카드 |
| `knowledge_links` | 카드 간 연결/백링크 |
| `knowledge_tags` | 보조 태그 |
| `knowledge_item_tags` | 카드-태그 연결 |
| `knowledge_evidence_items` | 근거 문장/출처 |
| `knowledge_collections` | MOC/Playbook/Logic Bank |
| `knowledge_collection_items` | 컬렉션-카드 연결 |
| `knowledge_ai_runs` | AI 생성 이력 |
| `knowledge_review_queue` | 승인/반려 대기함 |
| `knowledge_approved_search` | 승인/검토 완료 지식 검색 view |

## 적용 SQL

```sql
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create table if not exists public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  source_type text not null default 'newsletter' check (source_type in ('newsletter','article','report','pdf','video','deck','rfp','user_observation','internal','other')),
  title text not null,
  publisher text,
  author text,
  url text,
  published_at timestamptz,
  collected_at timestamptz not null default now(),
  raw_text text,
  summary text,
  language text not null default 'ko',
  source_reliability text not null default 'medium' check (source_reliability in ('high','medium','low','unknown')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('report','insight','seed','frame','case','stat','quote','hypothesis','playbook')),
  title text not null,
  one_line_summary text not null,
  body text,
  source_id uuid references public.knowledge_sources(id) on delete set null,
  category text,
  target_audience text,
  brand text,
  market text,
  rfp_use text not null default 'needs_review' check (rfp_use in ('problem_definition','market_change','target_insight','strategy','creative_rationale','media','case_support','risk_management','needs_review')),
  evidence_level text not null default 'needs_verification' check (evidence_level in ('official','reported','data_backed','inferred','unverified_original','needs_verification')),
  review_status text not null default 'inbox' check (review_status in ('inbox','reviewed','approved','needs_verification','rejected','deprecated')),
  reuse_grade text not null default 'C' check (reuse_grade in ('A','B','C','D')),
  risk_flags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint knowledge_items_minimum_context check (category is not null or target_audience is not null or review_status = 'inbox')
);

create table if not exists public.knowledge_links (
  id uuid primary key default gen_random_uuid(),
  from_item_id uuid not null references public.knowledge_items(id) on delete cascade,
  to_item_id uuid not null references public.knowledge_items(id) on delete cascade,
  link_type text not null check (link_type in ('supports','contradicts','derived_from','example_of','expands','belongs_to','reusable_for','replaced_by','similar_to')),
  note text,
  weight numeric(4,3) not null default 1.0,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (from_item_id, to_item_id, link_type)
);

create table if not exists public.knowledge_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_item_tags (
  item_id uuid not null references public.knowledge_items(id) on delete cascade,
  tag_id uuid not null references public.knowledge_tags(id) on delete cascade,
  primary key (item_id, tag_id)
);

create table if not exists public.knowledge_evidence_items (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.knowledge_items(id) on delete cascade,
  source_id uuid references public.knowledge_sources(id) on delete set null,
  quote text,
  location text,
  url text,
  evidence_level text not null default 'needs_verification' check (evidence_level in ('official','reported','data_backed','inferred','unverified_original','needs_verification')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_collections (
  id uuid primary key default gen_random_uuid(),
  collection_type text not null default 'moc' check (collection_type in ('moc','playbook','rfp_logic_bank','category_map','target_map','weekly_review')),
  title text not null,
  description text,
  category text,
  target_audience text,
  rfp_context text,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_collection_items (
  collection_id uuid not null references public.knowledge_collections(id) on delete cascade,
  item_id uuid not null references public.knowledge_items(id) on delete cascade,
  section text,
  sort_order integer not null default 0,
  use_note text,
  primary key (collection_id, item_id)
);

create table if not exists public.knowledge_ai_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null default 'newsletter_knowledge',
  input_source_id uuid references public.knowledge_sources(id) on delete set null,
  model text,
  prompt_version text,
  input_snapshot jsonb not null default '{}'::jsonb,
  output_snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'completed' check (status in ('queued','running','completed','failed')),
  error text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_review_queue (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.knowledge_items(id) on delete cascade,
  source_id uuid references public.knowledge_sources(id) on delete set null,
  ai_run_id uuid references public.knowledge_ai_runs(id) on delete set null,
  queue_status text not null default 'pending' check (queue_status in ('pending','approved','rejected','needs_revision')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  reviewer_id uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_knowledge_sources_collected_at on public.knowledge_sources(collected_at desc);
create index if not exists idx_knowledge_sources_type on public.knowledge_sources(source_type);
create index if not exists idx_knowledge_items_type_status on public.knowledge_items(item_type, review_status);
create index if not exists idx_knowledge_items_source_id on public.knowledge_items(source_id);
create index if not exists idx_knowledge_items_rfp_use on public.knowledge_items(rfp_use);
create index if not exists idx_knowledge_items_title_trgm on public.knowledge_items using gin (title gin_trgm_ops);
create index if not exists idx_knowledge_items_summary_trgm on public.knowledge_items using gin (one_line_summary gin_trgm_ops);
create index if not exists idx_knowledge_sources_title_trgm on public.knowledge_sources using gin (title gin_trgm_ops);
create index if not exists idx_knowledge_review_queue_status on public.knowledge_review_queue(queue_status, priority, created_at desc);
create index if not exists idx_knowledge_evidence_item_id on public.knowledge_evidence_items(item_id);

create or replace view public.knowledge_approved_search with (security_invoker = true) as
select i.id, i.item_type, i.title, i.one_line_summary, i.category, i.target_audience, i.rfp_use,
       i.evidence_level, i.review_status, i.reuse_grade, i.updated_at,
       s.title as source_title, s.url as source_url, s.publisher as source_publisher
from public.knowledge_items i
left join public.knowledge_sources s on s.id = i.source_id
where i.review_status in ('approved', 'reviewed');

alter table public.knowledge_sources enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.knowledge_links enable row level security;
alter table public.knowledge_tags enable row level security;
alter table public.knowledge_item_tags enable row level security;
alter table public.knowledge_evidence_items enable row level security;
alter table public.knowledge_collections enable row level security;
alter table public.knowledge_collection_items enable row level security;
alter table public.knowledge_ai_runs enable row level security;
alter table public.knowledge_review_queue enable row level security;

grant select, insert, update, delete on public.knowledge_sources to authenticated;
grant select, insert, update, delete on public.knowledge_items to authenticated;
grant select, insert, update, delete on public.knowledge_links to authenticated;
grant select, insert, update, delete on public.knowledge_tags to authenticated;
grant select, insert, update, delete on public.knowledge_item_tags to authenticated;
grant select, insert, update, delete on public.knowledge_evidence_items to authenticated;
grant select, insert, update, delete on public.knowledge_collections to authenticated;
grant select, insert, update, delete on public.knowledge_collection_items to authenticated;
grant select, insert, update, delete on public.knowledge_ai_runs to authenticated;
grant select, insert, update, delete on public.knowledge_review_queue to authenticated;
grant select on public.knowledge_approved_search to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array['knowledge_sources','knowledge_items','knowledge_links','knowledge_tags','knowledge_item_tags','knowledge_evidence_items','knowledge_collections','knowledge_collection_items','knowledge_ai_runs','knowledge_review_queue'] loop
    execute format('drop policy if exists "internal authenticated users can read %1$s" on public.%1$I', table_name);
    execute format('create policy "internal authenticated users can read %1$s" on public.%1$I for select to authenticated using ((select auth.uid()) is not null)', table_name);
    execute format('drop policy if exists "internal authenticated users can insert %1$s" on public.%1$I', table_name);
    execute format('create policy "internal authenticated users can insert %1$s" on public.%1$I for insert to authenticated with check ((select auth.uid()) is not null)', table_name);
    execute format('drop policy if exists "internal authenticated users can update %1$s" on public.%1$I', table_name);
    execute format('create policy "internal authenticated users can update %1$s" on public.%1$I for update to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null)', table_name);
    execute format('drop policy if exists "internal authenticated users can delete %1$s" on public.%1$I', table_name);
    execute format('create policy "internal authenticated users can delete %1$s" on public.%1$I for delete to authenticated using ((select auth.uid()) is not null)', table_name);
  end loop;
end $$;
```

## 확인 쿼리

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name like 'knowledge_%'
order by table_name;
```

```sql
select id, title, review_status
from public.knowledge_items
order by created_at desc
limit 5;
```

## 현재 MVP 한계

- 뉴스레터 자동 수집/API insert는 다음 단계입니다.
- embedding/pgvector RAG는 다음 단계입니다.
- 원문 전체 저장 정책은 저작권/라이선스 기준을 별도로 정해야 합니다.
