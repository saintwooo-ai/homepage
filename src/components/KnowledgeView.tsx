import React, { useEffect, useMemo, useState } from 'react';
import { Database, RefreshCw, Search, ShieldCheck, AlertCircle, CheckCircle2, XCircle, FileText, GitBranch, Tags, BookOpen } from 'lucide-react';
import { KnowledgePipeline } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';
type QueueStatusFilter = 'all' | ReviewStatus;
type KnowledgeSort = 'newest' | 'title' | 'grade';

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
  summary: string | null;
  raw_text: string | null;
  collected_at: string;
};

type ConnectionState = 'checking' | 'connected_empty' | 'connected_with_data' | 'auth_or_rls_error' | 'schema_error' | 'unknown_error';

const connectedTables = ['knowledge_sources', 'knowledge_items', 'knowledge_review_queue'];
const pendingTables = [
  'knowledge_evidence_items',
  'knowledge_tags',
  'knowledge_item_tags',
  'knowledge_links',
  'knowledge_collections',
  'knowledge_collection_items',
  'knowledge_ai_runs',
  'knowledge_approved_search',
];

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

const categoryUnassignedValue = '__uncategorized';

const reuseGradeOrder: Record<string, number> = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
};

const queueStatusOptions: Array<{ value: QueueStatusFilter; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'pending', label: '검토 대기' },
  { value: 'approved', label: '승인' },
  { value: 'needs_revision', label: '수정 필요' },
  { value: 'rejected', label: '반려' },
];

const priorityOrder: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  normal: 2,
  low: 3,
};

const priorityLabel: Record<string, string> = {
  urgent: '긴급',
  high: '높음',
  medium: '보통',
  normal: '보통',
  low: '낮음',
};

const itemTypeOptions = ['report', 'insight', 'seed', 'frame', 'case', 'stat', 'quote', 'hypothesis', 'playbook'];
const evidenceLevelOptions = ['official', 'reported', 'data_backed', 'inferred', 'unverified_original', 'needs_verification'];
const reuseGradeOptions = ['A', 'B', 'C', 'D'];
const rfpUseOptions = [
  { value: 'problem_definition', label: '문제 정의' },
  { value: 'market_change', label: '시장 변화' },
  { value: 'target_insight', label: '타깃 인사이트' },
  { value: 'strategy', label: '전략' },
  { value: 'creative_rationale', label: '크리에이티브 근거' },
  { value: 'media', label: '미디어' },
  { value: 'case_support', label: '사례 근거' },
  { value: 'risk_management', label: '리스크 관리' },
  { value: 'needs_review', label: '검토 필요' },
];

function uniqueSorted(values: Array<string | null>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b, 'ko'));
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default function KnowledgeView({ knowledge }: KnowledgeViewProps) {
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>([]);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [queueStatusFilter, setQueueStatusFilter] = useState<QueueStatusFilter>('all');
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
  const [connectionState, setConnectionState] = useState<ConnectionState>('checking');
  const [itemTypeFilter, setItemTypeFilter] = useState('all');
  const [itemReviewStatusFilter, setItemReviewStatusFilter] = useState('all');
  const [itemEvidenceLevelFilter, setItemEvidenceLevelFilter] = useState('all');
  const [itemReuseGradeFilter, setItemReuseGradeFilter] = useState('all');
  const [itemCategoryFilter, setItemCategoryFilter] = useState('all');
  const [itemSort, setItemSort] = useState<KnowledgeSort>('newest');
  const [savingKnowledgeDraft, setSavingKnowledgeDraft] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftSummary, setDraftSummary] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftItemType, setDraftItemType] = useState('insight');
  const [draftEvidenceLevel, setDraftEvidenceLevel] = useState('needs_verification');
  const [draftReuseGrade, setDraftReuseGrade] = useState('C');
  const [draftCategory, setDraftCategory] = useState('');
  const [draftRfpUse, setDraftRfpUse] = useState('needs_review');
  const [draftTargetAudience, setDraftTargetAudience] = useState('');
  const [draftQueuePriority, setDraftQueuePriority] = useState('normal');
  const [draftReviewNotes, setDraftReviewNotes] = useState('');

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

  const itemTypes = useMemo(
    () => uniqueSorted(items.map((item) => item.item_type)),
    [items]
  );

  const itemReviewStatuses = useMemo(
    () => uniqueSorted(items.map((item) => item.review_status)),
    [items]
  );

  const itemEvidenceLevels = useMemo(
    () => uniqueSorted(items.map((item) => item.evidence_level)),
    [items]
  );

  const itemReuseGrades = useMemo(
    () => uniqueSorted(items.map((item) => item.reuse_grade)).sort((a, b) => (reuseGradeOrder[a] ?? 99) - (reuseGradeOrder[b] ?? 99) || a.localeCompare(b, 'ko')),
    [items]
  );

  const itemCategories = useMemo(() => {
    const categories = uniqueSorted(items.map((item) => item.category));
    return items.some((item) => !item.category) ? [categoryUnassignedValue, ...categories] : categories;
  }, [items]);

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

  const queueStatusCounts = useMemo(() => {
    return reviewQueue.reduce<Record<ReviewStatus, number>>((counts, row) => {
      counts[row.queue_status] += 1;
      return counts;
    }, { pending: 0, approved: 0, rejected: 0, needs_revision: 0 });
  }, [reviewQueue]);

  const filteredReviewQueue = useMemo(() => {
    const filtered = queueStatusFilter === 'all'
      ? reviewQueue
      : reviewQueue.filter((row) => row.queue_status === queueStatusFilter);

    return [...filtered].sort((a, b) => {
      const priorityDiff = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [reviewQueue, queueStatusFilter]);

  const selectedQueueRow = useMemo(
    () => filteredReviewQueue.find((row) => row.knowledge_items?.id === selectedItemId || row.item_id === selectedItemId)
      ?? filteredReviewQueue[0]
      ?? null,
    [filteredReviewQueue, selectedItemId]
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const matchesQuery = !q || [item.title, item.one_line_summary, item.body, item.category, item.target_audience, item.rfp_use, item.item_type, item.review_status, item.evidence_level, item.reuse_grade]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
      const matchesType = itemTypeFilter === 'all' || item.item_type === itemTypeFilter;
      const matchesReviewStatus = itemReviewStatusFilter === 'all' || item.review_status === itemReviewStatusFilter;
      const matchesEvidenceLevel = itemEvidenceLevelFilter === 'all' || item.evidence_level === itemEvidenceLevelFilter;
      const matchesReuseGrade = itemReuseGradeFilter === 'all' || item.reuse_grade === itemReuseGradeFilter;
      const matchesCategory = itemCategoryFilter === 'all'
        || (itemCategoryFilter === categoryUnassignedValue ? !item.category : item.category === itemCategoryFilter);
      return matchesQuery && matchesType && matchesReviewStatus && matchesEvidenceLevel && matchesReuseGrade && matchesCategory;
    });

    return [...filtered].sort((a, b) => {
      if (itemSort === 'title') return a.title.localeCompare(b.title, 'ko');
      if (itemSort === 'grade') return (reuseGradeOrder[a.reuse_grade] ?? 99) - (reuseGradeOrder[b.reuse_grade] ?? 99) || a.title.localeCompare(b.title, 'ko');
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [items, query, itemTypeFilter, itemReviewStatusFilter, itemEvidenceLevelFilter, itemReuseGradeFilter, itemCategoryFilter, itemSort]);

  const visibleSelectedItem = useMemo(
    () => filteredItems.find((item) => item.id === selectedItemId) ?? filteredItems[0] ?? selectedItem,
    [filteredItems, selectedItem, selectedItemId]
  );

  const itemFiltersActive = query.trim() !== ''
    || itemTypeFilter !== 'all'
    || itemReviewStatusFilter !== 'all'
    || itemEvidenceLevelFilter !== 'all'
    || itemReuseGradeFilter !== 'all'
    || itemCategoryFilter !== 'all';

  function resetItemFilters() {
    setQuery('');
    setItemTypeFilter('all');
    setItemReviewStatusFilter('all');
    setItemEvidenceLevelFilter('all');
    setItemReuseGradeFilter('all');
    setItemCategoryFilter('all');
  }

  async function loadKnowledge() {
    if (!supabase) return;
    setLoading(true);
    setConnectionState('checking');
    setError(null);
    setMessage(null);

    const queueQuery = supabase
      .from('knowledge_review_queue')
      .select('id,item_id,source_id,queue_status,priority,notes,created_at,knowledge_items(*)')
      .order('created_at', { ascending: false })
      .limit(30);

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
      const lowerMessage = firstError.message.toLowerCase();
      const nextConnectionState = lowerMessage.includes('does not exist')
        ? 'schema_error'
        : lowerMessage.includes('permission denied') || lowerMessage.includes('jwt') || lowerMessage.includes('row-level security')
          ? 'auth_or_rls_error'
          : 'unknown_error';
      setConnectionState(nextConnectionState);
      setError(nextConnectionState === 'schema_error'
        ? '아직 Supabase에 지식화 테이블이 없어. docs/knowledge-db-mvp.md의 SQL을 먼저 적용해야 해.'
        : nextConnectionState === 'auth_or_rls_error'
          ? 'DB는 응답했지만 권한에서 막혔어. 로그인 세션 또는 Supabase RLS 정책을 확인해야 해.'
          : firstError.message);
      return;
    }

    const nextQueue = (queueResult.data ?? []) as unknown as ReviewQueueItem[];
    const nextItems = (itemsResult.data ?? []) as KnowledgeItem[];
    const nextSources = (sourcesResult.data ?? []) as SourceItem[];
    setConnectionState(nextQueue.length + nextItems.length + nextSources.length === 0 ? 'connected_empty' : 'connected_with_data');
    setReviewQueue(nextQueue);
    setItems(nextItems);
    setSources(nextSources);
    setSelectedItemId((current) => current ?? nextQueue[0]?.knowledge_items?.id ?? nextItems[0]?.id ?? null);
    setSelectedSourceId((current) => current ?? nextSources[0]?.id ?? null);
  }

  useEffect(() => {
    void loadKnowledge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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

  function fillDraftFromSource() {
    if (!selectedSource) return;
    const baseText = selectedSource.summary || selectedSource.raw_text || '';
    setDraftTitle((current) => current || selectedSource.title);
    setDraftSummary((current) => current || (baseText.length > 140 ? `${baseText.slice(0, 140)}…` : baseText));
    setDraftBody((current) => current || [
      selectedSource.summary ? `요약\n${selectedSource.summary}` : null,
      selectedSource.raw_text ? `근거 원문/메모\n${selectedSource.raw_text}` : null,
      selectedSource.url ? `원문 링크\n${selectedSource.url}` : null,
    ].filter(Boolean).join('\n\n'));
  }

  async function createKnowledgeDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !selectedSource) return;

    const title = draftTitle.trim();
    const oneLineSummary = draftSummary.trim();
    const body = draftBody.trim();
    const category = draftCategory.trim();
    const targetAudience = draftTargetAudience.trim();
    const reviewNotes = draftReviewNotes.trim();

    if (!title || !oneLineSummary || !body || !category) {
      setError('Knowledge Card 초안의 제목, 한 줄 요약, 본문/활용 메모, 카테고리는 필수야.');
      return;
    }

    setSavingKnowledgeDraft(true);
    setError(null);
    setMessage(null);

    const { data: insertedItem, error: itemInsertError } = await supabase
      .from('knowledge_items')
      .insert({
        item_type: draftItemType,
        title,
        one_line_summary: oneLineSummary,
        body,
        source_id: selectedSource.id,
        category,
        target_audience: targetAudience || null,
        rfp_use: draftRfpUse,
        evidence_level: draftEvidenceLevel,
        review_status: 'inbox',
        reuse_grade: draftReuseGrade,
        risk_flags: [],
        metadata: { created_from: 'homepage_manual_source_card' },
      })
      .select('id')
      .single();

    if (itemInsertError || !insertedItem) {
      setSavingKnowledgeDraft(false);
      setError(itemInsertError?.message ?? 'knowledge_items 저장 결과를 확인할 수 없어.');
      return;
    }

    const { error: queueInsertError } = await supabase
      .from('knowledge_review_queue')
      .insert({
        item_id: insertedItem.id,
        source_id: selectedSource.id,
        queue_status: 'pending',
        priority: draftQueuePriority,
        notes: reviewNotes || `수동 생성 초안: ${selectedSource.title}`,
      });

    setSavingKnowledgeDraft(false);

    if (queueInsertError) {
      setError(`Knowledge Card는 저장됐지만 Review Queue 등록에 실패했어: ${queueInsertError.message}`);
      await loadKnowledge();
      setSelectedItemId(insertedItem.id);
      return;
    }

    setDraftTitle('');
    setDraftSummary('');
    setDraftBody('');
    setDraftItemType('insight');
    setDraftEvidenceLevel('needs_verification');
    setDraftReuseGrade('C');
    setDraftCategory('');
    setDraftRfpUse('needs_review');
    setDraftTargetAudience('');
    setDraftQueuePriority('normal');
    setDraftReviewNotes('');
    setMessage('선택한 Source 기반 Knowledge Card 초안이 검토 대기열에 등록됐어.');
    await loadKnowledge();
    setSelectedItemId(insertedItem.id);
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
    const feedback = nextStatus === 'approved'
      ? 'Review Queue 상태를 승인으로 변경했어. knowledge_items.review_status는 별도 검토 필드야.'
      : nextStatus === 'rejected'
        ? 'Review Queue 상태를 반려로 변경했어.'
        : 'Review Queue 상태를 수정 필요로 표시했어.';
    setMessage(feedback);
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

      <ConnectionAuditPanel
        state={connectionState}
        connectedTables={connectedTables}
        pendingTables={pendingTables}
        sourcesCount={sources.length}
        itemsCount={items.length}
        reviewQueueCount={reviewQueue.length}
      />

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

                  <form onSubmit={createKnowledgeDraft} className="grid gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-950/10 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-indigo-100">선택 Source로 Knowledge Card 초안 만들기</h4>
                        <p className="mt-1 text-[11px] leading-relaxed text-gray-500">자동 생성이 아니라 사람이 입력한 값을 knowledge_items에 저장하고 Review Queue pending으로 보냅니다.</p>
                      </div>
                      <button
                        type="button"
                        onClick={fillDraftFromSource}
                        className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-[11px] font-bold text-indigo-200 hover:bg-indigo-500/20"
                      >
                        Source 내용 채우기
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-1 text-xs font-bold text-gray-300">
                        제목 <span className="text-indigo-300">*</span>
                        <input
                          value={draftTitle}
                          onChange={(event) => setDraftTitle(event.target.value)}
                          placeholder="카드 제목"
                          className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs font-normal text-gray-100 outline-none placeholder:text-gray-600"
                        />
                      </label>
                      <label className="space-y-1 text-xs font-bold text-gray-300">
                        카테고리 <span className="text-indigo-300">*</span>
                        <input
                          value={draftCategory}
                          onChange={(event) => setDraftCategory(event.target.value)}
                          placeholder="예: 소비 트렌드, 리테일, 미디어"
                          className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs font-normal text-gray-100 outline-none placeholder:text-gray-600"
                        />
                      </label>
                    </div>

                    <label className="space-y-1 text-xs font-bold text-gray-300">
                      한 줄 요약 <span className="text-indigo-300">*</span>
                      <input
                        value={draftSummary}
                        onChange={(event) => setDraftSummary(event.target.value)}
                        placeholder="RFP나 제안서에서 재사용 가능한 한 문장"
                        className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs font-normal text-gray-100 outline-none placeholder:text-gray-600"
                      />
                    </label>

                    <label className="space-y-1 text-xs font-bold text-gray-300">
                      본문/활용 메모 <span className="text-indigo-300">*</span>
                      <textarea
                        value={draftBody}
                        onChange={(event) => setDraftBody(event.target.value)}
                        placeholder="근거, 해석, 제안서 활용 맥락을 사람이 정리해서 입력"
                        rows={5}
                        className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs font-normal leading-relaxed text-gray-100 outline-none placeholder:text-gray-600"
                      />
                    </label>

                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="space-y-1 text-xs font-bold text-gray-300">
                        타입
                        <select value={draftItemType} onChange={(event) => setDraftItemType(event.target.value)} className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs font-normal text-gray-100">
                          {itemTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
                        </select>
                      </label>
                      <label className="space-y-1 text-xs font-bold text-gray-300">
                        근거 수준
                        <select value={draftEvidenceLevel} onChange={(event) => setDraftEvidenceLevel(event.target.value)} className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs font-normal text-gray-100">
                          {evidenceLevelOptions.map((level) => <option key={level} value={level}>{evidenceLabel[level] ?? level}</option>)}
                        </select>
                      </label>
                      <label className="space-y-1 text-xs font-bold text-gray-300">
                        재사용 등급
                        <select value={draftReuseGrade} onChange={(event) => setDraftReuseGrade(event.target.value)} className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs font-normal text-gray-100">
                          {reuseGradeOptions.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                        </select>
                      </label>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="space-y-1 text-xs font-bold text-gray-300">
                        RFP 활용 위치
                        <select value={draftRfpUse} onChange={(event) => setDraftRfpUse(event.target.value)} className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs font-normal text-gray-100">
                          {rfpUseOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </label>
                      <label className="space-y-1 text-xs font-bold text-gray-300">
                        타깃
                        <input
                          value={draftTargetAudience}
                          onChange={(event) => setDraftTargetAudience(event.target.value)}
                          placeholder="예: Z세대, B2B 의사결정자"
                          className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs font-normal text-gray-100 outline-none placeholder:text-gray-600"
                        />
                      </label>
                      <label className="space-y-1 text-xs font-bold text-gray-300">
                        Queue 우선순위
                        <select value={draftQueuePriority} onChange={(event) => setDraftQueuePriority(event.target.value)} className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs font-normal text-gray-100">
                          {['normal', 'high', 'urgent', 'low'].map((priority) => <option key={priority} value={priority}>{priorityLabel[priority] ?? priority}</option>)}
                        </select>
                      </label>
                    </div>

                    <label className="space-y-1 text-xs font-bold text-gray-300">
                      검토 메모
                      <input
                        value={draftReviewNotes}
                        onChange={(event) => setDraftReviewNotes(event.target.value)}
                        placeholder="검토자가 확인해야 할 포인트"
                        className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs font-normal text-gray-100 outline-none placeholder:text-gray-600"
                      />
                    </label>

                    <div className="flex flex-col gap-2 border-t border-gray-800 pt-3 md:flex-row md:items-center md:justify-between">
                      <p className="text-[11px] text-gray-500">저장 순서: knowledge_items 생성 → knowledge_review_queue pending 등록.</p>
                      <button
                        type="submit"
                        disabled={savingKnowledgeDraft || !draftTitle.trim() || !draftSummary.trim() || !draftBody.trim() || !draftCategory.trim()}
                        className="rounded-lg bg-indigo-500/10 px-4 py-2 text-xs font-bold text-indigo-200 hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {savingKnowledgeDraft ? '초안 저장 중...' : '초안 저장 후 검토 대기 등록'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : <div className="text-xs text-gray-500">Source를 선택해줘.</div>}
            </div>
          </div>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <section className="rounded-2xl border border-gray-800 bg-gray-950/40 p-4">
          <div className="mb-3 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white">Review Queue</h2>
                <p className="mt-1 text-[11px] text-gray-500">knowledge_review_queue 상태별 필터와 우선순위 순서로 후보 지식 카드를 검토합니다.</p>
              </div>
              <select
                value={queueStatusFilter}
                onChange={(event) => setQueueStatusFilter(event.target.value as QueueStatusFilter)}
                className="rounded-lg border border-gray-800 bg-gray-950 px-2 py-1 text-[11px] text-gray-300"
              >
                {queueStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
              <span className="rounded-full bg-gray-900 px-2.5 py-1 font-bold text-gray-300">전체 {reviewQueue.length}건</span>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-1 font-bold text-amber-200">대기 {queueStatusCounts.pending}건</span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-bold text-emerald-200">승인 {queueStatusCounts.approved}건</span>
              <span className="rounded-full bg-yellow-500/10 px-2.5 py-1 font-bold text-yellow-200">수정 {queueStatusCounts.needs_revision}건</span>
              <span className="rounded-full bg-red-500/10 px-2.5 py-1 font-bold text-red-200">반려 {queueStatusCounts.rejected}건</span>
            </div>
          </div>

          <div className="space-y-2">
            {reviewQueue.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-800 p-4 text-xs leading-relaxed text-gray-500">
                검토 대기열이 비어 있어. 아직 검토할 지식 카드가 생성되지 않았거나 모든 후보가 다른 저장소에만 있어.
              </div>
            ) : filteredReviewQueue.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-800 p-4 text-xs leading-relaxed text-gray-500">
                현재 선택한 상태 필터에 맞는 Review Queue 항목이 없어. 상단 필터를 전체나 다른 상태로 바꿔줘.
              </div>
            ) : filteredReviewQueue.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelectedItemId(row.knowledge_items?.id ?? row.item_id)}
                className={`w-full rounded-xl border p-3 text-left transition ${selectedQueueRow?.id === row.id ? 'border-cyan-500/50 bg-cyan-950/20' : 'border-gray-800 bg-gray-900/50 hover:border-cyan-500/30 hover:bg-gray-900'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">우선순위 {priorityLabel[row.priority] ?? row.priority}</span>
                  <span className="rounded-full bg-gray-950 px-2 py-0.5 text-[10px] text-gray-400">{statusLabel[row.queue_status] ?? row.queue_status}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-semibold text-gray-100">{row.knowledge_items?.title ?? row.item_id}</p>
                <p className="mt-1 line-clamp-2 text-[11px] text-gray-500">{row.knowledge_items?.one_line_summary ?? row.notes ?? '요약 없음'}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-gray-600">
                  <span>생성 {formatDate(row.created_at)}</span>
                  {row.notes && <span>· 메모 있음</span>}
                </div>
              </button>
            ))}
          </div>

          {selectedQueueRow && (
            <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-3 text-xs leading-relaxed text-gray-300">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-bold text-cyan-200">선택 항목 상세</span>
                <Badge>{statusLabel[selectedQueueRow.queue_status] ?? selectedQueueRow.queue_status}</Badge>
                <Badge>우선순위 {priorityLabel[selectedQueueRow.priority] ?? selectedQueueRow.priority}</Badge>
                <Badge>{formatDate(selectedQueueRow.created_at)}</Badge>
              </div>
              <p className="font-semibold text-gray-100">{selectedQueueRow.knowledge_items?.title ?? selectedQueueRow.item_id}</p>
              <p className="mt-1 text-gray-500">{selectedQueueRow.notes || selectedQueueRow.knowledge_items?.one_line_summary || '검토 메모가 아직 없어.'}</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-800 bg-gray-950/40 p-4">
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Knowledge Cards</h2>
              <p className="mt-1 text-[11px] text-gray-500">Supabase knowledge_items에 저장된 카드 목록을 검색/필터/정렬합니다.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-gray-500">
              <span className="rounded-full bg-indigo-500/10 px-3 py-1 font-bold text-indigo-200">전체 {items.length}건</span>
              <span className="rounded-full bg-gray-900 px-3 py-1 font-bold text-gray-300">필터 결과 {filteredItems.length}건</span>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-gray-800 bg-gray-950/50 p-3">
            <div className="grid gap-2 xl:grid-cols-[1.3fr_0.8fr_0.9fr_1fr_0.7fr_0.9fr_0.8fr]">
              <div className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2">
                <Search className="h-4 w-4 text-gray-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="제목, 요약, 본문, 타깃, RFP 위치 검색"
                  className="w-full bg-transparent text-xs text-gray-200 outline-none placeholder:text-gray-600"
                />
              </div>
              <select
                value={itemTypeFilter}
                onChange={(event) => setItemTypeFilter(event.target.value)}
                className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-300"
              >
                <option value="all">전체 타입</option>
                {itemTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
              <select
                value={itemReviewStatusFilter}
                onChange={(event) => setItemReviewStatusFilter(event.target.value)}
                className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-300"
              >
                <option value="all">전체 검토상태</option>
                {itemReviewStatuses.map((status) => <option key={status} value={status}>{statusLabel[status] ?? status}</option>)}
              </select>
              <select
                value={itemEvidenceLevelFilter}
                onChange={(event) => setItemEvidenceLevelFilter(event.target.value)}
                className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-300"
              >
                <option value="all">전체 근거수준</option>
                {itemEvidenceLevels.map((level) => <option key={level} value={level}>{evidenceLabel[level] ?? level}</option>)}
              </select>
              <select
                value={itemReuseGradeFilter}
                onChange={(event) => setItemReuseGradeFilter(event.target.value)}
                className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-300"
              >
                <option value="all">전체 등급</option>
                {itemReuseGrades.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
              </select>
              <select
                value={itemCategoryFilter}
                onChange={(event) => setItemCategoryFilter(event.target.value)}
                className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-300"
              >
                <option value="all">전체 카테고리</option>
                {itemCategories.map((category) => (
                  <option key={category} value={category}>{category === categoryUnassignedValue ? '미지정' : category}</option>
                ))}
              </select>
              <select
                value={itemSort}
                onChange={(event) => setItemSort(event.target.value as KnowledgeSort)}
                className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-300"
              >
                <option value="newest">최신순</option>
                <option value="title">제목순</option>
                <option value="grade">등급순</option>
              </select>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-500">
              <span>전체 {items.length}건</span>
              <span>·</span>
              <span>필터 결과 {filteredItems.length}건</span>
              {itemFiltersActive && (
                <button
                  type="button"
                  onClick={resetItemFilters}
                  className="font-bold text-indigo-300 hover:underline"
                >
                  필터 초기화
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
            <div className="max-h-[540px] space-y-2 overflow-y-auto pr-1">
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-800 p-5 text-xs leading-relaxed text-gray-500">
                  아직 DB에 저장된 지식 카드가 없어. Source 기반 생성이나 수동 입력으로 knowledge_items가 생기면 여기에 표시돼.
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-800 p-5 text-xs leading-relaxed text-gray-500">
                  현재 검색어/필터 조건에 맞는 지식 카드가 없어. 타입, 검토상태, 근거수준, 등급, 카테고리 필터를 조정해줘.
                </div>
              ) : filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${visibleSelectedItem?.id === item.id ? 'border-cyan-500/50 bg-cyan-950/20' : 'border-gray-800 bg-gray-900/40 hover:border-gray-700'}`}
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] text-gray-500">
                    <span className="font-bold uppercase text-indigo-300">{item.item_type}</span>
                    <span className="rounded-full bg-gray-950 px-2 py-0.5 font-bold text-gray-400">{item.reuse_grade}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] text-gray-500">
                    <span>{statusLabel[item.review_status] ?? item.review_status}</span>
                    <span>·</span>
                    <span>{evidenceLabel[item.evidence_level] ?? item.evidence_level}</span>
                    <span>·</span>
                    <span>{item.category ?? '미지정'}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-bold text-gray-100">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-gray-500">{item.one_line_summary}</p>
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
              {items.length > 0 && filteredItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-800 p-8 text-center text-sm text-gray-500">
                  선택 가능한 필터 결과가 없어. 조건을 초기화하거나 다른 필터를 선택해줘.
                </div>
              ) : visibleSelectedItem ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      <Badge>{visibleSelectedItem.item_type}</Badge>
                      <Badge>{statusLabel[visibleSelectedItem.review_status] ?? visibleSelectedItem.review_status}</Badge>
                      <Badge>{evidenceLabel[visibleSelectedItem.evidence_level] ?? visibleSelectedItem.evidence_level}</Badge>
                      <Badge>재사용 {visibleSelectedItem.reuse_grade}</Badge>
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-white">{visibleSelectedItem.title}</h3>
                    <p className="mt-2 rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3 text-sm leading-relaxed text-indigo-100">{visibleSelectedItem.one_line_summary}</p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <InfoBox label="카테고리" value={visibleSelectedItem.category ?? '미지정'} />
                    <InfoBox label="타깃" value={visibleSelectedItem.target_audience ?? '미지정'} />
                    <InfoBox label="RFP 활용" value={visibleSelectedItem.rfp_use} />
                  </div>

                  <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">본문/활용 메모</h4>
                    <p className="whitespace-pre-wrap rounded-xl border border-gray-800 bg-gray-950/60 p-4 text-xs leading-relaxed text-gray-300">
                      {visibleSelectedItem.body || '본문이 아직 없어. 검토 전에 근거와 사용 맥락을 채워야 해.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-500"><Tags className="h-3.5 w-3.5" /> 리스크 플래그</h4>
                    <div className="flex flex-wrap gap-2">
                      {(visibleSelectedItem.risk_flags?.length ? visibleSelectedItem.risk_flags : ['none']).map((flag) => <Badge key={flag}>{flag}</Badge>)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-gray-800 pt-4">
                    {reviewQueue.filter((row) => row.item_id === visibleSelectedItem.id).map((row) => (
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
                    {!reviewQueue.some((row) => row.item_id === visibleSelectedItem.id) && (
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

function ConnectionAuditPanel({
  state,
  connectedTables,
  pendingTables,
  sourcesCount,
  itemsCount,
  reviewQueueCount,
}: {
  state: ConnectionState;
  connectedTables: string[];
  pendingTables: string[];
  sourcesCount: number;
  itemsCount: number;
  reviewQueueCount: number;
}) {
  const totalRows = sourcesCount + itemsCount + reviewQueueCount;
  const stateCopy: Record<ConnectionState, { label: string; tone: string; description: string }> = {
    checking: {
      label: '연결 확인 중',
      tone: 'border-cyan-500/20 bg-cyan-950/20 text-cyan-100',
      description: 'Supabase에서 지식 테이블 3개의 읽기 상태를 확인하고 있어.',
    },
    connected_empty: {
      label: 'DB 연결됨 · 데이터 0건',
      tone: 'border-amber-500/20 bg-amber-950/20 text-amber-100',
      description: '권한/스키마 오류는 아니고, 현재 연결된 지식 테이블에 표시할 row가 없는 상태야.',
    },
    connected_with_data: {
      label: 'DB 연결됨 · 데이터 표시 가능',
      tone: 'border-emerald-500/20 bg-emerald-950/20 text-emerald-100',
      description: 'Supabase 조회가 성공했고 실제 row가 화면에 반영되고 있어.',
    },
    auth_or_rls_error: {
      label: '권한 확인 필요',
      tone: 'border-red-500/20 bg-red-950/20 text-red-100',
      description: '테이블은 있지만 로그인 세션, JWT, 또는 RLS 정책 때문에 조회가 막힌 상태야.',
    },
    schema_error: {
      label: '스키마 확인 필요',
      tone: 'border-red-500/20 bg-red-950/20 text-red-100',
      description: '프론트가 기대하는 지식 테이블/컬럼이 Supabase에 없거나 이름이 다른 상태야.',
    },
    unknown_error: {
      label: '알 수 없는 연결 오류',
      tone: 'border-red-500/20 bg-red-950/20 text-red-100',
      description: 'Supabase 요청이 실패했어. 아래 오류 메시지를 기준으로 추가 확인이 필요해.',
    },
  };
  const current = stateCopy[state];

  return (
    <section className={`rounded-2xl border p-4 ${current.tone}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold">
            <ShieldCheck className="h-4 w-4" />
            {current.label}
          </div>
          <p className="mt-1 text-xs opacity-80">{current.description}</p>
          <p className="mt-2 text-[11px] opacity-70">
            현재 화면은 연결된 3개 테이블 합계 {totalRows}건을 기준으로 표시해. 데이터 0건은 연결 실패가 아니라 빈 DB 상태로 구분해.
          </p>
        </div>
        <div className="grid gap-3 text-[11px] md:grid-cols-2 lg:w-[560px]">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="mb-2 font-bold text-white/90">현재 화면 연결</p>
            <div className="flex flex-wrap gap-1.5">
              {connectedTables.map((table) => <Badge key={table}>{table}</Badge>)}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="mb-2 font-bold text-white/90">아직 화면 미연결</p>
            <div className="flex flex-wrap gap-1.5">
              {pendingTables.map((table) => <Badge key={table}>{table}</Badge>)}
            </div>
          </div>
        </div>
      </div>
    </section>
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
