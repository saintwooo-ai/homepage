import { useCallback, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export type KnowledgeReadConnectionState = 'not_configured' | 'loading' | 'ready' | 'empty' | 'auth_or_rls_error' | 'schema_error' | 'unknown_error';

export type KnowledgeSourceReadModel = {
  id: string;
  source_type: string;
  title: string;
  publisher: string | null;
  summary: string | null;
  collected_at: string;
};

export type KnowledgeItemReadModel = {
  id: string;
  item_type: string;
  title: string;
  one_line_summary: string;
  category: string | null;
  target_audience: string | null;
  rfp_use: string;
  evidence_level: string;
  review_status: string;
  reuse_grade: string;
  updated_at: string;
  created_at: string;
  source_id: string | null;
  brand: string | null;
  market: string | null;
};

export type KnowledgeQueueReadModel = {
  id: string;
  item_id: string;
  source_id: string | null;
  queue_status: string;
  priority: string;
  notes: string | null;
  created_at: string;
};

export type KnowledgeCounts = {
  totalItems: number;
  needsCuration: number;
  approved: number;
  highGrade: number;
  removalCandidates: number;
  sources: number;
  queue: number;
};

export type KnowledgeReadData = {
  connectionState: KnowledgeReadConnectionState;
  errorMessage: string | null;
  fetchedAt: string | null;
  isConfigured: boolean;
  loading: boolean;
  counts: KnowledgeCounts;
  items: KnowledgeItemReadModel[];
  sources: KnowledgeSourceReadModel[];
  queue: KnowledgeQueueReadModel[];
  reload: () => Promise<void>;
};

const zeroCounts: KnowledgeCounts = {
  totalItems: 0,
  needsCuration: 0,
  approved: 0,
  highGrade: 0,
  removalCandidates: 0,
  sources: 0,
  queue: 0,
};

const toCount = (value: number | null | undefined) => value ?? 0;

const classifyError = (message: string): KnowledgeReadConnectionState => {
  const lower = message.toLowerCase();
  if (lower.includes('does not exist') || lower.includes('schema')) return 'schema_error';
  if (lower.includes('permission denied') || lower.includes('jwt') || lower.includes('row-level security') || lower.includes('rls')) return 'auth_or_rls_error';
  return 'unknown_error';
};

const truncate = (value: string | null, maxLength = 220) => {
  if (!value) return null;
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
};

export function useKnowledgeReadOnlyData(): KnowledgeReadData {
  const [connectionState, setConnectionState] = useState<KnowledgeReadConnectionState>(isSupabaseConfigured ? 'loading' : 'not_configured');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<KnowledgeCounts>(zeroCounts);
  const [items, setItems] = useState<KnowledgeItemReadModel[]>([]);
  const [sources, setSources] = useState<KnowledgeSourceReadModel[]>([]);
  const [queue, setQueue] = useState<KnowledgeQueueReadModel[]>([]);

  const reload = useCallback(async () => {
    if (!supabase) {
      setConnectionState('not_configured');
      setErrorMessage('Supabase 연결 정보가 없어 실제 DB를 읽을 수 없습니다.');
      setCounts(zeroCounts);
      setItems([]);
      setSources([]);
      setQueue([]);
      return;
    }

    setLoading(true);
    setConnectionState('loading');
    setErrorMessage(null);

    const [
      totalItems,
      needsCuration,
      approved,
      highGrade,
      removalCandidates,
      sourcesCount,
      queueCount,
      itemsResult,
      sourcesResult,
      queueResult,
    ] = await Promise.all([
      supabase.from('knowledge_items').select('id', { count: 'exact', head: true }),
      supabase.from('knowledge_items').select('id', { count: 'exact', head: true }).or('review_status.eq.inbox,review_status.eq.needs_verification,rfp_use.eq.needs_review'),
      supabase.from('knowledge_items').select('id', { count: 'exact', head: true }).eq('review_status', 'approved'),
      supabase.from('knowledge_items').select('id', { count: 'exact', head: true }).eq('reuse_grade', 'A'),
      supabase.from('knowledge_items').select('id', { count: 'exact', head: true }).or('review_status.eq.deprecated,review_status.eq.rejected,reuse_grade.eq.D'),
      supabase.from('knowledge_sources').select('id', { count: 'exact', head: true }),
      supabase.from('knowledge_review_queue').select('id', { count: 'exact', head: true }),
      supabase
        .from('knowledge_items')
        .select('id,item_type,title,one_line_summary,category,target_audience,rfp_use,evidence_level,review_status,reuse_grade,updated_at,created_at,source_id,brand,market')
        .order('updated_at', { ascending: false })
        .limit(100),
      supabase
        .from('knowledge_sources')
        .select('id,source_type,title,publisher,summary,collected_at')
        .order('collected_at', { ascending: false })
        .limit(50),
      supabase
        .from('knowledge_review_queue')
        .select('id,item_id,source_id,queue_status,priority,notes,created_at')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    const firstError = totalItems.error
      ?? needsCuration.error
      ?? approved.error
      ?? highGrade.error
      ?? removalCandidates.error
      ?? sourcesCount.error
      ?? queueCount.error
      ?? itemsResult.error
      ?? sourcesResult.error
      ?? queueResult.error;

    setLoading(false);

    if (firstError) {
      setConnectionState(classifyError(firstError.message));
      setErrorMessage(firstError.message);
      setCounts(zeroCounts);
      setItems([]);
      setSources([]);
      setQueue([]);
      return;
    }

    const nextCounts = {
      totalItems: toCount(totalItems.count),
      needsCuration: toCount(needsCuration.count),
      approved: toCount(approved.count),
      highGrade: toCount(highGrade.count),
      removalCandidates: toCount(removalCandidates.count),
      sources: toCount(sourcesCount.count),
      queue: toCount(queueCount.count),
    };

    const nextItems = ((itemsResult.data ?? []) as KnowledgeItemReadModel[]).map((item) => ({
      ...item,
      one_line_summary: truncate(item.one_line_summary, 180) ?? '',
    }));
    const nextSources = ((sourcesResult.data ?? []) as KnowledgeSourceReadModel[]).map((source) => ({
      ...source,
      summary: truncate(source.summary, 220),
    }));
    const nextQueue = ((queueResult.data ?? []) as KnowledgeQueueReadModel[]).map((row) => ({
      ...row,
      notes: truncate(row.notes, 160),
    }));

    setCounts(nextCounts);
    setItems(nextItems);
    setSources(nextSources);
    setQueue(nextQueue);
    setFetchedAt(new Date().toISOString());
    setConnectionState(nextCounts.totalItems === 0 ? 'empty' : 'ready');
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return useMemo(() => ({
    connectionState,
    errorMessage,
    fetchedAt,
    isConfigured: isSupabaseConfigured,
    loading,
    counts,
    items,
    sources,
    queue,
    reload,
  }), [connectionState, errorMessage, fetchedAt, loading, counts, items, sources, queue, reload]);
}
