import { createClient } from '@supabase/supabase-js';

const INTERNAL_AUTH_DOMAIN = process.env.INTERNAL_AUTH_DOMAIN || process.env.VITE_INTERNAL_AUTH_DOMAIN || 'ugnas.internal';

function normalizeUsername(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
}

function usernameToEmail(username) {
  return `${normalizeUsername(username)}@${INTERNAL_AUTH_DOMAIN}`;
}

function emailToUsername(email) {
  const value = String(email ?? '').toLowerCase();
  const suffix = `@${INTERNAL_AUTH_DOMAIN.toLowerCase()}`;
  return value.endsWith(suffix) ? value.slice(0, -suffix.length) : value;
}

function json(res, status, body) {
  res.status(status).json(body);
}

function getAdminUsernames() {
  return (process.env.ADMIN_USERNAMES ?? '')
    .split(',')
    .map(normalizeUsername)
    .filter(Boolean);
}

function publicUser(user) {
  return {
    id: user.id,
    username: normalizeUsername(user.user_metadata?.username || emailToUsername(user.email)),
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
    email_confirmed_at: user.email_confirmed_at,
  };
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  return {};
}

export default async function handler(req, res) {
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return json(res, 405, { error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminUsernames = getAdminUsernames();

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || adminUsernames.length === 0) {
    return json(res, 500, { error: 'Admin API server env is not configured.' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
  if (!token) {
    return json(res, 401, { error: 'Missing bearer token.' });
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: authData, error: authError } = await userClient.auth.getUser(token);
  const requesterUsername = normalizeUsername(authData.user?.user_metadata?.username || emailToUsername(authData.user?.email));
  if (authError || !requesterUsername) {
    return json(res, 401, { error: 'Invalid session.' });
  }

  if (!adminUsernames.includes(requesterUsername)) {
    return json(res, 403, { error: 'Admin only.' });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (req.method === 'GET') {
    const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) return json(res, 500, { error: error.message });
    return json(res, 200, { users: (data.users ?? []).map(publicUser) });
  }

  if (req.method === 'POST') {
    const body = await readBody(req);
    const username = normalizeUsername(body.username);
    const password = String(body.password ?? '');

    if (!username || username.includes('@') || password.length < 4) {
      return json(res, 400, { error: '아이디와 4자 이상 비밀번호가 필요해.' });
    }

    const { data, error } = await adminClient.auth.admin.createUser({
      email: usernameToEmail(username),
      password,
      email_confirm: true,
      user_metadata: { username },
    });
    if (error) return json(res, 400, { error: error.message });
    return json(res, 201, { user: publicUser(data.user) });
  }

  if (req.method === 'PATCH') {
    const body = await readBody(req);
    const id = String(body.id ?? '').trim();
    const password = String(body.password ?? '');
    if (!id || password.length < 4) {
      return json(res, 400, { error: '회원 id와 4자 이상 새 비밀번호가 필요해.' });
    }

    const { data, error } = await adminClient.auth.admin.updateUserById(id, { password });
    if (error) return json(res, 400, { error: error.message });
    return json(res, 200, { user: publicUser(data.user) });
  }

  const body = await readBody(req);
  const id = String(body.id ?? req.query.id ?? '').trim();
  if (!id) {
    return json(res, 400, { error: 'User id is required.' });
  }

  if (id === authData.user.id) {
    return json(res, 400, { error: '현재 로그인한 관리자 계정은 삭제할 수 없어.' });
  }

  const { data: targetData, error: targetError } = await adminClient.auth.admin.getUserById(id);
  if (targetError || !targetData.user) {
    return json(res, 404, { error: targetError?.message ?? 'User not found.' });
  }

  const targetUsername = normalizeUsername(targetData.user.user_metadata?.username || emailToUsername(targetData.user.email));
  if (adminUsernames.includes(targetUsername)) {
    return json(res, 400, { error: '관리자 계정은 이 화면에서 삭제할 수 없어.' });
  }

  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) return json(res, 400, { error: error.message });
  return json(res, 200, { ok: true });
}
