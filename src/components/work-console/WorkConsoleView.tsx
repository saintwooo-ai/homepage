/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import type { ReactElement } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  FileText,
  GitBranch,
  Hourglass,
  Layers3,
  Link2,
  PauseCircle,
  PlayCircle,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  INITIAL_PROFILE_WORK_STATES,
  INITIAL_WORK_EVENTS,
  INITIAL_WORK_ITEMS,
  WORK_CONSOLE_SUMMARY,
} from '../../data/mockWorkConsole';
import AgentFlowTimelineView from '../AgentFlowTimelineView';
import ApprovalBlockerPanel from '../ApprovalBlockerPanel';
import KanbanView from '../KanbanView';
import MimirPhase2Panel from '../MimirPhase2Panel';
import ProfileWorkStatePanel from '../ProfileWorkStatePanel';
import type { ProfileWorkState, WorkEvent, WorkItem, WorkItemStatus } from '../../types/workConsole';

const STATUS_ORDER: WorkItemStatus[] = ['queued', 'running', 'needs_approval', 'blocked', 'in_review', 'completed'];

const STATUS_STYLE: Record<WorkItemStatus, { label: string; tone: string; icon: ReactElement; bar: string }> = {
  queued: {
    label: '대기',
    tone: 'border-gray-700/70 bg-gray-800/30 text-gray-300',
    icon: <Hourglass className="w-4 h-4 text-gray-400" />,
    bar: 'bg-gray-500',
  },
  running: {
    label: '진행',
    tone: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    icon: <PlayCircle className="w-4 h-4 text-blue-400 animate-pulse" />,
    bar: 'bg-gradient-to-r from-cyan-400 to-blue-500',
  },
  needs_approval: {
    label: '승인필요',
    tone: 'border-amber-500/35 bg-amber-500/10 text-amber-300',
    icon: <ShieldAlert className="w-4 h-4 text-amber-400" />,
    bar: 'bg-amber-500',
  },
  blocked: {
    label: '막힘',
    tone: 'border-rose-500/35 bg-rose-500/10 text-rose-300',
    icon: <PauseCircle className="w-4 h-4 text-rose-400" />,
    bar: 'bg-rose-500',
  },
  in_review: {
    label: '검토중',
    tone: 'border-violet-500/35 bg-violet-500/10 text-violet-300',
    icon: <FileText className="w-4 h-4 text-violet-400" />,
    bar: 'bg-violet-500',
  },
  completed: {
    label: '완료',
    tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    bar: 'bg-emerald-500',
  },
};

const PROFILE_STATUS_STYLE: Record<ProfileWorkState['status'], string> = {
  idle: 'bg-gray-800 text-gray-400 border-gray-700',
  queued: 'bg-gray-800 text-gray-300 border-gray-700',
  running: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  blocked: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  waiting_approval: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  waiting_review: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
  offline: 'bg-gray-900 text-gray-600 border-gray-800',
  error: 'bg-red-500/10 text-red-300 border-red-500/30',
};

const formatMockTime = (timestamp?: string) => {
  if (!timestamp) return '기록 없음';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const getStatusCount = (items: WorkItem[], status: WorkItemStatus) => items.filter(item => item.status === status).length;

const getPriorityClass = (priority: WorkItem['priority']) => {
  switch (priority) {
    case 'urgent':
      return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
    case 'high':
      return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    case 'normal':
      return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
    case 'low':
      return 'bg-gray-800 text-gray-400 border-gray-700';
  }
};

function StatusSummaryCard({ status, count }: { status: WorkItemStatus; count: number }) {
  const style = STATUS_STYLE[status];

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-4 shadow-md ${style.tone}`}>
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/5 blur-2xl" />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {WORK_CONSOLE_SUMMARY.statusLabels[status] ?? style.label}
        </span>
        <span className="rounded-xl bg-gray-950/45 p-2 border border-gray-800/60">
          {style.icon}
        </span>
      </div>
      <div className="mt-4 flex items-end gap-2">
        <span className="font-mono text-3xl font-bold text-white">{count}</span>
        <span className="mb-1 text-[10px] font-mono uppercase text-gray-500">items</span>
      </div>
    </div>
  );
}

function WorkItemCard({ item, featured = false }: { item: WorkItem; featured?: boolean }) {
  const style = STATUS_STYLE[item.status];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border bg-gray-900/50 p-5 shadow-lg transition-all hover:border-cyan-500/30 ${
        featured ? 'border-blue-500/35' : 'border-gray-800/80'
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold ${style.tone}`}>
              {style.icon}
              {WORK_CONSOLE_SUMMARY.statusLabels[item.status]}
            </span>
            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${getPriorityClass(item.priority)}`}>
              {item.priority.toUpperCase()}
            </span>
            {item.source === 'mimir' && (
              <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-[10px] font-bold text-indigo-300">
                <Sparkles className="w-3 h-3" />
                PHASE 2
              </span>
            )}
          </div>
          <h2 className={`${featured ? 'text-xl' : 'text-sm'} font-bold tracking-tight text-white`}>{item.title}</h2>
          <p className="max-w-3xl text-sm leading-6 text-gray-400">{item.summary}</p>
        </div>
        <div className="min-w-[148px] rounded-xl border border-gray-800 bg-gray-950/50 p-3 text-right font-mono text-xs text-gray-400">
          <div className="text-[10px] uppercase text-gray-600">owner</div>
          <div className="mt-1 font-bold text-cyan-300">{item.ownerProfile}</div>
          <div className="mt-2 text-[10px] uppercase text-gray-600">updated</div>
          <div className="mt-1 text-gray-300">{formatMockTime(item.updatedAt)}</div>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-gray-500">진척도</span>
          <span className="font-bold text-gray-200">{item.progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full border border-gray-800 bg-gray-950">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${item.progress}%` }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className={`h-full rounded-full ${style.bar}`}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-gray-800 bg-gray-950/40 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-600">현재 단계</div>
          <p className="mt-1 text-xs leading-5 text-gray-300">{item.currentStep}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-950/40 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-600">다음 액션</div>
          <p className="mt-1 text-xs leading-5 text-indigo-300">{item.nextAction}</p>
        </div>
      </div>

      {item.blockerReason && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs text-rose-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-400" />
          <span>{item.blockerReason}</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {item.assignedProfiles.map(profile => (
          <span key={profile} className="inline-flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-950/50 px-2 py-1 text-[10px] font-mono text-gray-300">
            <Bot className="h-3 w-3 text-cyan-400" />
            {profile}
          </span>
        ))}
        {item.tags.map(tag => (
          <span key={tag} className="rounded-lg border border-gray-800 bg-gray-900/70 px-2 py-1 text-[10px] text-gray-500">
            #{tag}
          </span>
        ))}
      </div>
    </motion.article>
  );
}

function ProfileStateCard({ profile, activeItems }: { profile: ProfileWorkState; activeItems: WorkItem[] }) {
  return (
    <div className="rounded-2xl border border-gray-800/80 bg-gray-900/40 p-4 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white">{profile.displayName}</h3>
          <p className="mt-1 text-[11px] leading-4 text-gray-500">{profile.role}</p>
        </div>
        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${PROFILE_STATUS_STYLE[profile.status]}`}>
          {profile.status.replace('_', ' ')}
        </span>
      </div>
      <div className="mt-4 space-y-2">
        <div className="rounded-xl border border-gray-800 bg-gray-950/40 p-3 text-xs text-gray-300">
          <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-600">currentFocus</div>
          {profile.currentFocus}
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-950/40 p-3 text-xs text-gray-300">
          <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-600">outputSummary</div>
          {profile.outputSummary}
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-950/40 p-3 text-xs text-gray-300">
          <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-gray-600">currentAction</div>
          {profile.currentAction}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center font-mono text-[10px]">
        <div className="rounded-lg bg-gray-950/40 p-2">
          <div className="text-gray-600">queue</div>
          <div className="mt-1 text-sm font-bold text-white">{profile.queueDepth}</div>
        </div>
        <div className="rounded-lg bg-gray-950/40 p-2">
          <div className="text-gray-600">done</div>
          <div className="mt-1 text-sm font-bold text-emerald-300">{profile.successCountToday}</div>
        </div>
        <div className="rounded-lg bg-gray-950/40 p-2">
          <div className="text-gray-600">blocked</div>
          <div className="mt-1 text-sm font-bold text-rose-300">{profile.blockedCountToday}</div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {activeItems.slice(0, 2).map(item => (
          <div key={item.id} className="flex items-center justify-between gap-2 text-[11px] text-gray-400">
            <span className="truncate">{item.title}</span>
            <ArrowRight className="h-3 w-3 flex-shrink-0 text-gray-600" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EventRow({ event }: { event: WorkEvent }) {
  const levelClass: Record<WorkEvent['level'], string> = {
    info: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    error: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  };

  return (
    <div className="flex gap-3 rounded-xl border border-gray-800/70 bg-gray-950/35 p-3">
      <div className={`mt-0.5 h-2.5 w-2.5 rounded-full ${event.level === 'success' ? 'bg-emerald-400' : event.level === 'warning' ? 'bg-amber-400' : event.level === 'error' ? 'bg-rose-400' : 'bg-blue-400'}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-100">{event.title}</span>
          <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${levelClass[event.level]}`}>
            {event.level}
          </span>
          <span className="font-mono text-[10px] text-gray-600">{formatMockTime(event.timestamp)}</span>
        </div>
        <p className="mt-1 text-[11px] leading-5 text-gray-500">{event.message}</p>
      </div>
    </div>
  );
}

export default function WorkConsoleView() {
  const featuredWork = INITIAL_WORK_ITEMS.find(item => item.status === 'running') ?? INITIAL_WORK_ITEMS[0];
  const activeWork = INITIAL_WORK_ITEMS.filter(item => item.status !== 'completed');
  const reviewOrApprovalItems = INITIAL_WORK_ITEMS.filter(item => item.status === 'needs_approval' || item.status === 'in_review' || item.status === 'blocked');

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-xl backdrop-blur-md">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-widest text-cyan-400">
              <Activity className="h-4 w-4" />
              Work Console / mock-only v1
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">작업 흐름 대표 화면</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
              대표 작업, 프로필 상태, 승인/검토/막힘 요약을 mock 데이터로 표시합니다. 실제 Hermes session DB, gateway, API, websocket에는 연결하지 않습니다.
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-xs text-cyan-200 lg:max-w-sm">
            <div className="flex items-center gap-2 font-bold">
              <Link2 className="h-4 w-4" />
              데이터 소스 경계
            </div>
            <p className="mt-2 leading-5 text-cyan-100/75">{WORK_CONSOLE_SUMMARY.phase2Notice}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-indigo-500/20 bg-indigo-950/10 p-5 shadow-xl shadow-indigo-950/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-indigo-100">통합 Work Console 섹션 맵</h2>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-indigo-100/70">
              아래 한 화면 안에서 상태 요약, 승인/막힘, 프로필 작업 상태, Mimir Phase 2 placeholder, Agent Flow Timeline, 6컬럼 Kanban 보드를 모두 확인합니다.
              모든 섹션은 동일한 mock seed만 읽으며 실제 Hermes session DB, gateway, API, websocket, Supabase write는 수행하지 않습니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-indigo-100 sm:grid-cols-3 lg:min-w-[420px]">
            {['상태 요약', '승인/막힘', 'Profile Work State', 'Mimir Phase 2', 'Agent Flow Timeline', 'Kanban Board'].map(label => (
              <span key={label} className="rounded-xl border border-indigo-500/20 bg-gray-950/50 px-3 py-2 text-center">
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        {STATUS_ORDER.map(status => (
          <div key={status}>
            <StatusSummaryCard status={status} count={getStatusCount(INITIAL_WORK_ITEMS, status)} />
          </div>
        ))}
      </section>

      <ApprovalBlockerPanel summary={WORK_CONSOLE_SUMMARY} workItems={INITIAL_WORK_ITEMS} />

      <ProfileWorkStatePanel />

      <MimirPhase2Panel />

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-200">현재 진행 중 대표 작업</h2>
              <p className="mt-1 text-xs text-gray-500">진행/대기/승인필요/막힘/검토중 항목을 한 화면에서 확인합니다.</p>
            </div>
            <span className="rounded-full border border-gray-800 bg-gray-950/50 px-3 py-1 text-[10px] font-mono text-gray-500">
              {WORK_CONSOLE_SUMMARY.sourceLabel}
            </span>
          </div>
          <WorkItemCard item={featuredWork} featured />

          <div className="grid gap-4 md:grid-cols-2">
            {reviewOrApprovalItems.map(item => (
              <div key={item.id}>
                <WorkItemCard item={item} />
              </div>
            ))}
          </div>
        </div>

        <aside className="xl:col-span-4 space-y-4">
          <div className="rounded-2xl border border-gray-800/80 bg-gray-900/40 p-5 shadow-lg">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Layers3 className="h-4 w-4 text-indigo-400" />
              진행 대기열
            </div>
            <div className="mt-4 space-y-3">
              {activeWork.slice(0, 5).map(item => (
                <div key={item.id} className="rounded-xl border border-gray-800 bg-gray-950/35 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-gray-200">{item.title}</span>
                    <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${STATUS_STYLE[item.status].tone}`}>
                      {WORK_CONSOLE_SUMMARY.statusLabels[item.status]}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500">
                    <span>{item.ownerProfile}</span>
                    <span>{item.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800/80 bg-gray-900/40 p-5 shadow-lg">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <GitBranch className="h-4 w-4 text-cyan-400" />
              최근 Work 이벤트
            </div>
            <div className="mt-4 space-y-3">
              {INITIAL_WORK_EVENTS.slice(-5).reverse().map(event => (
                <div key={event.id}>
                  <EventRow event={event} />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-200">프로필별 작업 상태</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {INITIAL_PROFILE_WORK_STATES.map(profile => (
            <div key={profile.profileId}>
              <ProfileStateCard
                profile={profile}
                activeItems={INITIAL_WORK_ITEMS.filter(item => profile.activeWorkItemIds.includes(item.id))}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-800 bg-gray-950/30 p-4">
        <AgentFlowTimelineView />
      </section>

      <section className="rounded-2xl border border-gray-800 bg-gray-950/30 p-4">
        <KanbanView />
      </section>
    </div>
  );
}
