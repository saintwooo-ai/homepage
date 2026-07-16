import React, { useMemo, useState } from 'react';
import { AlertCircle, BookOpen, Database, Eye, FileText, Filter, RefreshCw, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { useKnowledgeReadOnlyData, type KnowledgeItemReadModel, type KnowledgeSourceReadModel } from '../../services/workConsoleKnowledgeReadOnly';

const statusLabel: Record<string, string> = {
  inbox: '정리 필요',
  reviewed: '검토됨',
  approved: '승인 완료',
  needs_verification: '검증 필요',
  rejected: '반려',
  deprecated: '삭제 후보',
};

const evidenceLabel: Record<string, string> = {
  official: '공식',
  reported: '보도',
  data_backed: '데이터',
  inferred: '추정',
  unverified_original: '원문 미검증',
  needs_verification: '검증 필요',
};

const gradeTone: Record<string, string> = {
  A: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  B: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
  C: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  D: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' });
};

const uniqueSorted = (values: Array<string | null | undefined>) => Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b, 'ko'));

const sourceName = (source?: KnowledgeSourceReadModel) => {
  if (!source) return '출처 없음';
  return [source.publisher, source.title].filter(Boolean).join(' · ') || source.source_type;
};

function MiniBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${className || 'border-gray-700 bg-gray-900 text-gray-300'}`}>{children}</span>;
}

function KpiCard({ label, value, helper, active, onClick }: { label: string; value: number; helper: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${active ? 'border-cyan-400/60 bg-cyan-500/15' : 'border-gray-800 bg-gray-950/45 hover:border-cyan-500/30 hover:bg-gray-900/60'}`}
    >
      <div className="text-[11px] font-black uppercase tracking-wider text-gray-500">{label}</div>
      <div className="mt-2 font-mono text-3xl font-black text-white">{value}</div>
      <div className="mt-1 text-[11px] text-gray-500">{helper}</div>
    </button>
  );
}

function DetailDrawer({ item, source, onClose }: { item: KnowledgeItemReadModel | null; source?: KnowledgeSourceReadModel; onClose: () => void }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-gray-950/70 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button type="button" aria-label="닫기" className="flex-1 cursor-default" onClick={onClose} />
      <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-gray-800 bg-gray-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <MiniBadge>{item.item_type}</MiniBadge>
              <MiniBadge className={gradeTone[item.reuse_grade] ?? ''}>등급 {item.reuse_grade}</MiniBadge>
              <MiniBadge>{statusLabel[item.review_status] ?? item.review_status}</MiniBadge>
            </div>
            <h3 className="mt-4 text-xl font-black leading-tight text-white">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-gray-400">{item.one_line_summary || '요약이 아직 없습니다.'}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-gray-800 px-3 py-2 text-xs font-bold text-gray-300 hover:border-cyan-500/40">닫기</button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3">
            <div className="font-mono text-[10px] uppercase text-gray-600">created</div>
            <div className="mt-1 text-sm font-bold text-gray-200">{formatDate(item.created_at)}</div>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3">
            <div className="font-mono text-[10px] uppercase text-gray-600">updated</div>
            <div className="mt-1 text-sm font-bold text-gray-200">{formatDate(item.updated_at)}</div>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3">
            <div className="font-mono text-[10px] uppercase text-gray-600">evidence</div>
            <div className="mt-1 text-sm font-bold text-gray-200">{evidenceLabel[item.evidence_level] ?? item.evidence_level}</div>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3">
            <div className="font-mono text-[10px] uppercase text-gray-600">rfp use</div>
            <div className="mt-1 text-sm font-bold text-gray-200">{item.rfp_use}</div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <section className="rounded-2xl border border-gray-800 bg-gray-900/35 p-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">출처</h4>
            <p className="mt-2 text-sm font-bold text-gray-100">{sourceName(source)}</p>
            {source?.summary && <p className="mt-2 text-xs leading-5 text-gray-500">{source.summary}</p>}
          </section>
          <section className="rounded-2xl border border-gray-800 bg-gray-900/35 p-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">분류 메모</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              <MiniBadge>카테고리 {item.category ?? '미지정'}</MiniBadge>
              <MiniBadge>타깃 {item.target_audience ?? '미지정'}</MiniBadge>
              <MiniBadge>브랜드 {item.brand ?? '미지정'}</MiniBadge>
              <MiniBadge>시장 {item.market ?? '미지정'}</MiniBadge>
            </div>
          </section>
          <section className="rounded-2xl border border-amber-500/20 bg-amber-950/10 p-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-200">쓰기 기능 잠금</h4>
            <p className="mt-2 text-xs leading-5 text-amber-100/75">현재 단계에서는 등급 변경, 상태 변경, 삭제 후보 이동을 실제 DB에 기록하지 않습니다. 이 패널은 실제 DB 값을 읽어서 보여주는 용도입니다.</p>
          </section>
        </div>
      </aside>
    </div>
  );
}

export default function WorkConsoleKnowledgePanel() {
  const data = useKnowledgeReadOnlyData();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'needs' | 'approved' | 'high' | 'removal'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sourcesById = useMemo(() => new Map(data.sources.map((source) => [source.id, source])), [data.sources]);
  const sourceTypes = useMemo(() => uniqueSorted(data.sources.map((source) => source.source_type)), [data.sources]);
  const itemTypes = useMemo(() => uniqueSorted(data.items.map((item) => item.item_type)), [data.items]);
  const statuses = useMemo(() => uniqueSorted(data.items.map((item) => item.review_status)), [data.items]);
  const grades = useMemo(() => uniqueSorted(data.items.map((item) => item.reuse_grade)), [data.items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.items.filter((item) => {
      const source = item.source_id ? sourcesById.get(item.source_id) : undefined;
      const matchesQuery = !q || [item.title, item.one_line_summary, item.category, item.target_audience, item.rfp_use, item.evidence_level, item.brand, item.market, source?.title, source?.publisher]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
      const matchesStatus = statusFilter === 'all' || item.review_status === statusFilter;
      const matchesGrade = gradeFilter === 'all' || item.reuse_grade === gradeFilter;
      const matchesType = typeFilter === 'all' || item.item_type === typeFilter;
      const matchesSource = sourceFilter === 'all' || source?.source_type === sourceFilter;
      const matchesQuick = quickFilter === 'all'
        || (quickFilter === 'needs' && (['inbox', 'needs_verification'].includes(item.review_status) || item.rfp_use === 'needs_review'))
        || (quickFilter === 'approved' && item.review_status === 'approved')
        || (quickFilter === 'high' && item.reuse_grade === 'A')
        || (quickFilter === 'removal' && (['deprecated', 'rejected'].includes(item.review_status) || item.reuse_grade === 'D'));
      return matchesQuery && matchesStatus && matchesGrade && matchesType && matchesSource && matchesQuick;
    });
  }, [data.items, gradeFilter, query, quickFilter, sourceFilter, sourcesById, statusFilter, typeFilter]);

  const selectedItem = filteredItems.find((item) => item.id === selectedId) ?? data.items.find((item) => item.id === selectedId) ?? null;
  const selectedSource = selectedItem?.source_id ? sourcesById.get(selectedItem.source_id) : undefined;
  const noCardsYet = data.counts.totalItems === 0;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-gray-950 via-gray-900 to-cyan-950/20 p-5 shadow-2xl shadow-cyan-950/10">
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-widest text-cyan-300">
              <Database className="h-4 w-4" />
              Mimir Knowledge DB · UI read-only
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-white">지식 정리 콘솔</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-gray-400">
              Supabase의 실제 `knowledge_*` 테이블 값을 읽어 상단 필터 카드, 상세 필터, 지식 테이블, 지식보기 패널로 보여줍니다. 현재 화면에서는 DB 기록/삭제를 실행하지 않습니다.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row lg:flex-col xl:flex-row">
            <button
              type="button"
              onClick={() => void data.reload()}
              disabled={data.loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-400/20 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${data.loading ? 'animate-spin' : ''}`} />
              DB 새로고침
            </button>
            <div className="rounded-2xl border border-gray-800 bg-gray-950/55 px-4 py-2 text-[11px] leading-5 text-gray-400">
              상태: <span className="font-bold text-cyan-200">{data.connectionState}</span><br />
              갱신: {data.fetchedAt ? formatDate(data.fetchedAt) : '대기'}
            </div>
          </div>
        </div>

        {!data.isConfigured && (
          <div className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-950/20 p-4 text-sm text-amber-100">
            <div className="flex items-center gap-2 font-bold"><AlertCircle className="h-4 w-4" /> Supabase 연결 정보가 없어 실제 DB를 읽을 수 없습니다.</div>
            <p className="mt-1 text-xs text-amber-100/75">VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 설정이 필요합니다. 이 화면은 가짜 숫자로 대체하지 않습니다.</p>
          </div>
        )}

        {data.errorMessage && (
          <div className="mt-4 rounded-2xl border border-rose-500/25 bg-rose-950/20 p-4 text-sm text-rose-100">
            <div className="flex items-center gap-2 font-bold"><AlertCircle className="h-4 w-4" /> DB read 오류</div>
            <p className="mt-1 text-xs text-rose-100/75">{data.errorMessage}</p>
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard label="전체 지식" value={data.counts.totalItems} helper="knowledge_items exact count" active={quickFilter === 'all'} onClick={() => setQuickFilter('all')} />
          <KpiCard label="정리 필요" value={data.counts.needsCuration} helper="inbox / needs_review" active={quickFilter === 'needs'} onClick={() => setQuickFilter('needs')} />
          <KpiCard label="승인 완료" value={data.counts.approved} helper="approved" active={quickFilter === 'approved'} onClick={() => setQuickFilter('approved')} />
          <KpiCard label="고등급" value={data.counts.highGrade} helper="reuse_grade A" active={quickFilter === 'high'} onClick={() => setQuickFilter('high')} />
          <KpiCard label="삭제 후보" value={data.counts.removalCandidates} helper="rejected / deprecated / D" active={quickFilter === 'removal'} onClick={() => setQuickFilter('removal')} />
        </div>

        <div className="mt-4 grid gap-3 rounded-2xl border border-gray-800 bg-gray-950/45 p-4 lg:grid-cols-[1.3fr_repeat(4,minmax(0,0.7fr))_auto]">
          <label className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-950 px-3 py-2">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="지식명, 요약, 출처 검색"
              className="w-full bg-transparent text-xs text-gray-200 outline-none placeholder:text-gray-600"
            />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} disabled={statuses.length === 0} className="rounded-xl border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-300 disabled:opacity-40">
            <option value="all">전체 상태</option>
            {statuses.map((status) => <option key={status} value={status}>{statusLabel[status] ?? status}</option>)}
          </select>
          <select value={gradeFilter} onChange={(event) => setGradeFilter(event.target.value)} disabled={grades.length === 0} className="rounded-xl border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-300 disabled:opacity-40">
            <option value="all">전체 등급</option>
            {grades.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
          </select>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} disabled={itemTypes.length === 0} className="rounded-xl border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-300 disabled:opacity-40">
            <option value="all">전체 유형</option>
            {itemTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} disabled={sourceTypes.length === 0} className="rounded-xl border border-gray-800 bg-gray-950 px-3 py-2 text-xs text-gray-300 disabled:opacity-40">
            <option value="all">전체 출처</option>
            {sourceTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <button type="button" onClick={() => { setQuery(''); setStatusFilter('all'); setGradeFilter('all'); setTypeFilter('all'); setSourceFilter('all'); setQuickFilter('all'); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-800 bg-gray-900 px-3 py-2 text-xs font-bold text-gray-300 hover:border-cyan-500/40">
            <Filter className="h-4 w-4" /> 초기화
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-500">
          <MiniBadge><FileText className="mr-1 h-3 w-3" /> Source {data.counts.sources}</MiniBadge>
          <MiniBadge><ShieldCheck className="mr-1 h-3 w-3" /> Review Queue {data.counts.queue}</MiniBadge>
          <MiniBadge>목록 표시 {filteredItems.length}</MiniBadge>
          {noCardsYet && data.counts.sources > 0 && <span className="text-amber-200">원문 자료는 있지만 아직 지식카드는 없습니다.</span>}
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-800 bg-gray-950/40">
          <div className="grid grid-cols-[minmax(280px,1.8fr)_0.7fr_0.7fr_0.5fr_0.9fr_0.7fr_0.8fr] gap-3 border-b border-gray-800 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-gray-500">
            <span>지식명</span><span>유형</span><span>상태</span><span>등급</span><span>출처</span><span>생성일</span><span>작업</span>
          </div>
          {noCardsYet ? (
            <div className="p-8 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-gray-700" />
              <h3 className="mt-3 text-sm font-bold text-gray-200">아직 지식카드가 없습니다.</h3>
              <p className="mt-2 text-xs leading-5 text-gray-500">DB read는 실제 값 기준입니다. 현재 `knowledge_items` exact count가 0이라 가짜 샘플을 표시하지 않습니다.</p>
              <p className="mt-1 text-xs text-gray-600">Source inbox: {data.counts.sources}건</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">현재 필터 결과가 0건입니다. 전체 지식카드는 {data.counts.totalItems}건입니다.</div>
          ) : filteredItems.map((item) => {
            const source = item.source_id ? sourcesById.get(item.source_id) : undefined;
            return (
              <div key={item.id} className="grid grid-cols-[minmax(280px,1.8fr)_0.7fr_0.7fr_0.5fr_0.9fr_0.7fr_0.8fr] items-center gap-3 border-b border-gray-900 px-4 py-4 text-xs last:border-b-0">
                <div className="min-w-0">
                  <div className="truncate font-bold text-gray-100">{item.title}</div>
                  <div className="mt-1 line-clamp-2 text-[11px] leading-5 text-gray-500">{item.one_line_summary || '요약 없음'}</div>
                </div>
                <span className="text-gray-300">{item.item_type}</span>
                <MiniBadge>{statusLabel[item.review_status] ?? item.review_status}</MiniBadge>
                <MiniBadge className={gradeTone[item.reuse_grade] ?? ''}>{item.reuse_grade}</MiniBadge>
                <span className="line-clamp-2 text-[11px] text-gray-500">{sourceName(source)}</span>
                <span className="font-mono text-[11px] text-gray-500">{formatDate(item.created_at)}</span>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setSelectedId(item.id)} className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2 py-1 text-[11px] font-bold text-cyan-200 hover:bg-cyan-500/20"><Eye className="h-3 w-3" />보기</button>
                  <button type="button" disabled className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-gray-800 bg-gray-900/70 px-2 py-1 text-[11px] font-bold text-gray-600"><Trash2 className="h-3 w-3" />삭제 잠금</button>
                </div>
              </div>
            );
          })}
        </div>

        {data.sources.length > 0 && (
          <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-950/10 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] font-black uppercase tracking-widest text-amber-200">Source inbox · read-only</div>
                <h3 className="mt-1 text-sm font-black text-white">지식카드 생성 대기 원문</h3>
                <p className="mt-1 text-xs leading-5 text-amber-100/70">현재 DB에 들어온 원문 자료입니다. 다음 단계에서 이 source를 지식카드 후보로 변환하고 review queue에 넣는 쓰기 플로우를 연결합니다.</p>
              </div>
              <button type="button" disabled className="inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-amber-500/20 bg-gray-950/70 px-3 py-2 text-xs font-black text-gray-600">
                지식카드 생성 잠금
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {data.sources.map((source) => (
                <div key={source.id} className="rounded-xl border border-gray-800 bg-gray-950/55 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <MiniBadge>{source.source_type}</MiniBadge>
                        {source.publisher && <MiniBadge>{source.publisher}</MiniBadge>}
                      </div>
                      <div className="mt-2 truncate text-sm font-bold text-gray-100">{source.title}</div>
                      {source.summary && <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-gray-500">{source.summary}</p>}
                    </div>
                    <div className="shrink-0 font-mono text-[11px] text-gray-500">수집 {formatDate(source.collected_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DetailDrawer item={selectedItem} source={selectedSource} onClose={() => setSelectedId(null)} />
    </section>
  );
}
