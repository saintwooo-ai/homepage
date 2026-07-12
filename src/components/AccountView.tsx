import React, { FormEvent, useState } from 'react';
import { KeyRound, UserRound } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { usernameToEmail } from '../auth/identity';
import { supabase } from '../lib/supabase';

export default function AccountView() {
  const { username } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || isSaving) return;

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '새 비밀번호 확인이 맞지 않아.' });
      return;
    }

    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: '새 비밀번호는 최소 4자 이상으로 입력해줘.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const email = usernameToEmail(username);
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (verifyError) {
      setIsSaving(false);
      setMessage({ type: 'error', text: '현재 비밀번호가 맞지 않아.' });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsSaving(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage({ type: 'success', text: '비밀번호를 변경했어. 다음 로그인부터 새 비밀번호를 사용하면 돼.' });
  }

  return (
    <section className="max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-mono tracking-[0.3em] text-cyan-400">MY ACCOUNT</p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-extrabold tracking-tight">
          <UserRound className="h-7 w-7 text-cyan-400" />
          내 계정
        </h1>
        <p className="mt-2 text-sm text-gray-400">아이디와 비밀번호를 관리해.</p>
      </div>

      <div className="rounded-3xl border border-gray-800 bg-gray-900/50 p-6">
        <div className="mb-5 rounded-2xl border border-gray-800 bg-gray-950/60 px-4 py-3">
          <span className="text-xs font-semibold text-gray-500">현재 아이디</span>
          <p className="mt-1 text-lg font-bold text-gray-100">{username}</p>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-xs font-semibold text-gray-400">현재 비밀번호</span>
            <input
              className="w-full rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm outline-none focus:border-cyan-400"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs font-semibold text-gray-400">새 비밀번호</span>
            <input
              className="w-full rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm outline-none focus:border-cyan-400"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={4}
              required
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs font-semibold text-gray-400">새 비밀번호 확인</span>
            <input
              className="w-full rounded-2xl border border-gray-800 bg-gray-950 px-4 py-3 text-sm outline-none focus:border-cyan-400"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={4}
              required
            />
          </label>

          {message && (
            <div className={`rounded-2xl border px-4 py-3 text-sm ${
              message.type === 'error'
                ? 'border-red-500/30 bg-red-500/10 text-red-200'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-extrabold text-gray-950 hover:bg-cyan-300 disabled:opacity-60"
          >
            <KeyRound className="h-4 w-4" />
            {isSaving ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </section>
  );
}
