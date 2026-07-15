import { useEffect, useMemo, useState } from 'react';

export type LiveWorkStatusLevel = 'info' | 'success' | 'warning' | 'error';

export interface LiveWorkStatusEvent {
  id: string;
  timestamp: string;
  profile: string;
  level: LiveWorkStatusLevel;
  message: string;
}

export interface LiveWorkStatusPayload {
  schemaVersion: 'live-work-status.v0';
  mode: 'safe-public-status';
  source: string;
  status: 'active' | 'idle' | 'blocked' | 'offline';
  mission: string;
  activeProfile: string;
  supportingProfiles: string[];
  phase: string;
  progress: number;
  updatedAt: string;
  staleAfterSeconds: number;
  safeSummary: string;
  currentAction: string;
  nextAction: string;
  safety: {
    readOnly: true;
    publicSafeOnly: true;
    rawLogsIncluded: false;
    privateIdsRedacted: boolean;
    tokensRemoved: boolean;
    hermesRuntimeRead: false;
    gatewayRead: false;
    cronRead: false;
    sessionDbRead: false;
    envRead: false;
  };
  events: LiveWorkStatusEvent[];
}

export type LiveWorkStatusConnection = 'loading' | 'connected' | 'stale' | 'error';

export interface LiveWorkStatusViewState {
  payload: LiveWorkStatusPayload | null;
  connection: LiveWorkStatusConnection;
  fetchedAt: string | null;
  sourceUrl: string;
  errorMessage?: string;
}

const GITHUB_STATUS_API_URL =
  'https://api.github.com/repos/saintwooo-ai/homepage/contents/public/work-status.json?ref=main';
const LOCAL_STATUS_URL = '/work-status.json';
const POLL_INTERVAL_MS = 5000;
const REQUEST_TIMEOUT_MS = 6000;

const secretLikePatterns = [
  /sk-[A-Za-z0-9_-]{16,}/,
  /ghp_[A-Za-z0-9_]{16,}/,
  /github_pat_[A-Za-z0-9_]{16,}/,
  /xox[baprs]-[A-Za-z0-9-]{16,}/,
  /-----BEGIN (?:RSA |OPENSSH |EC |DSA |)?PRIVATE KEY-----/,
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  /\/opt\/data\/profiles\//,
  /\/\.hermes\//,
  /\/cron\//,
];

const safeJsonStringify = (value: unknown) => JSON.stringify(value ?? '');

export const isLiveWorkStatusPayload = (value: unknown): value is LiveWorkStatusPayload => {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<LiveWorkStatusPayload>;
  const safety = payload.safety;
  return (
    payload.schemaVersion === 'live-work-status.v0' &&
    payload.mode === 'safe-public-status' &&
    typeof payload.source === 'string' &&
    ['active', 'idle', 'blocked', 'offline'].includes(String(payload.status)) &&
    typeof payload.mission === 'string' &&
    typeof payload.activeProfile === 'string' &&
    Array.isArray(payload.supportingProfiles) &&
    typeof payload.phase === 'string' &&
    typeof payload.progress === 'number' &&
    payload.progress >= 0 &&
    payload.progress <= 100 &&
    typeof payload.updatedAt === 'string' &&
    typeof payload.staleAfterSeconds === 'number' &&
    payload.staleAfterSeconds >= 30 &&
    typeof payload.safeSummary === 'string' &&
    typeof payload.currentAction === 'string' &&
    typeof payload.nextAction === 'string' &&
    Array.isArray(payload.events) &&
    !!safety &&
    safety.readOnly === true &&
    safety.publicSafeOnly === true &&
    safety.rawLogsIncluded === false &&
    safety.hermesRuntimeRead === false &&
    safety.gatewayRead === false &&
    safety.cronRead === false &&
    safety.sessionDbRead === false &&
    safety.envRead === false &&
    !secretLikePatterns.some(pattern => pattern.test(safeJsonStringify(payload)))
  );
};

const decodeBase64Utf8 = (content: string) => {
  const binary = atob(content.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const fetchWithTimeout = async (url: string) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  } finally {
    window.clearTimeout(timer);
  }
};

export const loadLiveWorkStatus = async (): Promise<{ payload: LiveWorkStatusPayload; sourceUrl: string }> => {
  try {
    const response = await fetchWithTimeout(GITHUB_STATUS_API_URL);
    const body = await response.json() as { content?: string; encoding?: string };
    if (body.encoding !== 'base64' || !body.content) throw new Error('Unexpected GitHub content response');
    const parsed = JSON.parse(decodeBase64Utf8(body.content)) as unknown;
    if (!isLiveWorkStatusPayload(parsed)) throw new Error('Invalid safe status payload');
    return { payload: parsed, sourceUrl: 'github:saintwooo-ai/homepage/public/work-status.json@main' };
  } catch (githubError) {
    const response = await fetchWithTimeout(LOCAL_STATUS_URL);
    const parsed = await response.json() as unknown;
    if (!isLiveWorkStatusPayload(parsed)) throw new Error(`Invalid fallback status payload after GitHub failure: ${String(githubError)}`);
    return { payload: parsed, sourceUrl: LOCAL_STATUS_URL };
  }
};

export const getLiveWorkStatusConnection = (payload: LiveWorkStatusPayload | null): LiveWorkStatusConnection => {
  if (!payload) return 'loading';
  const updatedAt = new Date(payload.updatedAt).getTime();
  if (Number.isNaN(updatedAt)) return 'stale';
  return Date.now() - updatedAt > payload.staleAfterSeconds * 1000 ? 'stale' : 'connected';
};

export const useLiveWorkStatus = (): LiveWorkStatusViewState => {
  const [payload, setPayload] = useState<LiveWorkStatusPayload | null>(null);
  const [connection, setConnection] = useState<LiveWorkStatusConnection>('loading');
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string>('pending');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const result = await loadLiveWorkStatus();
        if (!active) return;
        const nextConnection = getLiveWorkStatusConnection(result.payload);
        setPayload(result.payload);
        setConnection(nextConnection);
        setFetchedAt(new Date().toISOString());
        setSourceUrl(result.sourceUrl);
        setErrorMessage(undefined);
      } catch (error) {
        if (!active) return;
        setConnection('error');
        setFetchedAt(new Date().toISOString());
        setErrorMessage(error instanceof Error ? error.message : String(error));
      }
    };

    void refresh();
    const intervalId = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return useMemo(
    () => ({ payload, connection, fetchedAt, sourceUrl, errorMessage }),
    [payload, connection, fetchedAt, sourceUrl, errorMessage],
  );
};
