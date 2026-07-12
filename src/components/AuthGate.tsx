import React, { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { LogOut, ShieldCheck } from 'lucide-react';
import { AuthProvider } from '../auth/AuthContext';
import { emailToUsername, parseAdminUsernames, usernameToEmail } from '../auth/identity';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type AuthGateProps = {
  children: ReactNode;
};

export default function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const adminUsernames = useMemo(() => parseAdminUsernames(import.meta.env.VITE_ADMIN_USERNAMES), []);
  const username = emailToUsername(session?.user.email);
  const isAdmin = Boolean(username && adminUsernames.includes(username));

  useEffect(() => {
    if (!supabase) {
      setIsLoadingSession(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setIsLoadingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setIsLoadingSession(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || isSubmitting) return;

    const email = usernameToEmail(usernameInput);
    setIsSubmitting(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setIsSubmitting(false);

    if (error) {
      setMessage({ type: 'error', text: '아이디 또는 비밀번호가 맞지 않아.' });
      return;
    }

    setMessage({ type: 'success', text: '로그인 완료. 내부 콘솔로 이동할게.' });
  }

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUsernameInput('');
    setPassword('');
    setMessage({ type: 'info', text: '로그아웃됐어.' });
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-3xl border border-amber-500/30 bg-gray-900/80 p-8 shadow-2xl shadow-amber-950/20">
          <p className="text-xs font-mono text-amber-300 mb-3">SUPABASE CONFIG REQUIRED</p>
          <h1 className="text-2xl font-bold mb-3">로그인 설정이 아직 연결되지 않았어</h1>
          <p className="text-sm text-gray-400 leading-6">
            Vercel 환경변수에 <code className="text-cyan-300">VITE_SUPABASE_URL</code>,{' '}
            <code className="text-cyan-300">VITE_SUPABASE_ANON_KEY</code>,{' '}
            <code className="text-cyan-300">VITE_ADMIN_USERNAMES</code>를 넣으면 로그인 화면이 활성화돼.
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-sm font-mono text-cyan-300 animate-pulse">세션 확인 중...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6 font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.18),_transparent_40%)]" />
        <div className="relative w-full max-w-md rounded-3xl border border-gray-800 bg-gray-900/80 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono tracking-[0.35em] text-cyan-300">UGNAS AI</p>
              <h1 className="text-xl font-extrabold tracking-tight">내부 로그인</h1>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-xs font-semibold text-gray-400">아이디</span>
              <input
                className="w-full rounded-2xl border border-gray-800 bg-gray-950/80 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-cyan-400"
                type="text"
                autoComplete="username"
                value={usernameInput}
                onChange={(event) => setUsernameInput(event.target.value)}
                placeholder="admin"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-semibold text-gray-400">비밀번호</span>
              <input
                className="w-full rounded-2xl border border-gray-800 bg-gray-950/80 px-4 py-3 text-sm text-gray-100 outline-none transition focus:border-cyan-400"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호"
                minLength={4}
                required
              />
            </label>

            {message && (
              <div className={`rounded-2xl border px-4 py-3 text-xs leading-5 ${
                message.type === 'error'
                  ? 'border-red-500/30 bg-red-500/10 text-red-200'
                  : message.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200'
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-bold text-gray-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? '처리 중...' : '로그인'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs leading-5 text-gray-500">
            공개 회원가입은 막혀 있어. 계정 추가/삭제는 관리자 로그인 후 회원관리 메뉴에서 처리해.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider value={{ session, username, isAdmin, adminUsernames }}>
      <div className="fixed right-4 top-12 z-50 flex items-center gap-2 rounded-full border border-gray-800 bg-gray-950/80 px-3 py-2 text-[11px] text-gray-300 shadow-lg shadow-black/20 backdrop-blur">
        <span className="hidden sm:inline max-w-[180px] truncate">{username}</span>
        {isAdmin && <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 font-bold text-cyan-300">ADMIN</span>}
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-1 rounded-full bg-gray-800 px-2 py-1 font-semibold text-gray-200 transition hover:bg-red-500/20 hover:text-red-200"
        >
          <LogOut className="h-3.5 w-3.5" />
          로그아웃
        </button>
      </div>
      {children}
    </AuthProvider>
  );
}
