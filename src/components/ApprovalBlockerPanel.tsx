/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  LockKeyhole,
  ShieldAlert,
  UserRoundCheck,
} from 'lucide-react';
import type { WorkConsoleSummary, WorkItem } from '../types/workConsole';

interface ApprovalBlockerPanelProps {
  summary: WorkConsoleSummary;
  workItems: WorkItem[];
}

const getDecisionText = (item: WorkItem) => {
  if (item.status === 'needs_approval') {
    return item.approvalLabel ?? item.nextAction;
  }

  return item.blockerReason ?? item.nextAction;
};

const getReasonText = (item: WorkItem) => item.blockerReason ?? item.currentStep ?? item.summary;

const formatTimestamp = (value: string) => value.replace('T', ' ').replace('.000Z', ' UTC');

function WorkGateCard({ item, tone }: { item: WorkItem; tone: 'approval' | 'blocker'; key?: React.Key }) {
  const isApproval = tone === 'approval';
  const Icon = isApproval ? ShieldAlert : AlertOctagon;
  const toneClasses = isApproval
    ? 'border-amber-500/25 bg-amber-500/5 text-amber-300'
    : 'border-rose-500/25 bg-rose-500/5 text-rose-300';
  const iconClasses = isApproval
    ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
    : 'bg-rose-500/10 text-rose-300 border-rose-500/20';

  return (
    <article className={`rounded-2xl border p-5 shadow-md ${toneClasses}`}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 rounded-xl border p-2 ${iconClasses}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-gray-700 bg-gray-950/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gray-400">
                  {item.externalId ?? item.id}
                </span>
                <span className="rounded-full border border-gray-700 bg-gray-950/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gray-400">
                  {item.kind}
                </span>
              </div>
              <h3 className="mt-2 text-sm font-bold text-white">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-400">{item.summary}</p>
            </div>
          </div>
          <span className="rounded-full border border-gray-700 bg-gray-950/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            {item.priority}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-3">
          <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-gray-500">
              <AlertTriangle className="h-3.5 w-3.5" />
              이유
            </div>
            <p className="leading-relaxed text-gray-200">{getReasonText(item)}</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-gray-500">
              <UserRoundCheck className="h-3.5 w-3.5" />
              담당 프로필
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[item.ownerProfile, ...item.assignedProfiles.filter(profile => profile !== item.ownerProfile)].map(profile => (
                <span key={profile} className="rounded-md border border-gray-800 bg-gray-900 px-1.5 py-0.5 font-mono text-[10px] text-gray-300">
                  {profile}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-gray-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
              필요한 사용자 결정
            </div>
            <p className="leading-relaxed text-gray-200">{getDecisionText(item)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-800/70 pt-3 text-[10px] text-gray-500 md:flex-row md:items-center md:justify-between">
          <span>업데이트: {formatTimestamp(item.updatedAt)}</span>
          <span className="font-mono uppercase tracking-wider">source={item.source} · progress={item.progress}%</span>
        </div>
      </div>
    </article>
  );
}

export default function ApprovalBlockerPanel({ summary, workItems }: ApprovalBlockerPanelProps) {
  const approvalItems = workItems.filter(item => item.status === 'needs_approval' || item.approvalRequired);
  const blockerItems = workItems.filter(item => item.status === 'blocked' || Boolean(item.blockerReason));

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold text-white">
              <LockKeyhole className="h-5 w-5 text-amber-300" />
              Approval & Blocker Panel
            </h1>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-gray-400">
              사용자가 승인해야 할 항목과 현재 막힌 항목을 분리해서 보여주는 mock-only 패널입니다.
              이 화면은 {summary.sourceLabel} 데이터만 읽으며, 실제 승인 처리·DB write·Hermes session/gateway/API 연결은 하지 않습니다.
            </p>
          </div>
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-xs text-cyan-200">
            <div className="font-mono uppercase tracking-wider text-cyan-400">{summary.mode} data</div>
            <div className="mt-1 text-gray-400">생성 기준: {formatTimestamp(summary.generatedAt)}</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">승인 필요</div>
            <div className="mt-2 font-mono text-3xl font-bold text-white">{approvalItems.length}</div>
          </div>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-300">Blocker</div>
            <div className="mt-2 font-mono text-3xl font-bold text-white">{blockerItems.length}</div>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">처리 방식</div>
            <div className="mt-2 text-xs leading-relaxed text-gray-300">읽기 전용 표시만 제공 · 승인 버튼 없음 · 실제 운영 변경 없음</div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-300">승인 필요 항목</h2>
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] text-amber-300">{approvalItems.length}</span>
          </div>
          {approvalItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-800 p-8 text-center text-xs text-gray-500">승인 대기 항목이 없습니다.</div>
          ) : (
            approvalItems.map(item => (
              <div key={item.id}>
                <WorkGateCard item={item} tone="approval" />
              </div>
            ))
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-rose-300">현재 Blocker 항목</h2>
            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 font-mono text-[10px] text-rose-300">{blockerItems.length}</span>
          </div>
          {blockerItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-800 p-8 text-center text-xs text-gray-500">막힘 항목이 없습니다.</div>
          ) : (
            blockerItems.map(item => (
              <div key={item.id}>
                <WorkGateCard item={item} tone="blocker" />
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 text-xs leading-relaxed text-gray-300">
        <div className="font-semibold text-indigo-300">Phase 2 경계</div>
        <p className="mt-1">{summary.phase2Notice}</p>
      </section>
    </div>
  );
}
