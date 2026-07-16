/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Database,
  FileText,
  Layers3,
  Network,
  RefreshCw,
  Search,
  Sparkles,
  SplitSquareHorizontal,
  Workflow,
} from 'lucide-react';
import { useKnowledgeReadOnlyData } from '../services/workConsoleKnowledgeReadOnly';

const sourceNodes = [
  { label: '뉴스레터', detail: '매체·브랜드·트렌드 원문', icon: FileText },
  { label: '링크/리포트', detail: '기사, PDF, 레퍼런스', icon: Search },
  { label: '사용자 발화', detail: '아이디어, 판단, 요청', icon: BrainCircuit },
];

const pipelineSteps = [
  {
    title: 'Source 수집',
    desc: '원문을 그대로 보존하고 출처, 날짜, 맥락을 붙입니다.',
    color: 'from-cyan-400 to-sky-500',
  },
  {
    title: '구조 분해',
    desc: '소재, 인사이트, 타깃, 메시지, 리스크 단위로 쪼갭니다.',
    color: 'from-indigo-400 to-violet-500',
  },
  {
    title: '지식카드화',
    desc: '광고기획·콘텐츠·전략에서 재사용 가능한 카드로 정리합니다.',
    color: 'from-fuchsia-400 to-pink-500',
  },
  {
    title: '실행 재조합',
    desc: '브리프, 카피, 콘텐츠 구조, 리서치 보고서로 다시 조립합니다.',
    color: 'from-emerald-400 to-teal-500',
  },
];

const outputCards = [
  { title: '광고기획', items: ['캠페인 방향', '소비자 인사이트', '메시지 구조'] },
  { title: '콘텐츠', items: ['릴스 구조', '캐러셀 흐름', '저장/공유 훅'] },
  { title: '사업/전략', items: ['고객 문제', '가치제안', '검증 실험'] },
];

const formatDate = (value: string | null | undefined) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const stateCopy = {
  not_configured: 'Vercel Supabase 환경변수가 없어 DB를 읽을 수 없습니다.',
  loading: 'Supabase 지식 DB를 읽는 중입니다.',
  ready: '실제 DB 연결됨',
  empty: 'DB 연결됨 · 지식카드는 아직 0건입니다.',
  auth_or_rls_error: '로그인 권한 또는 RLS 정책 때문에 DB를 읽지 못했습니다.',
  schema_error: '필요한 지식 테이블 구조를 찾지 못했습니다.',
  unknown_error: 'DB 읽기 중 알 수 없는 오류가 발생했습니다.',
};

export default function MimirEngineView() {
  const knowledge = useKnowledgeReadOnlyData();
  const isConnected = knowledge.connectionState === 'ready' || knowledge.connectionState === 'empty';

  return (
    <div className="space-y-8 pb-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-gray-950/80 p-8 shadow-2xl shadow-cyan-950/20">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12)_1px,transparent_1px)] [background-size:28px_28px]" />
        </div>

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              Knowledge Engine
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
              mimir 엔진
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-300 md:text-base">
              Mimir는 흩어진 원문과 아이디어를 광고기획, 콘텐츠, 사업 전략에 다시 쓸 수 있는
              <span className="text-cyan-300"> 지식카드와 실행 재료</span>로 바꾸는 엔진입니다.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 text-xs font-semibold text-gray-300">
              {['Source 보존', 'Insight 추출', 'Content 재가공', 'Strategy 재조합'].map((tag) => (
                <span key={tag} className="rounded-full border border-gray-700 bg-gray-900/80 px-3 py-2">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/30 p-5 backdrop-blur">
            <div className="mb-4 flex items-center justify-between text-xs text-gray-400">
              <span className="font-mono uppercase tracking-[0.2em]">engine map</span>
              <Network className="h-4 w-4 text-cyan-300" />
            </div>
            <div className="space-y-3">
              {sourceNodes.map(({ label, detail, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl border border-gray-800 bg-gray-900/70 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-white">{label}</div>
                    <div className="text-xs text-gray-500">{detail}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-600" />
                </div>
              ))}
              <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-center">
                <BrainCircuit className="mx-auto mb-2 h-8 w-8 text-cyan-300" />
                <div className="text-sm font-black text-white">Mimir Core</div>
                <div className="mt-1 text-xs text-cyan-100/70">분류 · 요약 · 연결 · 재사용</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {pipelineSteps.map((step, index) => (
          <div key={step.title} className="relative rounded-3xl border border-gray-800 bg-gray-900/60 p-5">
            <div className={`mb-4 h-1.5 rounded-full bg-gradient-to-r ${step.color}`} />
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-mono text-gray-500">STEP {String(index + 1).padStart(2, '0')}</span>
              <Workflow className="h-4 w-4 text-gray-500" />
            </div>
            <h2 className="text-lg font-black text-white">{step.title}</h2>
            <p className="mt-3 text-xs leading-6 text-gray-400">{step.desc}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[2rem] border border-cyan-400/20 bg-gray-950/80 p-6 shadow-2xl shadow-cyan-950/10">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              <Database className="h-4 w-4" />
              Live DB Read-only
            </div>
            <h2 className="text-2xl font-black text-white">Mimir DB 현황</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              Supabase의 실제 지식 테이블을 읽기 전용으로 보여줍니다. 이 화면에서는 생성·수정·삭제를 하지 않습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void knowledge.reload()}
            disabled={knowledge.loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${knowledge.loading ? 'animate-spin' : ''}`} />
            DB 새로고침
          </button>
        </div>

        <div className={`mb-5 flex items-start gap-3 rounded-2xl border p-4 ${isConnected ? 'border-emerald-400/20 bg-emerald-400/10' : 'border-amber-400/20 bg-amber-400/10'}`}>
          {isConnected ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" /> : <AlertCircle className="mt-0.5 h-5 w-5 text-amber-300" />}
          <div className="min-w-0">
            <div className="text-sm font-black text-white">{stateCopy[knowledge.connectionState]}</div>
            <div className="mt-1 text-xs text-gray-400">
              마지막 읽기: {formatDate(knowledge.fetchedAt)}
              {knowledge.errorMessage ? ` · ${knowledge.errorMessage}` : ''}
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-6">
          {[
            ['지식카드', knowledge.counts.totalItems],
            ['수집 원문', knowledge.counts.sources],
            ['검토 대기', knowledge.counts.queue],
            ['정리 필요', knowledge.counts.needsCuration],
            ['승인됨', knowledge.counts.approved],
            ['A등급', knowledge.counts.highGrade],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-gray-800 bg-gray-900/70 p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">{label}</div>
              <div className="mt-2 text-3xl font-black text-white">{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-gray-800 bg-gray-900/60 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-white">지식카드</h3>
                <p className="text-xs text-gray-500">knowledge_items 실제 row</p>
              </div>
              <span className="rounded-full border border-gray-700 px-3 py-1 text-xs font-bold text-gray-400">{knowledge.items.length}개 표시</span>
            </div>
            {knowledge.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-950/60 p-6 text-center">
                <div className="text-sm font-bold text-gray-200">아직 지식카드가 없습니다.</div>
                <p className="mt-2 text-xs leading-6 text-gray-500">
                  DB에는 연결됐지만 knowledge_items는 0건입니다. 먼저 수집 원문을 카드로 변환하는 단계가 필요합니다.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {knowledge.items.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-cyan-300">
                      <span>{item.item_type}</span>
                      <span className="text-gray-700">·</span>
                      <span>{item.review_status}</span>
                      <span className="text-gray-700">·</span>
                      <span>{item.reuse_grade}</span>
                    </div>
                    <div className="mt-2 text-sm font-black text-white">{item.title}</div>
                    <p className="mt-2 text-xs leading-5 text-gray-400">{item.one_line_summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-gray-800 bg-gray-900/60 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-white">Source inbox</h3>
                <p className="text-xs text-gray-500">지식카드 생성 대기 원문 · read-only</p>
              </div>
              <span className="rounded-full border border-gray-700 px-3 py-1 text-xs font-bold text-gray-400">{knowledge.sources.length}개 표시</span>
            </div>
            {knowledge.sources.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-950/60 p-6 text-center text-sm font-bold text-gray-300">
                수집된 원문도 아직 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {knowledge.sources.slice(0, 6).map((source) => (
                  <div key={source.id} className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-emerald-300">
                      <span>{source.source_type}</span>
                      {source.publisher ? <><span className="text-gray-700">·</span><span>{source.publisher}</span></> : null}
                      <span className="text-gray-700">·</span>
                      <span>{formatDate(source.collected_at)}</span>
                    </div>
                    <div className="mt-2 text-sm font-black text-white">{source.title}</div>
                    {source.summary ? <p className="mt-2 text-xs leading-5 text-gray-400">{source.summary}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-3xl border border-gray-800 bg-gray-900/60 p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-300">
              <SplitSquareHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">분해 기준</h2>
              <p className="text-xs text-gray-500">원문을 바로 실행 가능한 단위로 나눕니다.</p>
            </div>
          </div>
          <div className="grid gap-3 text-sm">
            {['핵심 주장', '소비자/타깃', '브랜드 맥락', '콘텐츠 훅', '카피 슬롯', '검증 리스크'].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-2xl border border-gray-800 bg-gray-950/60 px-4 py-3">
                <span className="font-semibold text-gray-200">{item}</span>
                <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-lg shadow-cyan-400/50" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-800 bg-gray-900/60 p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">재사용 출력</h2>
              <p className="text-xs text-gray-500">지식카드는 아래 작업으로 다시 조립됩니다.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {outputCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-gray-800 bg-gray-950/60 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-white">
                  <Layers3 className="h-4 w-4 text-cyan-300" />
                  {card.title}
                </div>
                <ul className="space-y-2 text-xs text-gray-400">
                  {card.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
