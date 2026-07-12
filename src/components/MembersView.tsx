import React, { FormEvent, useEffect, useState } from 'react';
import { KeyRound, RefreshCw, Trash2, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { normalizeUsername } from '../auth/identity';
import { supabase } from '../lib/supabase';

type ManagedUser = {
  id: string;
  username: string;
  created_at?: string;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
};

export default function MembersView() {
  const { isAdmin, session, adminUsernames } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('1313');
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  async function getToken() {
    if (!supabase) throw new Error('Supabase client is not configured.');
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) throw new Error(error?.message ?? '로그인 세션이 없어.');
    return data.session.access_token;
  }

  async function requestAdminUsers(options: RequestInit = {}) {
    const token = await getToken();
    const response = await fetch('/api/admin-users', {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers ?? {}),
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error ?? `요청 실패: HTTP ${response.status}`);
    }
    return payload;
  }

  async function loadUsers() {
    if (!isAdmin) return;
    setLoading(true);
    setMessage(null);
    try {
      const payload = await requestAdminUsers();
      setUsers(payload.users ?? []);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '회원 목록을 불러오지 못했어.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const normalized = normalizeUsername(username);
      const payload = await requestAdminUsers({
        method: 'POST',
        body: JSON.stringify({ username: normalized, password }),
      });
      setUsers((current) => [payload.user, ...current.filter((user) => user.id !== payload.user.id)]);
      setUsername('');
      setPassword('1313');
      setMessage({ type: 'success', text: `회원 ${normalized} 계정을 추가했어. 임시 비밀번호는 1313으로 전달하면 돼.` });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '회원 추가에 실패했어.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword(user: ManagedUser) {
    const newPassword = resetPasswords[user.id] ?? '1313';
    setMessage(null);
    try {
      const payload = await requestAdminUsers({
        method: 'PATCH',
        body: JSON.stringify({ id: user.id, password: newPassword }),
      });
      setUsers((current) => current.map((item) => item.id === user.id ? payload.user : item));
      setResetPasswords((current) => ({ ...current, [user.id]: '1313' }));
      setMessage({ type: 'success', text: `${user.username} 비밀번호를 변경했어.` });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '비밀번호 변경에 실패했어.' });
    }
  }

  async function handleDeleteUser(user: ManagedUser) {
    if (!window.confirm(`${user.username} 계정을 삭제할까? 이 작업은 되돌리기 어려워.`)) return;
    setMessage(null);
    try {
      await requestAdminUsers({
        method: 'DELETE',
        body: JSON.stringify({ id: user.id }),
      });
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setMessage({ type: 'success', text: `${user.username} 계정을 삭제했어.` });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '회원 삭제에 실패했어.' });
    }
  }

  useEffect(() => {
    loadUsers();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <section className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-red-200">
        <h1 className="text-2xl font-bold">접근 권한 없음</h1>
        <p className="mt-2 text-sm text-red-200/80">회원관리는 관리자 계정으로만 접근할 수 있어.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-mono tracking-[0.3em] text-cyan-400">ADMIN ONLY</p>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-extrabold tracking-tight">
            <Users className="h-7 w-7 text-cyan-400" />
            회원관리
          </h1>
          <p className="mt-2 text-sm text-gray-400">아이디 기준으로 내부 계정을 추가/삭제하고 비밀번호를 재설정해.</p>
        </div>
        <button
          type="button"
          onClick={loadUsers}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-800 bg-gray-900 px-4 py-2 text-xs font-bold text-gray-200 hover:border-cyan-500/40 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      <form onSubmit={handleCreateUser} className="grid gap-3 rounded-3xl border border-gray-800 bg-gray-900/50 p-5 lg:grid-cols-[1fr_1fr_auto]">
        <label className="space-y-2">
          <span className="text-xs font-semibold text-gray-400">새 회원 아이디</span>
          <input
            className="w-full rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm outline-none focus:border-cyan-400"
            type="text"
            value={username}
            onChange={(event) => setUsername(normalizeUsername(event.target.value))}
            placeholder="member01"
            required
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold text-gray-400">임시 비밀번호</span>
          <input
            className="w-full rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm outline-none focus:border-cyan-400"
            type="text"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="1313"
            minLength={4}
            required
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-extrabold text-gray-950 hover:bg-cyan-300 disabled:opacity-60 lg:self-end"
        >
          <UserPlus className="h-4 w-4" />
          {saving ? '추가 중...' : '회원 추가'}
        </button>
      </form>

      {message && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${
          message.type === 'error'
            ? 'border-red-500/30 bg-red-500/10 text-red-200'
            : message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-gray-800 bg-gray-900/40">
        <div className="grid grid-cols-[1fr_auto] border-b border-gray-800 px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 lg:grid-cols-[1fr_1fr_1fr_auto_auto]">
          <span>아이디</span>
          <span className="hidden lg:block">생성일</span>
          <span className="hidden lg:block">최근 로그인</span>
          <span>비밀번호</span>
          <span>관리</span>
        </div>
        {loading ? (
          <div className="p-6 text-sm text-gray-400">회원 목록을 불러오는 중...</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-sm text-gray-400">등록된 회원이 없거나 아직 서버 설정이 완료되지 않았어.</div>
        ) : (
          users.map((user) => {
            const protectedAccount = user.id === session.user.id || adminUsernames.includes(user.username);
            return (
              <div key={user.id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-gray-900 px-5 py-4 text-sm last:border-b-0 lg:grid-cols-[1fr_1fr_1fr_auto_auto]">
                <div>
                  <p className="font-semibold text-gray-100">{user.username}</p>
                  <p className="mt-1 font-mono text-[10px] text-gray-600">{user.id}</p>
                </div>
                <span className="hidden text-xs text-gray-500 lg:block">{formatDate(user.created_at)}</span>
                <span className="hidden text-xs text-gray-500 lg:block">{formatDate(user.last_sign_in_at)}</span>
                <div className="flex items-center gap-2">
                  <input
                    className="w-24 rounded-xl border border-gray-800 bg-gray-950 px-3 py-2 text-xs outline-none focus:border-cyan-400"
                    type="text"
                    value={resetPasswords[user.id] ?? '1313'}
                    onChange={(event) => setResetPasswords((current) => ({ ...current, [user.id]: event.target.value }))}
                    minLength={4}
                    disabled={protectedAccount}
                  />
                  <button
                    type="button"
                    onClick={() => handleResetPassword(user)}
                    disabled={protectedAccount}
                    className="inline-flex items-center gap-1 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    변경
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteUser(user)}
                  disabled={protectedAccount}
                  title={protectedAccount ? '관리자 계정은 이 화면에서 삭제할 수 없어' : '회원 삭제'}
                  className="inline-flex items-center gap-1 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  삭제
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
