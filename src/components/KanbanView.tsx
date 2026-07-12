/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  User, 
  Hourglass, 
  TrendingUp, 
  Cpu, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Task, TaskStatus } from '../types';

interface KanbanViewProps {
  tasks: Task[];
  onApproveTask: (taskId: string) => void;
}

export default function KanbanView({ tasks, onApproveTask }: KanbanViewProps) {
  // 정의된 칸반 컬럼 목록
  const columns = [
    {
      id: 'idle' as TaskStatus,
      title: '대기 중 (Ready)',
      color: 'border-gray-800 bg-gray-900/10 text-gray-400',
      icon: <Hourglass className="w-4 h-4 text-gray-500" />
    },
    {
      id: 'in_progress' as TaskStatus,
      title: '수행 중 (Active)',
      color: 'border-blue-500/20 bg-blue-500/5 text-blue-400',
      icon: <Clock className="w-4 h-4 text-blue-400 animate-spin-slow" />
    },
    {
      id: 'needs_review' as TaskStatus,
      title: '사용자 검토 (Awaiting Action)',
      color: 'border-amber-500/30 bg-amber-500/5 text-amber-300',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
    },
    {
      id: 'completed' as TaskStatus,
      title: '작업 종결 (Archived)',
      color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    }
  ];

  // 각 태스크를 컬럼 그룹으로 매핑 (failed 상태는 completed 쪽에 묶어서 표시하거나 별도로 필터링)
  const getTasksByColumn = (status: TaskStatus) => {
    if (status === 'completed') {
      return tasks.filter(t => t.status === 'completed' || t.status === 'failed');
    }
    return tasks.filter(t => t.status === status);
  };

  const getProgressColor = (progress: number, status: string) => {
    if (status === 'failed') return 'bg-rose-500';
    if (progress >= 100) return 'bg-emerald-500';
    if (progress > 50) return 'bg-gradient-to-r from-blue-500 to-indigo-500';
    return 'bg-gradient-to-r from-cyan-400 to-blue-500';
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-gray-900/60 p-6 rounded-2xl border border-gray-800 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            Hermes 협업 워크플로우 칸반보드
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            각 전문 AI 프로필이 어떤 작업을 전담하여 실행하고 있는지 한눈에 관제하며, 진척 상태와 남은 예상 소요시간을 실시간 모니터링합니다.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 font-mono bg-gray-950/40 border border-gray-800 px-3 py-1.5 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>REAL-TIME PIPELINE ACTIVE</span>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {columns.map(col => {
          const colTasks = getTasksByColumn(col.id);

          return (
            <div 
              key={col.id} 
              className="flex flex-col bg-gray-950/40 border border-gray-900 rounded-2xl p-4 min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-900/60 mb-4">
                <div className="flex items-center gap-2">
                  {col.icon}
                  <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">{col.title}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-gray-900 text-gray-500 text-[10px] font-mono font-bold">
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards Stack */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {colTasks.length === 0 ? (
                    <div className="h-28 border border-dashed border-gray-900 rounded-xl flex items-center justify-center text-xs text-gray-600 font-mono text-center px-4">
                      작업 없음
                    </div>
                  ) : (
                    colTasks.map(task => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className={`bg-gray-900/40 border border-gray-800/80 p-4 rounded-xl hover:border-gray-700/60 transition-all shadow-md group relative overflow-hidden`}
                      >
                        {/* Task Card Header */}
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[9px] font-mono font-bold bg-indigo-950/40 text-indigo-300 border border-indigo-950 px-1.5 py-0.5 rounded">
                              {task.id}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {task.updatedAt.slice(11)}
                            </span>
                          </div>
                          <h3 className="text-xs font-bold text-gray-100 group-hover:text-indigo-400 transition-colors leading-snug">
                            {task.title}
                          </h3>
                        </div>

                        {/* Profiles / Owner Badge */}
                        <div className="mt-3 flex flex-wrap items-center gap-1">
                          <span className="text-[8px] text-gray-500 uppercase font-bold tracking-wider mr-1">수행 에이전트:</span>
                          {task.profiles.map(profile => (
                            <span 
                              key={profile} 
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-900 border border-gray-800 rounded-md text-[9px] font-mono font-medium text-gray-300"
                            >
                              <span className="w-1 h-1 rounded-full bg-cyan-400" />
                              {profile}
                            </span>
                          ))}
                        </div>

                        {/* Progress Bar Container */}
                        <div className="mt-4 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-gray-500 font-mono flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5 text-cyan-500" />
                              진척도
                            </span>
                            <span className="font-bold text-white font-mono">{task.progress}%</span>
                          </div>
                          
                          {/* Visual Progress Bar */}
                          <div className="w-full bg-gray-950 h-1.5 rounded-full overflow-hidden border border-gray-900">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${task.progress}%` }}
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                              className={`h-full rounded-full ${getProgressColor(task.progress, task.status)}`}
                            />
                          </div>
                        </div>

                        {/* Estimated Time Remaining */}
                        <div className="mt-3.5 pt-3 border-t border-gray-900/60 flex items-center justify-between text-[10px]">
                          <span className="text-gray-500 font-mono flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            남은 시간
                          </span>
                          <span className={`font-semibold font-mono ${
                            task.status === 'completed' ? 'text-emerald-400' :
                            task.status === 'failed' ? 'text-rose-400' : 'text-cyan-300'
                          }`}>
                            {task.estimatedTime}
                          </span>
                        </div>

                        {/* Action Details (Step descriptions) */}
                        <div className="mt-3 bg-gray-950/60 p-2 rounded-lg space-y-1 border border-gray-950 text-[10px]">
                          <div className="text-gray-400 truncate">
                            <span className="text-gray-600 font-semibold mr-1">현재:</span>
                            {task.currentStep}
                          </div>
                          {task.nextAction !== '없음' && (
                            <div className="text-indigo-300 truncate">
                              <span className="text-gray-600 font-semibold mr-1">다음:</span>
                              {task.nextAction}
                            </div>
                          )}
                        </div>

                        {/* Needs Review Action button overlay */}
                        {task.status === 'needs_review' && (
                          <div className="mt-3 pt-2 border-t border-gray-900/40">
                            <button
                              onClick={() => onApproveTask(task.id)}
                              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold rounded-lg text-[10px] shadow-md shadow-amber-500/10 transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                              즉시 승인 수동 처리
                            </button>
                          </div>
                        )}

                        {/* Failed status notice */}
                        {task.status === 'failed' && (
                          <div className="absolute top-2 right-2 p-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-md text-[8px] font-mono">
                            ERROR BLOCKED
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
