/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence, motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCheck,
  CheckCircle2,
  Clock,
  Cpu,
  GitBranch,
  Hourglass,
  Layers3,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRoundCheck,
} from 'lucide-react';
import { MOCK_WORK_CONSOLE_SNAPSHOT } from '../data/work-console/browser';
import type { WorkConsoleSnapshot, WorkItem, WorkItemStatus } from '../types/workConsole';

interface WorkStatusColumn {
  id: WorkItemStatus;
  title: string;
  helper: string;
  icon: ReactNode;
  accentClass: string;
  emptyText: string;
}

type LocalWorkItemOverride = Partial<
  Pick<WorkItem, 'status' | 'progress' | 'currentStep' | 'nextAction' | 'updatedAt'>
> & {
  interactionLabel?: string;
};

type LocalEvent = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning';
};

const nowIso = () => new Date().toISOString();

const demoTransitions: Record<WorkItemStatus, LocalWorkItemOverride | null> = {
  queued: {
    status: 'running',
    progress: 42,
    currentStep: '브라우저 mock에서 담당 프로필이 작업을 시작한 것으로 표시',
    nextAction: '시연용으로 검토 단계로 이동 가능',
    interactionLabel: '시작 표시',
  },
  running: {
    status: 'in_review',
    progress: 76,
    currentStep: '브라우저 mock에서 산출물 제출 완료로 표시',
    nextAction: 'checker 검토 통과 표시 가능',
    interactionLabel: '검토로 이동',
  },
  needs_approval: {
    status: 'in_review',
    progress: 35,
    currentStep: '브라우저 mock 승인만 표시됨',
    nextAction: '실제 운영 승인은 별도 server 승인 후 진행',
    interactionLabel: 'mock 승인',
  },
  blocked: {
    status: 'in_review',
    progress: 62,
    currentStep: '브라우저 mock에서 막힘이 해소된 것으로 표시',
    nextAction: 'checker가 범위/리스크를 재검토',
    interactionLabel: '막힘 해소 표시',
  },
  in_review: {
    status: 'completed',
    progress: 100,
    currentStep: '브라우저 mock에서 검토 통과로 표시',
    nextAction: 'router 최종 보고 카드로 묶기',
    interactionLabel: '완료 표시',
  },
  completed: null,
};

const columns: WorkStatusColumn[] = [
  {
    id: 'queued',
    title: '대기',
    helper: '아직 담당자가 실행하지 않은 작업',
    icon: <Hourglass className="w-4 h-4 text-slate-400" />,
    accentClass: 'border-slate-700/70 bg-slate-500/5 text-slate-300',
    emptyText: '대기 중인 작업 없음',
  },
  {
    id: 'running',
    title: '진행중',
    helper: '프로필이 현재 처리 중인 작업',
    icon: <Clock className="w-4 h-4 text-blue-300 animate-spin-slow" />,
    accentClass: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
    emptyText: '진행 중인 작업 없음',
  },
  {
    id: 'needs_approval',
    title: '승인필요',
    helper: '사용자 또는 운영 승인 대기',
    icon: <ShieldCheck className="w-4 h-4 text-amber-300" />,
    accentClass: 'border-amber-400/40 bg-amber-500/10 text-amber-200 shadow-amber-500/10',
    emptyText: '승인 대기 없음',
  },
  {
    id: 'blocked',
    title: '막힘',
    helper: '입력·권한·범위 문제로 중단',
    icon: <AlertOctagon className="w-4 h-4 text-rose-300" />,
    accentClass: 'border-rose-500/40 bg-rose-500/10 text-rose-200 shadow-rose-500/10',
    emptyText: '막힌 작업 없음',
  },
  {
    id: 'in_review',
    title: '검토중',
    helper: 'checker 또는 사람이 검토 중',
    icon: <PauseCircle className="w-4 h-4 text-violet-300" />,
    accentClass: 'border-violet-500/35 bg-violet-500/10 text-violet-200',
    emptyText: '검토 중인 작업 없음',
  },
  {
    id: 'completed',
    title: '완료',
    helper: '산출물과 검증이 끝난 작업',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-300" />,
    accentClass: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200',
    emptyText: '완료 작업 없음',
  },
];

const priorityStyles: Record<WorkItem['priority'], string> = {
  low: 'bg-slate-900 text-slate-400 border-slate-800',
  normal: 'bg-gray-900 text-gray-300 border-gray-800',
  high: 'bg-blue-950/60 text-blue-200 border-blue-800/70',
  urgent: 'bg-amber-950/70 text-amber-200 border-amber-600/70 animate-pulse',
};

const progressStyles: Record<WorkItemStatus, string> = {
  queued: 'from-slate-500 to-slate-400',
  running: 'from-cyan-400 to-blue-500',
  needs_approval: 'from-amber-300 to-orange-500',
  blocked: 'from-rose-400 to-red-600',
  in_review: 'from-violet-400 to-fuchsia-500',
  completed: 'from-emerald-400 to-green-500',
};

const getColumnItems = (workItems: WorkItem[], status: WorkItemStatus) => workItems.filter(item => item.status === status);

const formatTimestamp = (value?: string) => {
  if (!value) return '기록 없음';
  const [, time = value] = value.split('T');
  return time.replace('.000Z', '');
};

const getDependencyLabel = (item: WorkItem) => {
  const dependencyCount = item.dependsOn.length;
  const childCount = item.childIds.length;

  if (dependencyCount === 0 && childCount === 0) return '의존관계 없음';
  return `의존 ${dependencyCount} · 후속 ${childCount}`;
};

function WorkItemCard({
  snapshot,
  item,
  isMockApproved,
  onMockApprove,
  onMockMove,
}: {
  snapshot: WorkConsoleSnapshot;
  item: WorkItem;
  isMockApproved: boolean;
  onMockApprove: (workItemId: string) => void;
  onMockMove: (workItemId: string, status: WorkItemStatus) => void;
}) {
  const nextTransition = demoTransitions[item.status];
  const isApproval = item.status === 'needs_approval' || (item.approvalRequired && !isMockApproved);
  const isBlocked = item.status === 'blocked';
  const isReview = item.status === 'in_review' || item.reviewRequired;
  const highlightClass = isBlocked
    ? 'border-rose-500/60 bg-rose-950/20 shadow-rose-950/30'
    : isApproval
      ? 'border-amber-400/60 bg-amber-950/20 shadow-amber-950/30'
      : isReview
        ? 'border-violet-500/50 bg-violet-950/20 shadow-violet-950/20'
        : 'border-gray-800/80 bg-gray-900/45 shadow-gray-950/30';

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden rounded-2xl border p-4 shadow-lg transition-all hover:border-indigo-400/50 ${highlightClass}`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md border border-indigo-900/70 bg-indigo-950/40 px-1.5 py-0.5 font-mono text-[9px] font-bold text-indigo-200">
              {item.externalId ?? item.id}
            </span>
            <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase ${priorityStyles[item.priority]}`}>
              {item.priority}
            </span>
          </div>
          <h3 className="text-sm font-bold leading-snug text-white">{item.title}</h3>
        </div>
        <span className="whitespace-nowrap rounded-full bg-gray-950/70 px-2 py-1 font-mono text-[9px] text-gray-400">
          {snapshot.summary.statusLabels[item.status]}
        </span>
      </div>

      {isMockApproved && (
        <div className="mt-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-200">
          로컬 mock 상호작용 적용됨 · 실제 Kanban/API/운영 작업 없음
        </div>
      )}

      <p className="mt-2 text-xs leading-relaxed text-gray-400">{item.summary}</p>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-950/60 px-2 py-1 text-[10px] font-semibold text-gray-300">
          <UserRoundCheck className="h-3.5 w-3.5 text-cyan-300" />
          담당 {item.ownerProfile}
        </span>
        {item.assignedProfiles.map(profile => (
          <span key={profile} className="rounded-lg border border-gray-800 bg-gray-900/80 px-2 py-1 font-mono text-[10px] text-gray-400">
            {profile}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.tags.slice(0, 4).map(tag => (
          <span key={tag} className="rounded-full border border-gray-800 bg-gray-950/40 px-2 py-0.5 text-[9px] text-gray-500">
            #{tag}
          </span>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="inline-flex items-center gap-1 font-mono text-gray-500">
            <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
            진행률
          </span>
          <span className="font-mono font-bold text-gray-100">{item.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full border border-gray-900 bg-gray-950">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${item.progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-full bg-gradient-to-r ${progressStyles[item.status]}`}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-2 rounded-xl border border-gray-900 bg-gray-950/55 p-3 text-[10px]">
        <div className="text-gray-400">
          <span className="font-bold text-gray-600">현재: </span>
          {item.currentStep}
        </div>
        <div className="text-indigo-200">
          <span className="font-bold text-gray-600">다음 액션: </span>
          {item.nextAction}
        </div>
        <div className="flex items-center gap-1 text-gray-500">
          <GitBranch className="h-3.5 w-3.5" />
          {getDependencyLabel(item)}
        </div>
      </div>

      {(isApproval || isBlocked || isReview) && (
        <div className={`mt-3 rounded-xl border p-2 text-[10px] ${isBlocked ? 'border-rose-500/30 bg-rose-950/30 text-rose-200' : isApproval ? 'border-amber-400/30 bg-amber-950/30 text-amber-200' : 'border-violet-500/30 bg-violet-950/30 text-violet-200'}`}>
          <div className="flex items-center gap-1 font-bold">
            <AlertTriangle className="h-3.5 w-3.5" />
            {isBlocked ? '막힘 사유' : isApproval ? '승인 필요' : '검토 필요'}
          </div>
          <p className="mt-1 leading-relaxed">
            {item.blockerReason ?? item.approvalLabel ?? '검토 완료 후 다음 단계로 이동합니다.'}
          </p>
        </div>
      )}

      {item.artifactRefs.length > 0 && (
        <div className="mt-3 rounded-xl border border-gray-900 bg-gray-950/35 p-2">
          <div className="mb-1 text-[9px] font-bold uppercase tracking-wider text-gray-600">Mock artifacts</div>
          <div className="space-y-1">
            {item.artifactRefs.slice(0, 2).map(ref => (
              <div key={`${item.id}-${ref.label}`} className="flex items-start justify-between gap-2 text-[10px]">
                <span className="font-semibold text-gray-300">{ref.label}</span>
                <span className="rounded bg-gray-900 px-1.5 py-0.5 font-mono text-[9px] text-gray-500">{ref.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-gray-900/80 pt-3 text-[10px] text-gray-500">
        <span>업데이트 {formatTimestamp(item.updatedAt)}</span>
        <span>{item.source.toUpperCase()} ONLY</span>
      </div>

      {(isApproval || nextTransition) && (
        <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-950/20 p-2 text-[10px] leading-relaxed text-amber-100/80">
          읽기 전용 화면입니다. 아래 버튼은 이 브라우저 안의 표시만 바꾸며 실제 승인, Kanban 변경, API 호출은 하지 않습니다.
        </div>
      )}

      <div className="mt-3 grid gap-2">
        {isApproval && (
          <button
            type="button"
            onClick={() => onMockApprove(item.id)}
            disabled={isMockApproved}
            className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg bg-amber-400 px-3 py-2 text-[10px] font-black text-gray-950 transition-colors hover:bg-amber-300 disabled:cursor-default disabled:bg-emerald-400 disabled:text-gray-950"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {isMockApproved ? '브라우저 표시만 완료 — 실제 호출 없음' : '브라우저 표시만 바꾸기 · 실제 승인 아님'}
          </button>
        )}
        {nextTransition && !isApproval && (
          <button
            type="button"
            onClick={() => onMockMove(item.id, item.status)}
            className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-[10px] font-black text-indigo-100 transition-colors hover:bg-indigo-500/20"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            {nextTransition.interactionLabel} · 브라우저 mock 이동
          </button>
        )}
      </div>
    </motion.article>
  );
}

export default function KanbanView({ snapshot = MOCK_WORK_CONSOLE_SNAPSHOT }: { snapshot?: WorkConsoleSnapshot }) {
  const [mockApprovedIds, setMockApprovedIds] = useState<string[]>([]);
  const [localOverrides, setLocalOverrides] = useState<Record<string, LocalWorkItemOverride>>({});
  const [localEvents, setLocalEvents] = useState<LocalEvent[]>([]);
  const displayItems = snapshot.workItems.map(item => ({ ...item, ...localOverrides[item.id] }));
  const recentEvents = [
    ...localEvents,
    ...snapshot.events.slice(-5).reverse().map(event => ({
      id: event.id,
      title: event.title,
      message: event.message,
      timestamp: event.timestamp,
      level: event.level === 'error' ? 'warning' as const : event.level,
    })),
  ].slice(0, 6);
  const activeProfileCount = snapshot.profileStates.filter(profile => profile.status !== 'idle').length;
  const localMoveCount = Object.keys(localOverrides).length;

  const pushLocalEvent = (item: WorkItem, override: LocalWorkItemOverride) => {
    const timestamp = nowIso();
    setLocalEvents(prev => [
      {
        id: `local-${item.id}-${timestamp}`,
        title: override.interactionLabel ?? '브라우저 mock 이동',
        message: `${item.externalId ?? item.id} 카드가 ${snapshot.summary.statusLabels[item.status]} → ${override.status ? snapshot.summary.statusLabels[override.status] : snapshot.summary.statusLabels[item.status]} 상태로 표시만 변경되었습니다.`,
        timestamp,
        level: override.status === 'completed' ? 'success' : 'info',
      },
      ...prev,
    ].slice(0, 4));
  };

  const handleMockMove = (workItemId: string, status: WorkItemStatus) => {
    const original = snapshot.workItems.find(item => item.id === workItemId);
    const transition = demoTransitions[status];
    if (!original || !transition) return;

    const override: LocalWorkItemOverride = {
      ...transition,
      updatedAt: nowIso(),
    };
    setLocalOverrides(prev => ({ ...prev, [workItemId]: override }));
    pushLocalEvent(original, override);
  };

  const handleMockApprove = (workItemId: string) => {
    const original = snapshot.workItems.find(item => item.id === workItemId);
    const transition = demoTransitions.needs_approval;
    if (!original || !transition) return;

    const override: LocalWorkItemOverride = {
      ...transition,
      updatedAt: nowIso(),
    };
    setMockApprovedIds(prev => (prev.includes(workItemId) ? prev : [...prev, workItemId]));
    setLocalOverrides(prev => ({ ...prev, [workItemId]: override }));
    pushLocalEvent(original, override);
  };

  const resetMockBoard = () => {
    setMockApprovedIds([]);
    setLocalOverrides({});
    setLocalEvents([]);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-white">
              <Cpu className="h-5 w-5 text-indigo-400" />
              Hermes Kanban Board
            </h1>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-gray-400">
              router → dev-pm → dev-architect → dev-builder → checker → server 같은 Hermes 작업 흐름을 칸반 카드로 시연합니다.
              이 화면은 {snapshot.summary.sourceLabel} 기반 read-only/mock 전용이며 실제 Kanban, session DB, gateway, API에는 연결하지 않습니다.
            </p>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
                <div className="font-mono text-lg font-black text-white">{displayItems.length}</div>
                <div className="text-gray-500">작업 카드</div>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
                <div className="font-mono text-lg font-black text-cyan-200">{activeProfileCount}</div>
                <div className="text-gray-500">프로필 상태</div>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3">
                <div className="font-mono text-lg font-black text-emerald-200">MOCK</div>
                <div className="text-gray-500">연동 모드</div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-2 text-[10px]">
              <span className="inline-flex items-center gap-1 font-semibold text-indigo-100">
                <PlayCircle className="h-3.5 w-3.5 text-indigo-300" />
                브라우저 mock 이동 {localMoveCount}건
              </span>
              <button
                type="button"
                onClick={resetMockBoard}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-700 px-2 py-1 font-bold text-gray-300 transition-colors hover:border-indigo-400 hover:text-white"
              >
                <RefreshCw className="h-3 w-3" />
                초기화
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3 text-xs text-indigo-100">
          <div className="flex items-center gap-2 font-bold">
            <Sparkles className="h-4 w-4 text-indigo-300" />
            시연 경계
          </div>
          <p className="mt-1 text-indigo-200/80">{snapshot.summary.phase2Notice}</p>
          <p className="mt-1 text-indigo-200/80">버튼 클릭은 React state만 바꿉니다. 서버, gateway, cron, DB, env 변경, 실제 승인, 실제 작업 시작은 일어나지 않습니다.</p>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
          {snapshot.agentFlow.map(step => (
            <div key={step.id} className="rounded-xl border border-gray-800 bg-gray-950/45 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] font-black text-indigo-200">{step.profile}</span>
                <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[9px] text-gray-500">{step.order}</span>
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-gray-400">{step.role}</p>
              <div className="mt-2 flex items-center gap-1 text-[9px] text-gray-600">
                <CheckCheck className="h-3 w-3" />
                {snapshot.summary.statusLabels[step.status]}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {columns.map(column => {
          const items = getColumnItems(displayItems, column.id);

          return (
            <div key={column.id} className={`flex min-h-[560px] flex-col rounded-2xl border p-3 shadow-lg ${column.accentClass}`}>
              <div className="mb-3 border-b border-white/10 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {column.icon}
                    <span className="text-xs font-black uppercase tracking-wider">{column.title}</span>
                  </div>
                  <span className="rounded-full bg-gray-950/70 px-2 py-0.5 font-mono text-[10px] font-black text-white">
                    {items.length}
                  </span>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed opacity-75">{column.helper}</p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                <AnimatePresence mode="popLayout">
                  {items.length === 0 ? (
                    <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-white/10 px-4 text-center text-xs opacity-60">
                      {column.emptyText}
                    </div>
                  ) : (
                    items.map(item => (
                      <div key={item.id}>
                        <WorkItemCard
                          snapshot={snapshot}
                          item={item}
                          isMockApproved={mockApprovedIds.includes(item.id)}
                          onMockApprove={handleMockApprove}
                          onMockMove={handleMockMove}
                        />
                      </div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-gray-800 bg-gray-900/45 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
            <UserRoundCheck className="h-4 w-4 text-cyan-300" />
            담당 프로필 현황
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {snapshot.profileStates.map(profile => (
              <div key={profile.profileId} className="rounded-xl border border-gray-800 bg-gray-950/45 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-gray-100">{profile.displayName}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] ${profile.status === 'running' ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200' : profile.status.includes('waiting') ? 'border-amber-400/30 bg-amber-500/10 text-amber-200' : profile.status === 'blocked' || profile.status === 'error' ? 'border-rose-400/30 bg-rose-500/10 text-rose-200' : 'border-gray-800 text-gray-400'}`}>{profile.status}</span>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-gray-500">{profile.currentAction}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500">
                  <span>queue {profile.queueDepth}</span>
                  <span>blocked {profile.blockedCountToday}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/45 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
            <Layers3 className="h-4 w-4 text-indigo-300" />
            최근 mock 이벤트
          </div>
          <div className="space-y-2">
            {recentEvents.map(event => (
              <div key={event.id} className="rounded-xl border border-gray-800 bg-gray-950/45 p-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-gray-100">{event.title}</span>
                  <span className="font-mono text-[10px] text-gray-500">{formatTimestamp(event.timestamp)}</span>
                </div>
                <p className="mt-1 text-[10px] leading-relaxed text-gray-400">{event.message}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-gray-600">
                  <span>{event.actorProfile}{event.targetProfile ? ` → ${event.targetProfile}` : ''}</span>
                  <span>{event.level}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}