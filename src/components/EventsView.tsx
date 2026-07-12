/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Terminal, 
  Search, 
  Trash2, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  XCircle,
  Clock
} from 'lucide-react';
import { EventLog, EventLevel } from '../types';

interface EventsViewProps {
  events: EventLog[];
  onClearEvents: () => void;
}

export default function EventsView({ events, onClearEvents }: EventsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  const filteredEvents = events.filter(evt => {
    const matchesSearch = 
      evt.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.action.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      levelFilter === 'all' || 
      evt.level === levelFilter;

    return matchesSearch && matchesFilter;
  });

  const getLevelStyles = (level: EventLevel) => {
    switch (level) {
      case 'success':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/20',
          text: 'text-emerald-400',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          label: 'SUCCESS'
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20',
          text: 'text-amber-400',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          label: 'WARNING'
        };
      case 'error':
        return {
          bg: 'bg-rose-500/10 border-rose-500/20',
          text: 'text-rose-400',
          icon: <XCircle className="w-4 h-4 text-rose-400" />,
          label: 'ERROR'
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-500/10 border-blue-500/20',
          text: 'text-blue-400',
          icon: <Info className="w-4 h-4 text-blue-400" />,
          label: 'INFO'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-gray-900/60 p-6 rounded-2xl border border-gray-800 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            Hermes 실시간 관제 이벤트 로그
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Hermes 내부에서 트리거된 세션 제어, 멀티 프로필 협업, 백업, 파이프라인 수행 역사를 시간역순으로 모니터링합니다.
          </p>
        </div>
        <button
          onClick={onClearEvents}
          className="px-3 py-1.5 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer self-start md:self-auto transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          로그 초기화
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-gray-950/20 border border-gray-800/80 p-4 rounded-xl">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="이벤트 행위자, 액션 메세지 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-gray-900/40 border border-gray-800 focus:border-cyan-500/40 focus:outline-none rounded-lg text-xs text-gray-200 placeholder-gray-500 transition-all"
          />
        </div>

        <div className="flex bg-gray-900/50 p-0.5 rounded-lg border border-gray-800 text-xs w-full md:w-auto justify-end">
          <button
            onClick={() => setLevelFilter('all')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              levelFilter === 'all' 
                ? 'bg-cyan-500/20 text-cyan-400 font-medium' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setLevelFilter('info')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              levelFilter === 'info' 
                ? 'bg-blue-500/20 text-blue-400 font-medium' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            정보
          </button>
          <button
            onClick={() => setLevelFilter('success')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              levelFilter === 'success' 
                ? 'bg-emerald-500/20 text-emerald-400 font-medium' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            성공
          </button>
          <button
            onClick={() => setLevelFilter('warning')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              levelFilter === 'warning' 
                ? 'bg-amber-500/20 text-amber-400 font-medium' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            경고
          </button>
          <button
            onClick={() => setLevelFilter('error')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              levelFilter === 'error' 
                ? 'bg-rose-500/20 text-rose-400 font-medium' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            오류
          </button>
        </div>
      </div>

      {/* Terminal Container */}
      <div className="bg-gray-950 border border-gray-800 rounded-2xl shadow-xl overflow-hidden font-mono text-xs">
        {/* Terminal Header Bar */}
        <div className="bg-gray-900/80 px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/60" />
            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
            <span className="text-gray-500 text-[10px] ml-2">syslog@ugnas_hermes:~</span>
          </div>
          <span className="text-[10px] text-gray-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            총 {filteredEvents.length}개 로그 출력됨
          </span>
        </div>

        {/* Terminal Body */}
        <div className="p-4 overflow-y-auto max-h-[500px] space-y-3 divide-y divide-gray-900">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              $ grep -i "{searchTerm}" ugnas_hermes.log
              <br />
              <span className="text-gray-500 text-[10px] block mt-1">일치하는 이벤트를 찾을 수 없습니다.</span>
            </div>
          ) : (
            filteredEvents.map((evt) => {
              const styles = getLevelStyles(evt.level);
              return (
                <div 
                  key={evt.id}
                  className="flex items-start gap-3 pt-3 first:pt-0"
                >
                  <span className="text-[10px] text-gray-500 pt-0.5 whitespace-nowrap">
                    [{evt.time}]
                  </span>
                  
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none ${styles.bg} ${styles.text}`}>
                    {styles.label}
                  </span>

                  <span className="text-cyan-400 font-semibold whitespace-nowrap">
                    {evt.actor}
                  </span>

                  <span className="text-gray-500">&gt;</span>

                  <span className="text-gray-300 break-all leading-relaxed">
                    {evt.action}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
