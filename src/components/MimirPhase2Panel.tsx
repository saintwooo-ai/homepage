/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GitBranch, Link2, ShieldAlert } from 'lucide-react';
import { INITIAL_WORK_ITEMS, WORK_CONSOLE_SUMMARY } from '../data/mockWorkConsole';

const mimirPhase2Item = INITIAL_WORK_ITEMS.find((item) => item.kind === 'mimir_placeholder');

export default function MimirPhase2Panel() {
  return (
    <section id="mimir-phase-2-placeholder" className="rounded-2xl border border-violet-500/20 bg-violet-950/10 p-5 shadow-xl shadow-violet-950/10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-violet-100">
            <GitBranch className="h-4 w-4 text-violet-300" />
            Mimir Engine · Phase 2 Coming Next
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-violet-100/75">
            {WORK_CONSOLE_SUMMARY.phase2Notice}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
            이 영역은 지식 콘솔과 Mimir Engine 사이의 후속 연결 후보를 보여주는 placeholder입니다. 실제 Hermes session DB, gateway, API, log, websocket, Supabase migration/write는 호출하지 않습니다.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-xl border border-violet-500/20 bg-black/20 px-3 py-2 text-[11px] font-bold text-violet-200">
          <ShieldAlert className="h-3.5 w-3.5" />
          no live connection
        </span>
      </div>

      {mimirPhase2Item && (
        <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-4">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-violet-300">
              <span>{mimirPhase2Item.status}</span>
              <span>·</span>
              <span>{mimirPhase2Item.priority}</span>
              <span>·</span>
              <span>{mimirPhase2Item.source}</span>
            </div>
            <h3 className="mt-2 text-sm font-bold text-white">{mimirPhase2Item.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-400">{mimirPhase2Item.summary}</p>
            <p className="mt-3 rounded-lg border border-violet-500/10 bg-violet-500/5 p-3 text-[11px] text-violet-100/80">
              다음 단계: {mimirPhase2Item.nextAction}
            </p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-4">
            <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-gray-500">
              <Link2 className="h-3.5 w-3.5" /> Phase 2 links only
            </p>
            <div className="space-y-2">
              {mimirPhase2Item.artifactRefs.map((artifact) => (
                <div key={artifact.label} className="rounded-lg border border-gray-800 bg-black/20 p-3">
                  <p className="text-[11px] font-bold text-gray-200">{artifact.label}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-gray-500">{artifact.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
