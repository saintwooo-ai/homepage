/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase 4B local/dummy serializer spike.
 * This module is pure: it only transforms caller-provided dummy observations
 * into the browser-facing allowlisted snapshot envelope.
 */

import type {
  WorkConsoleCollectorState,
  WorkConsoleSafeApiError,
  WorkConsoleSafeComponentKind,
  WorkConsoleSafeComponentSummary,
  WorkConsoleServerSnapshotCacheState,
  WorkConsoleServerSnapshotPolicyEnvelope,
  WorkConsoleServerSnapshotSourceMode,
  WorkConsoleSnapshotKillSwitchPolicy,
} from '../../types/workConsole';

export type WorkConsoleDummyObservationState =
  | 'ok'
  | 'disabled'
  | 'degraded'
  | 'stale'
  | 'fallback'
  | 'unavailable'
  | 'error';

export interface WorkConsoleDummyComponentObservation {
  kind: WorkConsoleSafeComponentKind;
  state: WorkConsoleDummyObservationState;
  message?: string;
  count?: number;
  observedAt?: string;
  issueCode?: string;
}

export interface WorkConsoleDummyErrorObservation {
  code?: string;
  message?: string;
  retryable?: boolean;
  severity?: 'info' | 'warning' | 'error';
}

export interface WorkConsoleDummySerializerInput {
  generatedAt: string;
  observations: WorkConsoleDummyComponentObservation[];
  errors?: WorkConsoleDummyErrorObservation[];
  killSwitch?: Partial<WorkConsoleSnapshotKillSwitchPolicy>;
}

const API_VERSION = 'work-console-snapshot.v1';
const MAX_SAFE_MESSAGE_LENGTH = 140;
const DEFAULT_FRESH_AGE_SECONDS = 120;
const DEFAULT_STALE_FALLBACK_SECONDS = 600;
const COMPONENT_REF_PREFIX = 'demo-component';
const FALLBACK_TIMESTAMP = '2026-07-15T00:00:00.000Z';

const SAFE_ISSUE_CODE_BUCKETS = new Set([
  'DUMMY_OBSERVATION',
  'COLLECTOR_DISABLED',
  'SOURCE_NOT_CONNECTED',
  'SOURCE_UNAVAILABLE',
  'SOURCE_DEGRADED',
  'SOURCE_STALE',
  'SOURCE_FALLBACK',
]);

const SAFE_ERROR_CODE_BUCKETS = new Set([
  'WORK_CONSOLE_SAFE_ERROR',
  'WORK_CONSOLE_COLLECTOR_DISABLED',
  'WORK_CONSOLE_SOURCE_UNAVAILABLE',
  'WORK_CONSOLE_SOURCE_DEGRADED',
]);

const containsUnsafeFragment = (value: string): boolean => (
  /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/.test(value)
  || /BEGIN\s+(?:RSA\s+|OPENSSH\s+|EC\s+)?PRIVATE\s+KEY/i.test(value)
  || /\b(?:api[_-]?key|secret|password|access[_-]?token|refresh[_-]?token)\b/i.test(value)
  || /(?<!\d)\d{17,20}(?!\d)/.test(value)
  || /\b[A-Za-z]:\\[^\s]+|(?:^|\s)(?:[A-Za-z0-9._ -]+\/){2,}[A-Za-z0-9._ -]+|\/(?:[A-Za-z0-9._ -]+\/){2,}[A-Za-z0-9._ -]+/.test(value)
  || /\braw\s+(?:detail|log|output|cause|record|payload)\b/i.test(value)
);

const normalizeTimestamp = (value: string | undefined, fallback?: string): string | undefined => {
  if (!value) return fallback;
  if (containsUnsafeFragment(value)) return fallback;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return fallback;
  return new Date(parsed).toISOString();
};

const addSeconds = (isoTimestamp: string, seconds: number): string => {
  const parsed = Date.parse(normalizeTimestamp(isoTimestamp, FALLBACK_TIMESTAMP) ?? FALLBACK_TIMESTAMP);
  const base = Number.isFinite(parsed) ? parsed : Date.parse(FALLBACK_TIMESTAMP);
  return new Date(base + seconds * 1000).toISOString();
};

const sanitizeSafeMessage = (value: string | undefined, fallback: string): string => {
  const oneLine = (value || fallback)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const redacted = oneLine
    .replace(/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, '[redacted]')
    .replace(/BEGIN\s+(?:RSA\s+|OPENSSH\s+|EC\s+)?PRIVATE\s+KEY[\s\S]*?END\s+(?:RSA\s+|OPENSSH\s+|EC\s+)?PRIVATE\s+KEY/g, '[redacted]')
    .replace(/\b(?:api[_-]?key|secret|password|access[_-]?token|refresh[_-]?token)\s*[:=]\s*\S+/gi, '[redacted]')
    .replace(/(?<!\d)\d{17,20}(?!\d)/g, '[redacted-id]')
    .replace(/\b[A-Za-z]:\\[^\s]+|(?:^|\s)(?:[A-Za-z0-9._ -]+\/){2,}[A-Za-z0-9._ -]+|\/(?:[A-Za-z0-9._ -]+\/){2,}[A-Za-z0-9._ -]+/g, ' [redacted-path]')
    .replace(/\braw\s+(?:detail|log|output|cause|record|payload)\b/gi, 'safe summary');

  return redacted.replace(/\s+/g, ' ').trim().slice(0, MAX_SAFE_MESSAGE_LENGTH) || fallback;
};

const normalizeBucketCode = (value: string | undefined, fallback: string, allowedBuckets: Set<string>): string => {
  if (!value || containsUnsafeFragment(value)) return fallback;
  const normalized = (value || fallback)
    .replace(/[^A-Za-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
  if (!normalized || containsUnsafeFragment(normalized)) return fallback;
  return allowedBuckets.has(normalized) ? normalized : fallback;
};

const toCountBucket = (count: number | undefined): '0' | '1-5' | '5+' => {
  if (!count || count <= 0) return '0';
  if (count <= 5) return '1-5';
  return '5+';
};

const toAlphabeticRefSuffix = (index: number): string => {
  let current = Math.max(0, index);
  let suffix = '';
  do {
    suffix = `${String.fromCharCode(97 + (current % 26))}${suffix}`;
    current = Math.floor(current / 26) - 1;
  } while (current >= 0);
  return suffix;
};

const toComponentStatus = (
  state: WorkConsoleDummyObservationState,
): WorkConsoleSafeComponentSummary['status'] => {
  if (state === 'disabled') return 'disabled';
  if (state === 'stale') return 'stale';
  if (state === 'fallback') return 'fallback';
  if (state === 'degraded' || state === 'error') return 'degraded';
  return 'unknown';
};

const toCollectorState = (
  observations: WorkConsoleDummyComponentObservation[],
  killSwitchState: WorkConsoleSnapshotKillSwitchPolicy['state'],
): WorkConsoleCollectorState => {
  if (killSwitchState === 'forced_disabled' || killSwitchState === 'disabled') return 'disabled';
  if (observations.some((observation) => observation.state === 'unavailable')) return 'unavailable';
  if (observations.some((observation) => observation.state === 'degraded' || observation.state === 'error')) return 'degraded';
  return 'not_approved';
};

const toSourceMode = (
  observations: WorkConsoleDummyComponentObservation[],
  collectorState: WorkConsoleCollectorState,
): WorkConsoleServerSnapshotSourceMode => {
  if (collectorState === 'disabled' || collectorState === 'not_approved') return 'server-snapshot-disabled';
  if (observations.some((observation) => observation.state === 'fallback')) return 'server-snapshot-fallback';
  if (observations.some((observation) => observation.state === 'stale')) return 'server-snapshot-stale';
  return 'server-snapshot-disabled';
};

const toCacheState = (
  observations: WorkConsoleDummyComponentObservation[],
  collectorState: WorkConsoleCollectorState,
): WorkConsoleServerSnapshotCacheState => {
  if (collectorState === 'disabled' || collectorState === 'not_approved') return 'disabled';
  if (collectorState === 'unavailable') return 'unavailable';
  if (observations.some((observation) => observation.state === 'fallback')) return 'fallback';
  if (observations.some((observation) => observation.state === 'stale')) return 'stale';
  return 'disabled';
};

const buildSafeComponents = (
  observations: WorkConsoleDummyComponentObservation[],
): WorkConsoleSafeComponentSummary[] => {
  const source = observations.length > 0
    ? observations
    : [{ kind: 'system-check' as const, state: 'disabled' as const, message: 'No dummy observations were provided.' }];

  return source.map((observation, index) => ({
    componentRef: `${COMPONENT_REF_PREFIX}-${toAlphabeticRefSuffix(index)}`,
    kind: observation.kind,
    status: toComponentStatus(observation.state),
    safeMessage: sanitizeSafeMessage(
      observation.message,
      'Dummy component state was summarized without raw runtime details.',
    ),
    lastUpdatedAt: normalizeTimestamp(observation.observedAt),
    countBucket: toCountBucket(observation.count),
    issueCode: normalizeBucketCode(observation.issueCode, 'DUMMY_OBSERVATION', SAFE_ISSUE_CODE_BUCKETS),
  }));
};

const buildSafeErrors = (errors: WorkConsoleDummyErrorObservation[] | undefined): WorkConsoleSafeApiError[] => {
  const source = errors && errors.length > 0
    ? errors
    : [{ code: 'WORK_CONSOLE_COLLECTOR_DISABLED', message: 'Server collector is not implemented or approved in this phase.', retryable: false, severity: 'info' as const }];

  return source.map((error) => ({
    code: normalizeBucketCode(error.code, 'WORK_CONSOLE_SAFE_ERROR', SAFE_ERROR_CODE_BUCKETS),
    safeMessage: sanitizeSafeMessage(error.message, 'A safe Work Console status was generated.'),
    retryable: Boolean(error.retryable),
    severity: error.severity ?? 'warning',
    opaqueCorrelationRef: 'demo-correlation-a',
  }));
};

export const serializeDummyServerSnapshot = (
  input: WorkConsoleDummySerializerInput,
): WorkConsoleServerSnapshotPolicyEnvelope => {
  const generatedAt = normalizeTimestamp(input.generatedAt, FALLBACK_TIMESTAMP) ?? FALLBACK_TIMESTAMP;
  const killSwitch: WorkConsoleSnapshotKillSwitchPolicy = {
    state: input.killSwitch?.state ?? 'forced_disabled',
    serverSideRequired: true,
    clientFallbackOnly: true,
    safeMessage: sanitizeSafeMessage(
      input.killSwitch?.safeMessage,
      'Collector remains disabled until a separate local or staging approval is granted.',
    ),
  };
  const collectorState = toCollectorState(input.observations, killSwitch.state);

  return {
    apiVersion: API_VERSION,
    audience: 'admin-internal',
    collectorState,
    sourceMode: toSourceMode(input.observations, collectorState),
    cacheState: toCacheState(input.observations, collectorState),
    generatedAt,
    staleAfter: addSeconds(generatedAt, DEFAULT_FRESH_AGE_SECONDS),
    expiresAt: addSeconds(generatedAt, DEFAULT_STALE_FALLBACK_SECONDS),
    readOnly: true,
    liveReadEnabled: false,
    productionLiveApproved: false,
    serverCollectorApproved: false,
    privateIdsRedacted: true,
    rawLogsIncluded: false,
    rawRuntimeOutputIncluded: false,
    endpointPolicy: {
      routeImplemented: false,
      adminOnly: true,
      publicAccess: false,
      cacheHeader: 'no-store',
      authBoundary: 'admin-session-or-internal-relay',
    },
    freshnessPolicy: {
      maxFreshAgeSeconds: DEFAULT_FRESH_AGE_SECONDS,
      maxStaleFallbackSeconds: DEFAULT_STALE_FALLBACK_SECONDS,
      allowStaleFallback: true,
      allowSharedCache: false,
    },
    killSwitch,
    safeComponents: buildSafeComponents(input.observations),
    errors: buildSafeErrors(input.errors),
    approvalGates: [
      {
        id: 'local-staging-spike-approval',
        label: 'Local or staging spike approval',
        status: 'pending',
        requiredForPhase: '3E-local-staging-spike',
        note: 'Required before any runtime source is connected.',
      },
      {
        id: 'production-connection-approval',
        label: 'Production connection approval',
        status: 'blocked',
        requiredForPhase: '3G-production-enable',
        note: 'Production live connection is blocked until a separate approval.',
      },
    ],
  };
};
