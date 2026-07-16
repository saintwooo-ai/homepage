/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Terminal, 
  RefreshCw, 
  Sun, 
  Moon, 
  Menu,
  X,
  Clock,
  Play,
  Layers,
  Users,
  UserRound
} from 'lucide-react';
import { Task, Profile, KnowledgePipeline, EventLog, DashboardStats, TaskStatus, EventLevel } from './types';
import { 
  INITIAL_PROFILES, 
  INITIAL_TASKS, 
  INITIAL_KNOWLEDGE, 
  INITIAL_EVENTS, 
  SCENARIOS 
} from './mockData';

// Sub Views Import
import DashboardView from './components/DashboardView';
import KanbanView from './components/KanbanView';
import EventsView from './components/EventsView';
import MembersView from './components/MembersView';
import AccountView from './components/AccountView';
import { useAuth } from './auth/AuthContext';

export default function App() {
  // Navigation & UI State
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'kanban' | 'events' | 'members' | 'account'>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(true); // Default dark mode as recommended
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Core Data States
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [knowledge, setKnowledge] = useState<KnowledgePipeline>(INITIAL_KNOWLEDGE);
  const [events, setEvents] = useState<EventLog[]>(INITIAL_EVENTS);

  // Auto Refresh Countdown State
  const [timerCount, setTimerCount] = useState<number>(10);
  const [isAutoRefreshActive, setIsAutoRefreshActive] = useState<boolean>(true);

  // Simulation & Scenario States
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationProgress, setSimulationProgress] = useState<string>('');
  const activeTimeouts = useRef<NodeJS.Timeout[]>([]);

  // Calculate Dashboard Summary Stats
  const [stats, setStats] = useState<DashboardStats>({
    inProgress: 2,
    completed: 2,
    needsReview: 1,
    failed: 0
  });

  // Calculate stats dynamically on task update
  useEffect(() => {
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const needsReview = tasks.filter(t => t.status === 'needs_review').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    setStats({ inProgress, completed, needsReview, failed });
  }, [tasks]);

  // Handle 10-second automatic refresh countdown
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isAutoRefreshActive && !isSimulating) {
      interval = setInterval(() => {
        setTimerCount(prev => {
          if (prev <= 1) {
            triggerPeriodicUpdate();
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoRefreshActive, isSimulating]);

  // Handle HTML document body theme class
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // 10s Timer Expiry - Periodic random background updates
  const triggerPeriodicUpdate = () => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    // 1. Increment newsletter collected by 1-2 randomly
    const addNewsletter = Math.floor(Math.random() * 2) + 1;
    const addSource = Math.random() > 0.5 ? addNewsletter : addNewsletter - 1;
    
    setKnowledge(prev => ({
      ...prev,
      newsletterCollected: prev.newsletterCollected + addNewsletter,
      sourceSaved: prev.sourceSaved + addSource,
      obsidianSavedToday: prev.obsidianSavedToday + (Math.random() > 0.75 ? 1 : 0)
    }));

    // 2. Select an idle profile and simulate temporary activity
    const idleProfiles = profiles.filter(p => p.status === 'idle');
    if (idleProfiles.length > 0 && Math.random() > 0.5) {
      const chosen = idleProfiles[Math.floor(Math.random() * idleProfiles.length)];
      
      setProfiles(prev => prev.map(p => {
        if (p.id === chosen.id) {
          return {
            ...p,
            status: 'healthy',
            callCount: p.callCount + 1,
            lastUsedAt: '방금 전',
            recentTask: '백그라운드 정기 검사 정합성 체크'
          };
        }
        return p;
      }));

      // Add corresponding event log
      const newEvent: EventLog = {
        id: `evt_auto_${Date.now()}`,
        time: timeStr,
        actor: chosen.id,
        action: `자동 백그라운드 체크: Mimir 스토어 아카이빙 파이프라인 정상 가동 확인`,
        level: 'info'
      };
      setEvents(prev => [newEvent, ...prev]);

      // Reset back to idle after 3 seconds
      setTimeout(() => {
        setProfiles(prev => prev.map(p => {
          if (p.id === chosen.id) {
            return { ...p, status: 'idle', lastUsedAt: '방금 전' };
          }
          return p;
        }));
      }, 3000);
    } else {
      // General keep-alive log
      const keepAliveEvent: EventLog = {
        id: `evt_auto_keep_${Date.now()}`,
        time: timeStr,
        actor: 'server',
        action: `정기 상태 검사 완료 - 모든 컨테이너 게이트웨이 생존(Liveness) 및 리소스 최적화 상태`,
        level: 'success'
      };
      setEvents(prev => [keepAliveEvent, ...prev]);
    }
  };

  // Immediate manual refresh action
  const handleManualRefresh = () => {
    if (isSimulating) return;
    triggerPeriodicUpdate();
    setTimerCount(10);
  };

  // User Action: Approve Task (local demo simulation for 'needs_review' status)
  const handleApproveTask = (taskId: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'completed',
          currentStep: '사용자 승인 시뮬레이션 완료. 실제 재배포/게이트웨이 변경 없음',
          nextAction: '없음',
          updatedAt: `2026-07-11 ${timeStr.slice(0, 5)}`
        };
      }
      return t;
    }));

    // Activate server profile to healthy momentarily
    setProfiles(prev => prev.map(p => {
      if (p.id === 'server') {
        return {
          ...p,
          status: 'healthy',
          callCount: p.callCount + 1,
          lastUsedAt: '방금 전',
          recentTask: 'mock 승인 흐름 표시 — 실제 gateway/보안 키 동기화 없음'
        };
      }
      return p;
    }));

    const approvalEvent: EventLog = {
      id: `evt_approved_${Date.now()}`,
      time: timeStr,
      actor: 'server',
      action: `[mock 승인 수신]: 로컬 UI 상태만 완료로 표시 — 실제 gateway/라우터 재구동 또는 200 OK 검증 없음`,
      level: 'success'
    };

    setEvents(prev => [approvalEvent, ...prev]);

    // Back to idle for server after 4s
    setTimeout(() => {
      setProfiles(prev => prev.map(p => {
        if (p.id === 'server') {
          return { ...p, status: 'idle', lastUsedAt: '방금 전' };
        }
        return p;
      }));
    }, 4000);
  };

  // Clear Event Logs Action
  const handleClearEvents = () => {
    setEvents([]);
  };

  // Stop current active simulation
  const stopSimulation = () => {
    activeTimeouts.current.forEach(clearTimeout);
    activeTimeouts.current = [];
    setIsSimulating(false);
    setSimulationProgress('');
    setProfiles(prev => prev.map(p => ({ ...p, status: 'idle' })));
  };

  // Run Scenario Simulation
  const handleStartScenario = (scenarioType: 'ad' | 'dev' | 'obsidian') => {
    if (isSimulating) stopSimulation();

    setIsSimulating(true);
    setTimerCount(10); // Reset timer and halt
    
    const steps = SCENARIOS[scenarioType];
    if (!steps) return;

    const scenarioId = `task_sim_${Date.now()}`;
    const now = new Date();
    const startTimeStr = now.toTimeString().split(' ')[0];

    // Clear previous timeouts just in case
    activeTimeouts.current.forEach(clearTimeout);
    activeTimeouts.current = [];

    // Trigger sequential steps using setTimeout based on delay
    steps.forEach((step) => {
      const timeout = setTimeout(() => {
        const currentNow = new Date();
        const curTimeStr = currentNow.toTimeString().split(' ')[0];

        // 1. Update Simulation progress feedback
        setSimulationProgress(`${step.actor}가 작업 제어 수행 중...`);

        // 2. Add Event Log
        const newEvent: EventLog = {
          id: `evt_step_${Date.now()}_${step.actor}`,
          time: curTimeStr,
          actor: step.actor,
          action: step.action,
          level: step.level
        };
        setEvents(prev => [newEvent, ...prev]);

        // 3. Update Profiles involved
        setProfiles(prev => prev.map(p => {
          // If profile is involved in current step, set it as active/healthy
          const isInvolved = step.profilesInvolved?.includes(p.id) || p.id === step.actor;
          if (isInvolved) {
            return {
              ...p,
              status: 'healthy',
              callCount: p.callCount + 1,
              lastUsedAt: '방금 전',
              recentTask: step.taskTitle || p.recentTask
            };
          } else {
            // Otherwise, keep it as idle
            return { ...p, status: 'idle' };
          }
        }));

        // 4. Update Tasks
        setTasks(prev => {
          const taskExists = prev.some(t => t.id === scenarioId);
          if (taskExists) {
            return prev.map(t => {
              if (t.id === scenarioId) {
                return {
                  ...t,
                  status: step.taskStatus || t.status,
                  currentStep: step.taskStep || t.currentStep,
                  nextAction: step.taskNext || t.nextAction,
                  profiles: step.profilesInvolved || t.profiles,
                  updatedAt: `2026-07-11 ${curTimeStr.slice(0, 5)}`,
                  progress: step.progress !== undefined ? step.progress : t.progress,
                  estimatedTime: step.estimatedTime !== undefined ? step.estimatedTime : t.estimatedTime,
                };
              }
              return t;
            });
          } else if (step.taskTitle) {
            // First step creates the task
            const newTask: Task = {
              id: scenarioId,
              title: step.taskTitle,
              status: step.taskStatus || 'in_progress',
              owner: 'router',
              profiles: step.profilesInvolved || ['router'],
              currentStep: step.taskStep || '',
              nextAction: step.taskNext || '',
              updatedAt: `2026-07-11 ${curTimeStr.slice(0, 5)}`,
              progress: step.progress || 0,
              estimatedTime: step.estimatedTime || '대기',
            };
            return [newTask, ...prev];
          }
          return prev;
        });

        // 5. Update Knowledge stats
        if (step.knowledgeIncrement) {
          setKnowledge(prev => {
            const result = { ...prev };
            Object.keys(step.knowledgeIncrement!).forEach(key => {
              const k = key as keyof KnowledgePipeline;
              result[k] = result[k] + (step.knowledgeIncrement![k] || 0);
            });
            return result;
          });
        }

        // Final step handler
        if (step === steps[steps.length - 1]) {
          setIsSimulating(false);
          setSimulationProgress('');
          // Reset involved profiles back to healthy/idle status gracefully after 3 seconds
          setTimeout(() => {
            setProfiles(prev => prev.map(p => ({ ...p, status: 'idle' })));
          }, 3000);
        }

      }, step.delay);

      activeTimeouts.current.push(timeout);
    });
  };

  // User Custom Command text submission simulation
  const handleCustomRequest = (text: string) => {
    // Dynamically build a custom short scenario based on user input text
    // Defaulting to a simulated custom flow
    const isMarketing = text.includes('광고') || text.includes('마케팅') || text.includes('카피') || text.includes('홍보');
    const isDev = text.includes('개발') || text.includes('코드') || text.includes('API') || text.includes('서버') || text.includes('배포');
    
    let baseScenario: 'ad' | 'dev' | 'obsidian' = 'obsidian';
    if (isMarketing) baseScenario = 'ad';
    else if (isDev) baseScenario = 'dev';

    // Override the starting step to reflect the user's literal prompt
    const steps = [...SCENARIOS[baseScenario]];
    const customSteps = steps.map((step, idx) => {
      if (idx === 0) {
        return {
          ...step,
          action: `사용자 정의 프롬프트 수신: "${text}" 분석 완료. 협업 트리거 시작.`,
          taskTitle: text.length > 25 ? text.slice(0, 25) + '...' : text,
        };
      }
      return step;
    });

    // Create custom override scenario and run
    if (isSimulating) stopSimulation();

    setIsSimulating(true);
    setTimerCount(10);
    
    const scenarioId = `task_custom_${Date.now()}`;
    
    customSteps.forEach((step) => {
      const timeout = setTimeout(() => {
        const currentNow = new Date();
        const curTimeStr = currentNow.toTimeString().split(' ')[0];

        setSimulationProgress(`${step.actor}가 커스텀 분석 처리 중...`);

        const newEvent: EventLog = {
          id: `evt_custom_${Date.now()}_${step.actor}`,
          time: curTimeStr,
          actor: step.actor,
          action: step.action,
          level: step.level
        };
        setEvents(prev => [newEvent, ...prev]);

        setProfiles(prev => prev.map(p => {
          const isInvolved = step.profilesInvolved?.includes(p.id) || p.id === step.actor;
          if (isInvolved) {
            return {
              ...p,
              status: 'healthy',
              callCount: p.callCount + 1,
              lastUsedAt: '방금 전',
              recentTask: step.taskTitle || p.recentTask
            };
          } else {
            return { ...p, status: 'idle' };
          }
        }));

        setTasks(prev => {
          const taskExists = prev.some(t => t.id === scenarioId);
          if (taskExists) {
            return prev.map(t => {
              if (t.id === scenarioId) {
                return {
                  ...t,
                  status: step.taskStatus || t.status,
                  currentStep: step.taskStep || t.currentStep,
                  nextAction: step.taskNext || t.nextAction,
                  profiles: step.profilesInvolved || t.profiles,
                  updatedAt: `2026-07-11 ${curTimeStr.slice(0, 5)}`,
                  progress: step.progress !== undefined ? step.progress : t.progress,
                  estimatedTime: step.estimatedTime !== undefined ? step.estimatedTime : t.estimatedTime,
                };
              }
              return t;
            });
          } else if (step.taskTitle) {
            const newTask: Task = {
              id: scenarioId,
              title: step.taskTitle,
              status: step.taskStatus || 'in_progress',
              owner: 'router',
              profiles: step.profilesInvolved || ['router'],
              currentStep: step.taskStep || '',
              nextAction: step.taskNext || '',
              updatedAt: `2026-07-11 ${curTimeStr.slice(0, 5)}`,
              progress: step.progress || 0,
              estimatedTime: step.estimatedTime || '대기',
            };
            return [newTask, ...prev];
          }
          return prev;
        });

        if (step.knowledgeIncrement) {
          setKnowledge(prev => {
            const result = { ...prev };
            Object.keys(step.knowledgeIncrement!).forEach(key => {
              const k = key as keyof KnowledgePipeline;
              result[k] = result[k] + (step.knowledgeIncrement![k] || 0);
            });
            return result;
          });
        }

        if (step === customSteps[customSteps.length - 1]) {
          setIsSimulating(false);
          setSimulationProgress('');
          setTimeout(() => {
            setProfiles(prev => prev.map(p => ({ ...p, status: 'idle' })));
          }, 3000);
        }

      }, step.delay);

      activeTimeouts.current.push(timeout);
    });
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-100 text-gray-950'}`}>
      
      {/* Top Banner Status Info (Anti-AI-Slop Clean Layout) */}
      <div className={`border-b text-[11px] px-6 py-2.5 flex items-center justify-between font-mono tracking-wider ${darkMode ? 'bg-gray-900/40 border-gray-900/60 text-gray-400' : 'bg-white border-gray-200 text-gray-600'}`}>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            UGNAS CORE v1.0.2 MOCK DEMO
          </span>
          <span className="hidden sm:inline text-gray-500">|</span>
          <span className="hidden sm:inline">SIMULATION VIEW: no live VPS/gateway/API connection</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            UTC 2026-07-11
          </span>
          <span>● MOCK ONLY</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-36px)]">
        
        {/* Navigation Sidebar */}
        <aside className={`lg:w-64 border-r transition-all duration-300 flex-shrink-0 flex flex-col justify-between ${darkMode ? 'bg-gray-900/30 border-gray-900' : 'bg-white border-gray-200'}`}>
          <div className="p-5 space-y-6">
            
            {/* Logo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold font-mono shadow-md shadow-cyan-500/15">
                  U
                </div>
                <div>
                  <h2 className="font-extrabold text-sm tracking-tight">UGNAS AI</h2>
                  <span className="text-[9px] text-gray-500 font-mono tracking-widest block -mt-0.5">OPERATOR CONSOLE</span>
                </div>
              </div>

              {/* Mobile Sidebar Toggle */}
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-1 rounded-md hover:bg-gray-800 text-gray-400"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

            {/* Navigation Tabs */}
            <nav className="space-y-1.5">
              <button
                onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? (darkMode ? 'bg-indigo-500/10 text-cyan-400 border border-indigo-500/20' : 'bg-indigo-500/5 text-indigo-600 border border-indigo-500/15')
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/10'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                대시보드
              </button>

              <button
                onClick={() => { setActiveTab('kanban'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'kanban'
                    ? (darkMode ? 'bg-indigo-500/10 text-cyan-400 border border-indigo-500/20' : 'bg-indigo-500/5 text-indigo-600 border border-indigo-500/15')
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/10'
                }`}
              >
                <Layers className="w-4 h-4" />
                헤르메스 칸반보드
              </button>

              <button
                onClick={() => { setActiveTab('events'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'events'
                    ? (darkMode ? 'bg-indigo-500/10 text-cyan-400 border border-indigo-500/20' : 'bg-indigo-500/5 text-indigo-600 border border-indigo-500/15')
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/10'
                }`}
              >
                <Terminal className="w-4 h-4" />
                실시간 이벤트 로그
              </button>

              <button
                onClick={() => { setActiveTab('account'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === 'account'
                    ? (darkMode ? 'bg-indigo-500/10 text-cyan-400 border border-indigo-500/20' : 'bg-indigo-500/5 text-indigo-600 border border-indigo-500/15')
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/10'
                }`}
              >
                <UserRound className="w-4 h-4" />
                내 계정
              </button>

              {isAdmin && (
                <button
                  onClick={() => { setActiveTab('members'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeTab === 'members'
                      ? (darkMode ? 'bg-indigo-500/10 text-cyan-400 border border-indigo-500/20' : 'bg-indigo-500/5 text-indigo-600 border border-indigo-500/15')
                      : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/10'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  회원관리
                </button>
              )}
            </nav>

          </div>

          {/* Sidebar Footer Controls */}
          <div className={`p-5 border-t space-y-4 ${darkMode ? 'border-gray-900/60' : 'border-gray-200'}`}>
            
            {/* Auto Refresh State UI */}
            <div className="bg-gray-900/20 border border-gray-800/50 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500 font-mono">자동 갱신</span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${isAutoRefreshActive && !isSimulating ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse' : 'bg-gray-800 text-gray-500'}`}>
                  {isSimulating ? '정지됨' : isAutoRefreshActive ? '활성' : '비활성'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">
                  {isSimulating ? '시뮬레이션 중...' : `${timerCount}초 후 데이터 갱신`}
                </span>
                <button
                  onClick={handleManualRefresh}
                  disabled={isSimulating}
                  className="p-1 rounded bg-gray-900/80 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="즉시 수동 갱신"
                >
                  <RefreshCw className={`w-3 h-3 ${isSimulating ? '' : 'animate-spin-slow'}`} />
                </button>
              </div>
            </div>

            {/* Dark Mode Switch */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">테마 스타일</span>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                  darkMode 
                    ? 'bg-gray-900 border-gray-800 text-amber-400 hover:text-amber-300' 
                    : 'bg-white border-gray-200 text-indigo-600 hover:text-indigo-800'
                }`}
                title={darkMode ? '라이트 모드 전환' : '다크 모드 전환'}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>

          </div>
        </aside>

        {/* Core Content Area */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              tasks={tasks}
              profiles={profiles}
              events={events}
              stats={stats}
              onApproveTask={handleApproveTask}
              onStartScenario={handleStartScenario}
              onCustomRequest={handleCustomRequest}
              isSimulating={isSimulating}
              simulationProgress={simulationProgress}
            />
          )}

          {activeTab === 'kanban' && (
            <KanbanView />
          )}

          {activeTab === 'events' && (
            <EventsView 
              events={events} 
              onClearEvents={handleClearEvents}
            />
          )}

          {activeTab === 'account' && (
            <AccountView />
          )}

          {activeTab === 'members' && isAdmin && (
            <MembersView />
          )}
        </main>

      </div>
    </div>
  );
}

