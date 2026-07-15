/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase 4C/S13 fixture-only readiness contract for a future server-owned
 * collector. This file does not implement a route, collector, runtime reader,
 * gateway reader, scheduler reader, or any operational source access.
 */

export type WorkConsoleReadinessGateStatus = 'pending' | 'blocked';

export type WorkConsoleReadinessGateCategory =
  | 'approval'
  | 'source-boundary'
  | 'read-only-proof'
  | 'serialization'
  | 'safe-errors'
  | 'cache-freshness'
  | 'kill-switch'
  | 'observability'
  | 'rollback';

export interface WorkConsoleServerCollectorReadinessGate {
  id: string;
  category: WorkConsoleReadinessGateCategory;
  label: string;
  status: WorkConsoleReadinessGateStatus;
  requiredEvidence: string;
  stopCondition: string;
}

export interface WorkConsoleServerCollectorReadinessContract {
  contractVersion: 'work-console-collector-readiness.v1';
  scope: 'pre-live-local-staging-readiness';
  liveReadEnabled: false;
  routeImplemented: false;
  serverCollectorApproved: false;
  productionLiveApproved: false;
  publicAccess: false;
  sharedCacheAllowed: false;
  rawPayloadAllowed: false;
  requiresSeparateUserApproval: true;
  ownerProfile: 'server';
  browserSourceMode: 'fixture-only';
  allowedSourceKinds: string[];
  forbiddenSourceKinds: string[];
  gates: WorkConsoleServerCollectorReadinessGate[];
}

export const WORK_CONSOLE_SERVER_COLLECTOR_READINESS_FIXTURE: WorkConsoleServerCollectorReadinessContract = {
  contractVersion: 'work-console-collector-readiness.v1',
  scope: 'pre-live-local-staging-readiness',
  liveReadEnabled: false,
  routeImplemented: false,
  serverCollectorApproved: false,
  productionLiveApproved: false,
  publicAccess: false,
  sharedCacheAllowed: false,
  rawPayloadAllowed: false,
  requiresSeparateUserApproval: true,
  ownerProfile: 'server',
  browserSourceMode: 'fixture-only',
  allowedSourceKinds: [
    'dummy-in-memory-observation',
    'sanitized-safe-component-summary',
    'safe-error-bucket',
    'cache-state-bucket',
    'approval-gate-status',
  ],
  forbiddenSourceKinds: [
    'runtime-file-read',
    'scheduler-output-body',
    'gateway-log-read',
    'session-transcript-read',
    'profile-home-path-read',
    'environment-value-read',
    'credential-material-read',
    'database-record-read',
  ],
  gates: [
    {
      id: 'traceable-user-approval',
      category: 'approval',
      label: 'Traceable local or staging spike approval',
      status: 'pending',
      requiredEvidence: 'A user-visible approval message naming local or staging read-only scope.',
      stopCondition: 'Stop if approval scope is missing, ambiguous, or includes production by implication.',
    },
    {
      id: 'server-owned-route-boundary',
      category: 'source-boundary',
      label: 'Server-owned route boundary design',
      status: 'pending',
      requiredEvidence: 'A server-owned route contract with admin-only access and no client-side source selection.',
      stopCondition: 'Stop if a browser flag can enable source reads without a server-side gate.',
    },
    {
      id: 'readonly-permission-proof',
      category: 'read-only-proof',
      label: 'Read-only permission proof',
      status: 'pending',
      requiredEvidence: 'Evidence that the spike can observe only approved sources and cannot write, run, delete, or restart.',
      stopCondition: 'Stop if the source requires write permission, command execution, restart, or credential changes.',
    },
    {
      id: 'allowlist-serializer-proof',
      category: 'serialization',
      label: 'Allowlist serializer proof',
      status: 'pending',
      requiredEvidence: 'A test showing unknown fields and raw-like details are dropped before browser delivery.',
      stopCondition: 'Stop if raw payload fields are needed for the UI to render.',
    },
    {
      id: 'safe-error-proof',
      category: 'safe-errors',
      label: 'Safe error proof',
      status: 'pending',
      requiredEvidence: 'A test showing thrown details become stable safe codes and short messages only.',
      stopCondition: 'Stop if stack, cause, command output, path, or private identifier text is exposed.',
    },
    {
      id: 'nostore-freshness-proof',
      category: 'cache-freshness',
      label: 'No-store freshness proof',
      status: 'pending',
      requiredEvidence: 'A test covering fresh, stale, fallback, disabled, and unavailable safe states.',
      stopCondition: 'Stop if shared cache, CDN cache, or unlabeled stale fallback is required.',
    },
    {
      id: 'server-kill-switch-proof',
      category: 'kill-switch',
      label: 'Server-side kill switch proof',
      status: 'pending',
      requiredEvidence: 'A test showing the server can force a disabled snapshot regardless of client input.',
      stopCondition: 'Stop if disabling depends only on frontend code or browser state.',
    },
    {
      id: 'safe-observability-proof',
      category: 'observability',
      label: 'Safe observability proof',
      status: 'pending',
      requiredEvidence: 'A log and analytics plan with only aggregate buckets and opaque refs.',
      stopCondition: 'Stop if raw records, delivery targets, prompts, paths, or private identifiers are logged.',
    },
    {
      id: 'rollback-disable-plan',
      category: 'rollback',
      label: 'Rollback and disable plan',
      status: 'pending',
      requiredEvidence: 'A documented disable path returning fixture-only or disabled safe snapshots.',
      stopCondition: 'Stop if rollback requires data deletion, server restart, credential rotation, or production setting changes.',
    },
    {
      id: 'production-connection-approval',
      category: 'approval',
      label: 'Production connection approval',
      status: 'blocked',
      requiredEvidence: 'A separate future approval for production live operational data connection.',
      stopCondition: 'Always blocked in this pre-live contract.',
    },
  ],
};
