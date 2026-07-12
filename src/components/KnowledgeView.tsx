import React, { useEffect, useMemo, useState } from 'react';
import { Database, RefreshCw, Search, ShieldCheck, AlertCircle, CheckCircle2, XCircle, FileText, GitBranch, Tags, BookOpen } from 'lucide-react';
import { KnowledgePipeline } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';

type KnowledgeItem = {
  id: string;
  item_type: string;
  title: string;
  one_line_summary: string;
  body: string | null;
  category: string | null;
  target_audience: string | null;
  rfp_use: string;
  evidence_level: string;
  review_status: string;
  reuse_grade: string;
  risk_flags: string[] | null;
  updated_at: string;
  source_id: string | null;
};

type ReviewQueueItem = {
  id: string;
  item_id: string;
  source_id: string | null;
  queue_status: ReviewStatus;
  priority: string;
  notes: string | null;
  created_at: string;
  knowledge_items?: KnowledgeItem | null;
};

type SourceItem = {
  id: string;
  source_type: string;
  title: string;
  publisher: string | null;
  url: string | null;
  raw_text: string | null;
  summary: string | null;
  collected_at: string;
};

interface KnowledgeViewProps {
  knowledge: KnowledgePipeline;
}

const statusLabel: Record<string, string> = {
  inbox: '수집함',
  reviewed: '검토됨',
  approved: '승인됨',
  needs_verification: '검증 필요',
  rejected: '반려',
  deprecated: '폐기',
  pending: '검토 대기',
  needs_revision: '수정 필요',
};

const evidenceLabel: Record<string, string> = {
  official: '공식발표',
  reported: '기사보도',
  data_backed: '수치근거',
  inferred: '추정',
  unverified_original: '원문미확인',
  needs_verification: '검증 필요',
};

export default function KnowledgeView({ knowledge }: KnowledgeViewProps) {
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReviewStatus>('all');
  const [loading, setLoading] = useState(false);
  const [savingSource, setSavingSource] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourcePublisher, setSourcePublisher] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceRawText, setSourceRawText] = useState('');
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [sourceQuery, setSourceQuery] = useState('');
  const [sourceTypeFilter, setSourceTypeFilter] = useState('all');
  const [sourcePublisherFilter, setSourcePublisherFilter] = useState('all');
  const [sourceSort, setSourceSort] = useState<'newest' | 'oldest' | 'title'>('newest');

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? reviewQueue.find((row) => row.knowledge_items?.id === selectedItemId)?.knowledge_items ?? null,
    [items, reviewQueue, selectedItemId]
  );

  const selectedSource = useMemo(
    () => sources.find((source) => source.id === selectedSourceId) ?? sources[0] ?? null,
    [sources, selectedSourceId]
  );

  const sourceTypes = useMemo(
    () => Array.from(new Set(sources.map((source) => source.source_type).filter(Boolean))).sort(),
    [sources]
  );

  const sourcePublishers = useMemo(
    () => Array.from(new Set(sources.map((source) => source.publisher).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'ko')),
    [sources]
  );

  const filteredSources = useMemo(() => {
    const q = sourceQuery.trim().toLowerCase();
    const filtered = sources.filter((source) => {
      const matchesQuery = !q || [source.title, source.publisher, source.summary, source.raw_text, source.url]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
      const matchesType = sourceTypeFilter === 'all' || source.source_type === sourceTypeFilter;
      const matchesPublisher = sourcePublisherFilter === 'all' || source.publisher === sourcePublisherFilter;
      return matchesQuery && matchesType && matchesPublisher;
    });

    return [...filtered].sort((a, b) => {
      if (sourceSort === 'title') return a.title.localeCompare(b.title, 'ko');
      const aTime = new Date(a.collected_at).getTime();
      const bTime = new Date(b.collected_at).getTime();
      return sourceSort === 'oldest' ? aTime - bTime : bTime - aTime;
    });
  }, [sources, sourceQuery, sourceTypeFilter, sourcePublisherFilter, sourceSort]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.title, item.one_line_summary, item.category, item.target_audience, item.rfp_use]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [items, query]);

  async function loadKnowledge() {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    const queueQuery = supabase
      .from('knowledge_review_queue')
      .select('id,item_id,source_id,queue_status,priority,notes,created_at,knowledge_items(*)')
      .order('created_at', { ascending: false })
      .limit(30);

    if (statusFilter !== 'all') {
      queueQuery.eq('queue_status', statusFilter);
    }

    const [queueResult, itemsResult, sourcesResult] = await Promise.all([
      queueQuery,
      supabase
        .from('knowledge_items')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50),
      supabase
        .from('knowledge_sources')
        .select('id,source_type,title,publisher,url,summary,raw_text,collected_at')
        .order('collected_at', { ascending: false })
        .limit(20),
    ]);

    setLoading(false);

    const firstError = queueResult.error ?? itemsResult.error ?? sourcesResult.error;
    if (firstError) {
      setError(firstError.message.includes('does not exist')
        ? '아직 Supabase에 지식화 테이블이 없어. docs/knowledge-db-mvp.md의 SQL을 먼저 적용해야 해.'
        : firstError.message);
      return;
    }

    const nextQueue = (queueResult.data ?? []) as unknown as ReviewQueueItem[];
    const nextItems = (itemsResult.data ?? []) as KnowledgeItem[];
    setReviewQueue(nextQueue);
    setItems(nextItems);
    const nextSources = (sourcesResult.data ?? []) as SourceItem[];
    setSources(nextSources);
    setSelectedItemId((current) => current ?? nextQueue[0]?.knowledge_items?.id ?? nextItems[0]?.id ?? null);
    setSelectedSourceId((current) => current ?? nextSources[0]?.id ?? null);
  }

  useEffect(() => {
    void loadKnowledge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);


  async function createSource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    const title = sourceTitle.trim();
    const rawText = sourceRawText.trim();
    if (!title || !rawText) {
      setError('제목과 원문/메모는 필수야.');
      return;
    }

    setSavingSource(true);
    setError(null);
    setMessage(null);

    const summary = rawText.length > 220 ? `${rawText.slice(0, 220)}…` : rawText;
    const { error: insertError } = await supabase.from('knowledge_sources').insert({
      source_type: 'newsletter',
      title,
      publisher: sourcePublisher.trim() || null,
      url: sourceUrl.trim() || null,
      raw_text: rawText,
      summary,
      metadata: { created_from: 'homepage_source_inbox' },
    });

    setSavingSource(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSourceTitle('');
    setSourcePublisher('');
    setSourceUrl('');
    setSourceRawText('');
    setMessage('Source가 DB에 저장됐어.');
    await loadKnowledge();
  }

  async function updateReview(queueId: string, nextStatus: ReviewStatus) {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error: updateError } = await supabase
      .from('knowledge_review_queue')
      .update({ queue_status: nextStatus, reviewed_at: new Date().toISOString() })
      .eq('id', queueId);

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMessage(nextStatus === 'approved' ? '지식 카드가 승인됐어.' : nextStatus === 'rejected' ? '지식 카드가 반려됐어.' : '수정 필요로 표시했어.');
    await loadKnowledge();
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-6 text-amber-100">
        <h1 className="flex items-center gap-2 text-lg font-bold"><AlertCircle className="h-5 w-5" /> Supabase 연결 필요</h1>
        <p className="mt-2 text-sm text-amber-200/80">`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`가 설정되어야 DB 지식화 화면을 사용할 수 있어.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-white">
              <Database className="h-5 w-5 text-cyan-400" />
              지식 DB 콘솔
            </h1>
            <p className="mt-1 text-xs text-gray-400">
              뉴스레터 지식화의 원장 저장소를 Obsidian이 아니라 Supabase DB로 전환합니다. Source→Report→Insight→Seed→Frame과 검토 대기열을 관리합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={loadKnowledge}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> DB 새로고침
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat icon={<FileText className="h-4 w-4" />} label="수집 Source" value={`${sources.length}건`} tone="cyan" />
        <Stat icon={<BookOpen className="h-4 w-4" />} label="지식 카드" value={`${items.length}건`} tone="indigo" />
        <Stat icon={<ShieldCheck className="h-4 w-4" />} label="검토 대기" value={`${reviewQueue.filter((row) => row.queue_status === 'pending').length}건`} tone="amber" />
        <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="승인/검토" value={`${items.filter((item) => ['approved', 'reviewed'].includes(item.review_status)).length}건`} tone="emerald" />
        <Stat icon={<GitBranch className="h-4 w-4" />} label="저장 방식" value="DB 원장" tone="violet" />
      </div>

      {message && <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-xs text-emerald-200">{message}</div>}
      {error && <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-3 text-xs text-red-200">{error}</div>}


      <section className="rounded-2xl border border-gray-800 bg-gray-950/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">수집 Source</h2>
            <p className="mt-1 text-[11px] text-gray-500">Supabase knowledge_sources에 저장된 자료를 검색/필터링해서 표시합니다.</p>
          </div>
          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-[11px] font-bold text-cyan-200">{sources.length}건</span>
        </div>

        <div className="mb-4 rounded-xl border border-gray-800 bg-gray-950/50 p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid flex-1 gap-2 md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
              <div className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2">
                <Search className="h-4 w-4 text-gray-500" />
                <input
                  value={sourceQuery}
                  onChange={(event) => setSourceQuery(event.target.value)}
                  placeholder="제목, 발행처, 본문, URL 검색"
                  className="w-full bg-transparent text-xs text-gray-200 outline-none placeholder:text-gray-600"
                />
              </div>
              <select
                value={sourceTypeFilter}
                onChange={(event) => setSourceTypeFilter(event.target.value)}
                className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-300"
              >
                <option value="all">전체 타입</option>
                {sourceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <select
                value={sourcePublisherFilter}
                onChange={(event) => setSourcePublisherFilter(event.target.value)}
                className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-300"
              >
                <option value="all">전체 발행처</option>
                {sourcePublishers.map((publisher) => <option key={publisher} value={publisher}>{publisher}</option>)}
              </select>
              <select
                value={sourceSort}
                onChange={(event) => setSourceSort(event.target.value as 'newest' | 'oldest' | 'title')}
                className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-300"
              >
                <option value="newest">최신순</option>
                <option value="oldest">오래된순</option>
                <option value="title">제목순</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowSourceForm((current) => !current)}
              className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20"
            >
              {showSourceForm ? '수동 추가 닫기' : '수동 Source 추가'}
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-500">
            <span>전체 {sources.length}건</span>
            <span>·</span>
            <span>필터 결과 {filteredSources.length}건</span>
            {(sourceQuery || sourceTypeFilter !== 'all' || sourcePublisherFilter !== 'all') && (
              <button
                type="button"
                onClick={() => { setSourceQuery(''); setSourceTypeFilter('all'); setSourcePublisherFilter('all'); }}
                className="font-bold text-cyan-300 hover:underline"
              >
                필터 초기화
              </button>
            )}
          </div>
        </div>

        {showSourceForm && (
          <form onSubmit={createSource} className="mb-4 grid gap-3 rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-xs font-bold text-gray-300">
                제목 <span className="text-cyan-300">*</span>
                <input
                  value={sourceTitle}
                  onChange={(event) => setSourceTitle(event.target.value)}
                  placeholder="예: 2026 소비 트렌드 뉴스레터"
                  className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs font-normal text-gray-100 outline-none placeholder:text-gray-600"
                />
              </label>
              <label className="space-y-1 text-xs font-bold text-gray-300">
                발행처
                <input
                  value={sourcePublisher}
                  onChange={(event) => setSourcePublisher(event.target.value)}
                  placeholder="예: 오픈서베이, 캐릿, 뉴닉"
                  className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs font-normal text-gray-100 outline-none placeholder:text-gray-600"
                />
              </label>
            </div>
            <label className="space-y-1 text-xs font-bold text-gray-300">
              URL
              <input
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs font-normal text-gray-100 outline-none placeholder:text-gray-600"
              />
            </label>
            <label className="space-y-1 text-xs font-bold text-gray-300">
              원문/메모 <span className="text-cyan-300">*</span>
              <textarea
                value={sourceRawText}
                onChange={(event) => setSourceRawText(event.target.value)}
                placeholder="뉴스레터 원문, 기사 핵심 내용, 수집 메모를 붙여넣어줘."
                rows={5}
                className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs font-normal leading-relaxed text-gray-100 outline-none placeholder:text-gray-600"
              />
            </label>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p className="text-[11px] text-gray-500">수동 입력은 보조 기능입니다. 기본 화면은 저장된 DB 탐색용입니다.</p>
              <button
                type="submit"
                disabled={savingSource || !sourceTitle.trim() || !sourceRawText.trim()}
                className="rounded-lg bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {savingSource ? '저장 중...' : 'Source 저장'}
              </button>
            </div>
          </form>
        )}
        {sources.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-800 p-5 text-xs leading-relaxed text-gray-500">
            아직 DB에 저장된 Source가 없어. 수집 파이프라인이나 수동 추가로 데이터가 들어오면 여기에 표시돼.
          </div>
        ) : filteredSources.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-800 p-5 text-xs leading-relaxed text-gray-500">
            현재 필터 조건에 맞는 Source가 없어. 검색어/타입/발행처 필터를 조정해줘.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
              {filteredSources.map((source) => (
                <button
                  key={source.id}
                  type="button"
                  onClick={() => setSelectedSourceId(source.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${selectedSource?.id === source.id ? 'border-cyan-500/50 bg-cyan-950/20' : 'border-gray-800 bg-gray-900/40 hover:border-gray-700'}`}
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] text-gray-500">
                    <span className="font-bold uppercase text-cyan-300">{source.source_type}</span>
                    <span>{new Date(source.collected_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-bold text-gray-100">{source.title}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-gray-500">{source.summary ?? source.raw_text ?? '요약 없음'}</p>
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
              {selectedSource ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex flex-wrap gap-2 text-[10px]"><Badge>{selectedSource.source_type}</Badge><Badge>{selectedSource.publisher ?? '발행처 미지정'}</Badge></div>
                    <h3 className="mt-3 text-lg font-bold text-white">{selectedSource.title}</h3>
                    {selectedSource.url && <a href={selectedSource.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-cyan-300 hover:underline">원문 링크 열기</a>}
                  </div>
                  <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">요약</h4>
                    <p className="rounded-xl border border-gray-800 bg-gray-950/60 p-4 text-xs leading-relaxed text-gray-300">{selectedSource.summary || '요약이 아직 없어.'}</p>
                  </div>
                  <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">원문/수집 텍스트</h4>
                    <p className="whitespace-pre-wrap rounded-xl border border-gray-800 bg-gray-950/60 p-4 text-xs leading-relaxed text-gray-300">{selectedSource.raw_text || '원문 텍스트가 아직 없어.'}</p>
                  </div>
                </div>
              ) : <div className="text-xs text-gray-500">Source를 선택해줘.</div>}
            </div>
          </div>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <section className="rounded-2xl border border-gray-800 bg-gray-950/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Review Queue</h2>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | ReviewStatus)}
              className="rounded-lg border border-gray-800 bg-gray-950 px-2 py-1 text-[11px] text-gray-300"
            >
              <option value="all">전체</option>
              <option value="pending">검토 대기</option>
              <option value="approved">승인</option>
              <option value="rejected">반려</option>
              <option value="needs_revision">수정 필요</option>
            </select>
          </div>

          <div className="space-y-2">
            {reviewQueue.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-800 p-4 text-xs text-gray-500">
                검토 대기열이 비어 있어. 아직 AI 후보 지식 카드가 생성되지 않았다는 뜻이야.
              </div>
            )}
            {reviewQueue.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelectedItemId(row.knowledge_items?.id ?? row.item_id)}
                className="w-full rounded-xl border border-gray-800 bg-gray-900/50 p-3 text-left hover:border-cyan-500/30 hover:bg-gray-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase text-cyan-400">{row.priority}</span>
                  <span className="rounded-full bg-gray-950 px-2 py-0.5 text-[10px] text-gray-400">{statusLabel[row.queue_status] ?? row.queue_status}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-semibold text-gray-100">{row.knowledge_items?.title ?? row.item_id}</p>
                <p className="mt-1 line-clamp-2 text-[11px] text-gray-500">{row.knowledge_items?.one_line_summary ?? row.notes ?? '요약 없음'}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-800 bg-gray-950/40 p-4">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-sm font-bold text-white">Knowledge Cards</h2>
            <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-950 px-3 py-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="키워드, 타깃, RFP 위치 검색"
                className="w-56 bg-transparent text-xs text-gray-200 outline-none placeholder:text-gray-600"
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
            <div className="max-h-[540px] space-y-2 overflow-y-auto pr-1">
              {filteredItems.length === 0 && <p className="text-xs text-gray-500">검색 결과가 없어.</p>}
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${selectedItem?.id === item.id ? 'border-cyan-500/50 bg-cyan-950/20' : 'border-gray-800 bg-gray-900/40 hover:border-gray-700'}`}
                >
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span className="font-bold uppercase text-indigo-300">{item.item_type}</span>
                    <span>·</span>
                    <span>{statusLabel[item.review_status] ?? item.review_status}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-bold text-gray-100">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-gray-500">{item.one_line_summary}</p>
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
              {selectedItem ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      <Badge>{selectedItem.item_type}</Badge>
                      <Badge>{statusLabel[selectedItem.review_status] ?? selectedItem.review_status}</Badge>
                      <Badge>{evidenceLabel[selectedItem.evidence_level] ?? selectedItem.evidence_level}</Badge>
                      <Badge>재사용 {selectedItem.reuse_grade}</Badge>
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-white">{selectedItem.title}</h3>
                    <p className="mt-2 rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3 text-sm leading-relaxed text-indigo-100">{selectedItem.one_line_summary}</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <InfoBox label="카테고리" value={selectedItem.category ?? '미지정'} />
                    <InfoBox label="타깃" value={selectedItem.target_audience ?? '미지정'} />
                    <InfoBox label="RFP 활용" value={selectedItem.rfp_use} />
                  </div>

                  <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">본문/활용 메모</h4>
                    <p className="whitespace-pre-wrap rounded-xl border border-gray-800 bg-gray-950/60 p-4 text-xs leading-relaxed text-gray-300">
                      {selectedItem.body || '본문이 아직 없어. 자동 생성 후보를 승인하기 전에 근거와 사용 맥락을 채워야 해.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-500"><Tags className="h-3.5 w-3.5" /> 리스크 플래그</h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedItem.risk_flags?.length ? selectedItem.risk_flags : ['none']).map((flag) => <Badge key={flag}>{flag}</Badge>)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-gray-800 pt-4">
                    {reviewQueue.filter((row) => row.item_id === selectedItem.id).map((row) => (
                      <React.Fragment key={row.id}>
                        <button
                          type="button"
                          onClick={() => updateReview(row.id, 'approved')}
                          disabled={loading}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" /> 승인
                        </button>
                        <button
                          type="button"
                          onClick={() => updateReview(row.id, 'needs_revision')}
                          disabled={loading}
                          className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
                        >
                          <AlertCircle className="h-4 w-4" /> 수정 필요
                        </button>
                        <button
                          type="button"
                          onClick={() => updateReview(row.id, 'rejected')}
                          disabled={loading}
                          className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" /> 반려
                        </button>
                      </React.Fragment>
                    ))}
                    {!reviewQueue.some((row) => row.item_id === selectedItem.id) && (
                      <span className="text-xs text-gray-500">이 카드는 현재 검토 대기열에 없어.</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-800 p-8 text-center text-sm text-gray-500">
                  지식 카드를 선택해줘.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-950/40 p-4">
      <div className={`mb-2 inline-flex rounded-xl bg-${tone}-500/10 p-2 text-${tone}-300`}>
        {icon}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode; key?: React.Key }) {
  return <span className="rounded-full border border-gray-700 bg-gray-950 px-2.5 py-1 text-[10px] font-bold text-gray-300">{children}</span>;
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-xs font-semibold text-gray-200">{value}</p>
    </div>
  );
}
