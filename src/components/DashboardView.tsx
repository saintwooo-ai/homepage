/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  Cpu, 
  Send,
  Check,
  RotateCcw
} from 'lucide-react';
import { Task, Profile, EventLog, DashboardStats } from '../types';

interface DashboardViewProps {
  tasks: Task[];
  profiles: Profile[];
  events: EventLog[];
  stats: DashboardStats;
  onApproveTask: (taskId: string) => void;
  onStartScenario: (scenarioType: 'ad' | 'dev' | 'obsidian') => void;
  onCustomRequest: (text: string) => void;
  isSimulating: boolean;
  simulationProgress: string;
}

export default function DashboardView({
  tasks,
  profiles,
  events,
  stats,
  onApproveTask,
  onStartScenario,
  onCustomRequest,
  isSimulating,
  simulationProgress,
}: DashboardViewProps) {
  const [customInput, setCustomInput] = useState('');

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim() || isSimulating) return;
    onCustomRequest(customInput);
    setCustomInput('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-400 animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'needs_review':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-rose-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'border-blue-500/30 bg-blue-500/5 text-blue-300';
      case 'completed':
        return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300';
      case 'needs_review':
        return 'border-amber-500/30 bg-amber-500/5 text-amber-300 animate-pulse';
      case 'failed':
        return 'border-rose-500/30 bg-rose-500/5 text-rose-300';
      default:
        return 'border-gray-700 bg-gray-800/50 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-900/60 p-6 rounded-2xl border border-gray-800 shadow-xl backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">UGNAS AI</span> 
            <span className="text-gray-500 font-normal text-lg">|</span> 
            <span className="text-lg font-medium text-gray-300">Hermes Status Console</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            AI 작업 흐름, 프로필 협업, 지식 저장 파이프라인 상태를 통합 관제하는 실시간 오퍼레이션 대시보드입니다.
          </p>
        </div>
        {isSimulating && (
          <div className="flex items-center gap-3 bg-indigo-950/40 border border-indigo-500/30 px-4 py-2 rounded-xl text-xs text-indigo-300">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span className="font-mono">시뮬레이션 가동 중: {simulationProgress}</span>
          </div>
        )}
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* In Progress */}
        <div className="bg-gray-900/40 border border-gray-800 p-5 rounded-2xl hover:border-blue-500/20 transition-all shadow-md group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">진행 중인 작업</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-white font-mono">{stats.inProgress}</span>
            <span className="text-xs text-blue-400 ml-2">Active Tasks</span>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-gray-900/40 border border-gray-800 p-5 rounded-2xl hover:border-emerald-500/20 transition-all shadow-md group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">완료된 작업</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-white font-mono">{stats.completed}</span>
            <span className="text-xs text-emerald-400 ml-2">Done Today</span>
          </div>
        </div>

        {/* Needs Review */}
        <div className="bg-gray-900/40 border border-gray-800 p-5 rounded-2xl hover:border-amber-500/20 transition-all shadow-md group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">사용자 확인 필요</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-white font-mono">{stats.needsReview}</span>
            <span className="text-xs text-amber-400 ml-2">Awaiting Action</span>
          </div>
        </div>

        {/* Failed */}
        <div className="bg-gray-900/40 border border-gray-800 p-5 rounded-2xl hover:border-rose-500/20 transition-all shadow-md group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">막힘 / 오류</span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <XCircle className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-white font-mono">{stats.failed}</span>
            <span className="text-xs text-rose-400 ml-2">Blocked/Errors</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Sandbox Console & Active Task list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8/12) - Tasks and Reviews */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Awaiting Review Tasks (High Priority UI) */}
          {tasks.some(t => t.status === 'needs_review') && (
            <div className="bg-gradient-to-r from-amber-950/20 to-gray-950 border border-amber-500/30 p-5 rounded-2xl shadow-lg">
              <h2 className="text-sm font-semibold tracking-wider text-amber-400 uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 animate-bounce" />
                사용자 확인 및 승인 대기 중
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                게이트웨이 활성화나 자원 할당 등 Hermes의 핵심 오퍼레이션을 직접 확인하고 승인하세요.
              </p>
              
              <div className="mt-4 space-y-3">
                <AnimatePresence mode="popLayout">
                  {tasks
                    .filter(t => t.status === 'needs_review')
                    .map(task => (
                      <motion.div 
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-gray-900/80 border border-amber-500/20 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-white">{task.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                            <span className="font-mono bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
                              {task.owner}
                            </span>
                            <span>•</span>
                            <span>{task.currentStep}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => onApproveTask(task.id)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-950 font-semibold rounded-xl text-xs shadow-md shadow-amber-500/10 transition-all flex items-center justify-center gap-1.5 self-end md:self-auto cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                          실행 승인
                        </button>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Active Work Flow Tracker */}
          <div className="bg-gray-950/40 border border-gray-800 p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-4 border-b border-gray-800/60 pb-3">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                작업 상태 트래커 (진행 중 및 최근 작업)
              </h2>
              <span className="text-xs text-gray-500 font-mono">Live Logs</span>
            </div>

            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm">
                  현재 등록된 작업이 없습니다. 우측 콘솔에서 시뮬레이션을 가동해보세요!
                </div>
              ) : (
                tasks.map(task => (
                  <div 
                    key={task.id}
                    className="p-4 bg-gray-900/20 border border-gray-800/60 rounded-xl hover:bg-gray-900/40 transition-all flex flex-col md:flex-row gap-4 justify-between"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getStatusColorClass(task.status)}`}>
                          {task.status === 'in_progress' ? '진행 중' : 
                           task.status === 'completed' ? '완료' : 
                           task.status === 'needs_review' ? '검토 대기' : '막힘/오류'}
                        </span>
                        <h3 className="text-sm font-medium text-gray-100">{task.title}</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <span className="text-gray-500 w-16">현재 단계:</span>
                          <span className="text-gray-200 truncate max-w-[240px]">{task.currentStep}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <span className="text-gray-500 w-16">다음 액션:</span>
                          <span className="text-indigo-300 truncate max-w-[240px]">{task.nextAction}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400 md:col-span-2 mt-1">
                          <span className="text-gray-500 w-16">관련 프로필:</span>
                          <div className="flex flex-wrap gap-1">
                            {task.profiles.map(p => (
                              <span key={p} className="bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col justify-between items-end gap-2 border-t md:border-t-0 border-gray-800/40 pt-2 md:pt-0">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(task.status)}
                      </div>
                      <span className="text-[10px] font-mono text-gray-500">{task.updatedAt}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4/12) - Interaction & Control Center */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI Operation Command Input */}
          <div className="bg-gray-950/40 border border-gray-800 p-6 rounded-2xl shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
            <h2 className="font-semibold text-white flex items-center gap-2 mb-2">
              <Send className="w-4 h-4 text-cyan-400" />
              수동 명령어 제어기
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Hermes router에게 직접 가상 자연어 명령을 입력해 프로필 호출 파이프라인을 작동시킬 수 있습니다.
            </p>

            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="예: '이번주 광고 트렌드 리포트 생성하고 Obsidian에 백업해줘' 또는 '로컬 환경 Docker 가비지 청소해줘'"
                disabled={isSimulating}
                className="w-full h-24 bg-gray-900/50 border border-gray-800 focus:border-cyan-500/50 focus:outline-none rounded-xl p-3 text-xs text-gray-200 placeholder-gray-500 resize-none transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!customInput.trim() || isSimulating}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 disabled:from-gray-800 disabled:to-gray-800 text-white font-medium rounded-xl text-xs shadow-md shadow-cyan-500/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                명령어 전송
              </button>
            </form>
          </div>

          {/* Quick Scenario Simulators */}
          <div className="bg-gray-950/40 border border-gray-800 p-6 rounded-2xl shadow-md">
            <h2 className="font-semibold text-white flex items-center gap-2 mb-2">
              <Play className="w-4 h-4 text-emerald-400" />
              원클릭 시나리오 시뮬레이터
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              AI가 사전에 구성된 전문 영역 멀티프로필 협업 흐름을 실제로 밟아나가는 과정을 눈으로 확인해 보세요.
            </p>

            <div className="space-y-3">
              {/* Ad Campaign Scenario */}
              <button
                onClick={() => !isSimulating && onStartScenario('ad')}
                disabled={isSimulating}
                className="w-full text-left p-3 rounded-xl border border-gray-800 bg-gray-900/20 hover:bg-gray-900/50 hover:border-emerald-500/20 transition-all group disabled:opacity-50 disabled:hover:bg-gray-900/20 disabled:hover:border-gray-800 flex items-center justify-between cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-200 group-hover:text-emerald-400 transition-colors">
                    광고 기획 및 카피라이팅 협업
                  </div>
                  <div className="text-[10px] text-gray-400">
                    ad-pm → research → planner → copywriter → obsidian
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Dev API Deployment */}
              <button
                onClick={() => !isSimulating && onStartScenario('dev')}
                disabled={isSimulating}
                className="w-full text-left p-3 rounded-xl border border-gray-800 bg-gray-900/20 hover:bg-gray-900/50 hover:border-cyan-500/20 transition-all group disabled:opacity-50 disabled:hover:bg-gray-900/20 disabled:hover:border-gray-800 flex items-center justify-between cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-200 group-hover:text-cyan-400 transition-colors">
                    Express API 구현 및 배포
                  </div>
                  <div className="text-[10px] text-gray-400">
                    dev-pm → dev-builder → server rolling-update
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Obsidian Knowledge Base */}
              <button
                onClick={() => !isSimulating && onStartScenario('obsidian')}
                disabled={isSimulating}
                className="w-full text-left p-3 rounded-xl border border-gray-800 bg-gray-900/20 hover:bg-gray-900/50 hover:border-purple-500/20 transition-all group disabled:opacity-50 disabled:hover:bg-gray-900/20 disabled:hover:border-gray-800 flex items-center justify-between cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-200 group-hover:text-purple-400 transition-colors">
                    AI 리서치 지식 가공 및 적재
                  </div>
                  <div className="text-[10px] text-gray-400">
                    router → obsidian-architect (원자 노드화)
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
