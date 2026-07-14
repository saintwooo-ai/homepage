/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity, ArrowRight, Clock, FileText, ShieldCheck } from 'lucide-react';
import { INITIAL_PROFILE_WORK_STATES } from '../data/mockWorkConsole';
import type { ProfileWorkStatus } from '../types/workConsole';

const statusCopy: Record<ProfileWorkStatus, { label: string; className: string }> = {
  idle: { label: '대기', className: 'border-gray-700 bg-gray-500/10 text-gray-300' },
  queued: { label: '대기열', className: 'border-sky-500/20 bg-sky-500/10 text-sky-200' },
  running: { label: '진행중', className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200' },
  blocked: { label: '막힘', className: 'border-amber-500/20 bg-amber-500/10 text-amber-200' },
  waiting_approval: { label: '승인대기', className: 'border-violet-500/20 bg-violet-500/10 text-violet-200' },
  waiting_review: { label: '검토대기', className: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-200' },
  offline: { label: '오프라인', className: 'border-gray-700 bg-gray-900/60 text-gray-500' },
  error: { label: '오류', className: 'border-red-500/20 bg-red-500/10 text-red-200' },
};

export default function ProfileWorkStatePanel() {
  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-5 shadow-xl shadow-cyan-950/10">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-cyan-100">
            <Activity className="h-4 w-4 text-cyan-300" />
            Profile Work State
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-cyan-100/70">
            mock Work Console seed 기준으로 router/dev-pm/dev-architect/dev-builder/checker의 역할, 현재 초점, 상태, 출력 요약을 표시합니다.
          </p>
        </div>
        <div className="rounded-xl border border-cyan-500/20 bg-black/20 px-3 py-2 text-[11px] font-bold text-cyan-200">
          mock-only · live session/API/gateway 미연결
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-5">
        {INITIAL_PROFILE_WORK_STATES.map((profile) => {
          const status = statusCopy[profile.status];
          return (
            <article key={profile.profileId} className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-[11px] font-black text-white">{profile.displayName}</p>
                  <p className="mt-1 text-[10px] text-gray-500">queue {profile.queueDepth} · work {profile.activeWorkItemIds.length}</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${status.className}`}>{status.label}</span>
              </div>

              <div className="space-y-3 text-[11px] leading-relaxed">
                <InfoRow icon={<ShieldCheck className="h-3.5 w-3.5" />} label="role" value={profile.role} />
                <InfoRow icon={<Clock className="h-3.5 w-3.5" />} label="currentFocus" value={profile.currentFocus} />
                <InfoRow icon={<FileText className="h-3.5 w-3.5" />} label="outputSummary" value={profile.outputSummary} />
              </div>

              <div className="mt-3 border-t border-gray-800 pt-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">handoff</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {profile.handoffTo.map((target) => (
                    <React.Fragment key={target}>
                      <ArrowRight className="h-3 w-3 text-gray-600" />
                      <span className="rounded-full border border-gray-700 bg-gray-900 px-2 py-0.5 text-[10px] font-bold text-gray-300">{target}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 font-mono text-[10px] font-bold text-cyan-300/80">{icon}{label}</p>
      <p className="text-gray-300">{value}</p>
    </div>
  );
}
