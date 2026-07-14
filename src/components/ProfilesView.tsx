/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Filter, 
  Cpu, 
  Clock, 
  FileText, 
  Activity, 
  CheckCircle2, 
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { Profile } from '../types';
import ProfileWorkStatePanel from './ProfileWorkStatePanel';

interface ProfilesViewProps {
  profiles: Profile[];
}

export default function ProfilesView({ profiles }: ProfilesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = 
      profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.recentTask.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      statusFilter === 'all' || 
      (statusFilter === 'healthy' && profile.status === 'healthy') ||
      (statusFilter === 'idle' && profile.status === 'idle') ||
      (statusFilter === 'warning' && (profile.status === 'warning' || profile.status === 'error'));

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            정상 작동
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            조치 필요
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            오류 발생
          </span>
        );
      case 'idle':
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-gray-500/10 text-gray-400 border border-gray-700 px-2 py-0.5 rounded-full text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            대기 중
          </span>
        );
    }
  };

  const getStatusBorderClass = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'hover:border-emerald-500/30 hover:shadow-emerald-500/5';
      case 'warning':
        return 'border-amber-500/30 hover:border-amber-500/50 hover:shadow-amber-500/5';
      case 'error':
        return 'border-rose-500/30 hover:border-rose-500/50 hover:shadow-rose-500/5';
      case 'idle':
      default:
        return 'hover:border-gray-700 hover:shadow-gray-500/5';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Panel */}
      <div className="bg-gray-900/60 p-6 rounded-2xl border border-gray-800 shadow-xl backdrop-blur-md">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-400" />
          Hermes AI 협업 프로필
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          현재 UGNAS AI에 탑재된 전문 역할 프로필 명단입니다. 라우터(router)가 사용자 요청에 부합하는 프로필들을 동적으로 호출하여 멀티 에이전트 협업 네트워크를 구성합니다.
        </p>
      </div>

      <ProfileWorkStatePanel />

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-gray-950/20 border border-gray-800/80 p-4 rounded-xl">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="프로필명, 역할, 최근 작업 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-gray-900/40 border border-gray-800 focus:border-emerald-500/40 focus:outline-none rounded-lg text-xs text-gray-200 placeholder-gray-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-400 hidden sm:inline">상태 필터:</span>
          <div className="flex bg-gray-900/50 p-0.5 rounded-lg border border-gray-800 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                statusFilter === 'all' 
                  ? 'bg-emerald-500/20 text-emerald-400 font-medium' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setStatusFilter('healthy')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                statusFilter === 'healthy' 
                  ? 'bg-emerald-500/20 text-emerald-400 font-medium' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              정상
            </button>
            <button
              onClick={() => setStatusFilter('idle')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                statusFilter === 'idle' 
                  ? 'bg-emerald-500/20 text-emerald-400 font-medium' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              대기
            </button>
            <button
              onClick={() => setStatusFilter('warning')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                statusFilter === 'warning' 
                  ? 'bg-emerald-500/20 text-emerald-400 font-medium' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              이상/조치
            </button>
          </div>
        </div>
      </div>

      {/* Profile Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProfiles.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-gray-900/10 border border-dashed border-gray-800 rounded-2xl text-gray-500 text-sm">
            검색 필터에 부합하는 AI 프로필이 존재하지 않습니다.
          </div>
        ) : (
          filteredProfiles.map((profile, idx) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.03 }}
              className={`bg-gray-900/30 border border-gray-800/80 p-5 rounded-2xl flex flex-col justify-between transition-all shadow-md group ${getStatusBorderClass(profile.status)}`}
            >
              <div className="space-y-4">
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-md font-bold text-gray-100 font-mono tracking-wide flex items-center gap-1.5 group-hover:text-emerald-400 transition-colors">
                      <Cpu className="w-4 h-4 text-emerald-500" />
                      {profile.name}
                    </h3>
                    <span className="text-[10px] text-gray-500 font-mono">ID: {profile.id}</span>
                  </div>
                  {getStatusBadge(profile.status)}
                </div>

                {/* Role Description */}
                <p className="text-xs text-gray-300 leading-relaxed min-h-[40px]">
                  {profile.role}
                </p>

                {/* Call Analytics Bar */}
                <div className="bg-gray-950/40 p-3 rounded-xl border border-gray-800/60 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-cyan-400" />
                      일일 누적 호출수
                    </span>
                    <span className="font-semibold text-white">{profile.callCount}회</span>
                  </div>
                  {/* Fake Visual Indicator */}
                  <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full" 
                      style={{ width: `${Math.min(100, (profile.callCount / 150) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer (Task Details) */}
              <div className="mt-4 pt-4 border-t border-gray-800/60 flex flex-col gap-2 text-xs text-gray-400">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-[10px] text-gray-500">최근 태스크:</span>
                  <span className="text-gray-300 font-medium truncate max-w-[180px]" title={profile.recentTask}>
                    {profile.recentTask}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-[10px] text-gray-500">마지막 호출:</span>
                  <span className="text-gray-400 font-mono text-[11px]">{profile.lastUsedAt}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
