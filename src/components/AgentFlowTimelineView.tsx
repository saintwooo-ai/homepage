/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  GitBranch,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { MOCK_WORK_CONSOLE_SNAPSHOT } from '../data/work-console/mockAdapter';
import type { AgentFlowStep, WorkConsoleSnapshot, WorkItemStatus } from '../types/workConsole';

const statusTone: Record<WorkItemStatus, { label: string; badge: string; card: string; dot: string; icon: ReactNode }> = {
  queued: {
    label: '대기',
    badge: 'border-gray-700 bg-gray-900 text-gray-300',
    card: 'border-gray-800 bg-gray-950/40',
    dot: 'bg-gray-500',
    icon: <Clock3 className="h-4 w-4" />,
  },
  running: {
    label: '진행중',
    badge: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
    card: 'border-blue-500/20 bg-blue-950/10',
    dot: 'bg-blue-400 animate-pulse',
    icon: <Clock3 className="h-4 w-4" />,
  },
  needs_approval: {
    label: '승인필요',
    badge: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
    card: 'border-amber-500/30 bg-amber-950/10 shadow-amber-500/5',
    dot: 'bg-amber-400 animate-pulse',
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  blocked: {
    label: '막힘',
    badge: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
    card: 'border-rose-500/30 bg-rose-950/10 shadow-rose-500/5',
    dot: 'bg-rose-400',
    icon: <LockKeyhole className="h-4 w-4" />,
  },
  in_review: {
    label: '검토중',
    badge: 'border-violet-500/40 bg-violet-500/10 text-violet-200',
    card: 'border-violet-500/30 bg-violet-950/10 shadow-violet-500/5',
    dot: 'bg-violet-400 animate-pulse',
    icon: <FileText className="h-4 w-4" />,
  },
  completed: {
    label: '완료',
    badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    card: 'border-emerald-500/20 bg-emerald-950/10',
    dot: 'bg-emerald-400',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
};

function formatTimelineTime(value: string) {
  return new Date(value).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function StatusLegend({ status }: { status: WorkItemStatus }) {
  const tone = statusTone[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${tone.badge}`}>
      {tone.icon}
      {tone.label}
    </span>
  );
}

function TimelineStepCard({ step, isLast }: { step: AgentFlowStep; isLast: boolean }) {
  const tone = statusTone[step.status];

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border border-gray-700 bg-gray-950 text-sm font-black text-white shadow-lg ${step.status === 'blocked' ? 'ring-2 ring-rose-500/30' : ''}`}>
          {step.order}
        </div>
        {!isLast && <div className="h-full min-h-12 w-px bg-gradient-to-b from-gray-700 via-gray-800 to-transparent" />}
      </div>

      <div className={`mb-4 flex-1 rounded-2xl border p-4 shadow-xl ${tone.card}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
              <span className="font-mono text-sm font-black text-white">{step.profile}</span>
              {step.handoffTo && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-semibold text-gray-400">
                  <ArrowRight className="h-3 w-3" /> {step.handoffTo}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs font-semibold text-gray-300">{step.role}</p>
          </div>
          <StatusLegend status={step.status} />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_180px]">
          <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-3">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">Output summary</div>
            <p className="text-sm leading-relaxed text-gray-200">{step.outputSummary}</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-3 text-[11px] text-gray-400">
            <div className="font-mono text-gray-500">{step.relatedWorkItemId}</div>
            <div className="mt-2">시작 {formatTimelineTime(step.startedAt)}</div>
            <div>{step.completedAt ? `완료 ${formatTimelineTime(step.completedAt)}` : '완료 대기'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentFlowTimelineView({ snapshot = MOCK_WORK_CONSOLE_SNAPSHOT }: { snapshot?: WorkConsoleSnapshot }) {
  const agentFlow = snapshot.agentFlow;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-white">
              <GitBranch className="h-5 w-5 text-cyan-400" />
              Agent Flow Timeline
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">
              router → dev-pm → dev-architect → dev-builder → checker → router 협업 흐름을 mock 데이터로만 표시합니다.
              실제 Hermes session DB, gateway, API, websocket에는 연결하지 않습니다.
            </p>
          </div>
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-100">
            <div className="font-bold">{snapshot.summary.mode.toUpperCase()} ONLY</div>
            <div className="mt-1 text-cyan-200/70">{snapshot.summary.sourceLabel}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-800 bg-gray-950/40 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">총 단계</div>
          <div className="mt-2 font-mono text-3xl font-black text-white">{agentFlow.length}</div>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/10 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300/70">승인필요</div>
          <div className="mt-2 font-mono text-3xl font-black text-amber-200">{agentFlow.filter((step) => step.status === 'needs_approval').length}</div>
        </div>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-rose-300/70">막힘</div>
          <div className="mt-2 font-mono text-3xl font-black text-rose-200">{agentFlow.filter((step) => step.status === 'blocked').length}</div>
        </div>
        <div className="rounded-2xl border border-violet-500/20 bg-violet-950/10 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-violet-300/70">검토중</div>
          <div className="mt-2 font-mono text-3xl font-black text-violet-200">{agentFlow.filter((step) => step.status === 'in_review').length}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-950/40 p-5">
        <div className="mb-5 flex flex-col gap-3 border-b border-gray-800 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">6단계 협업 순서</h2>
            <p className="mt-1 text-[11px] text-gray-500">각 단계는 profile, role, status, output summary를 포함합니다.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusLegend status="needs_approval" />
            <StatusLegend status="blocked" />
            <StatusLegend status="in_review" />
          </div>
        </div>

        <div>
          {[...agentFlow]
            .sort((a, b) => a.order - b.order)
            .map((step, index) => (
              <div key={step.id}>
                <TimelineStepCard step={step} isLast={index === agentFlow.length - 1} />
              </div>
            ))}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-950/10 p-4 text-xs leading-relaxed text-amber-100">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {snapshot.summary.phase2Notice} 이 화면의 승인필요/막힘/검토중 표시는 데모용 시각 구분이며 실제 운영 승인이나 작업 상태 변경을 수행하지 않습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
