/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase 4B design-only server snapshot policy fixture.
 * This fixture is dummy-only. It does not read runtime files, environment,
 * network resources, gateway state, scheduler state, or server processes.
 */

import type { WorkConsoleServerSnapshotPolicyEnvelope } from '../../types/workConsole';

export const WORK_CONSOLE_PHASE4B_SERVER_SNAPSHOT_POLICY_FIXTURE: WorkConsoleServerSnapshotPolicyEnvelope = {
  apiVersion: 'work-console-snapshot.v1',
  audience: 'admin-internal',
  collectorState: 'disabled',
  sourceMode: 'server-snapshot-disabled',
  cacheState: 'disabled',
  generatedAt: '2026-07-15T00:00:00.000Z',
  staleAfter: '2026-07-15T00:02:00.000Z',
  expiresAt: '2026-07-15T00:10:00.000Z',
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
    maxFreshAgeSeconds: 120,
    maxStaleFallbackSeconds: 600,
    allowStaleFallback: true,
    allowSharedCache: false,
  },
  killSwitch: {
    state: 'forced_disabled',
    serverSideRequired: true,
    clientFallbackOnly: true,
    safeMessage: 'Collector remains disabled until a separate local or staging approval is granted.',
  },
  safeComponents: [
    {
      componentRef: 'demo-component-a',
      kind: 'system-check',
      status: 'disabled',
      safeMessage: 'Phase 4B design fixture only. No runtime source is connected.',
      countBucket: '0',
      issueCode: 'COLLECTOR_DISABLED',
    },
    {
      componentRef: 'demo-component-b',
      kind: 'gateway',
      status: 'unknown',
      safeMessage: 'Gateway state is intentionally not collected in this phase.',
      countBucket: '0',
      issueCode: 'SOURCE_NOT_CONNECTED',
    },
  ],
  errors: [
    {
      code: 'WORK_CONSOLE_COLLECTOR_DISABLED',
      safeMessage: 'Server collector is not implemented or approved in this phase.',
      retryable: false,
      severity: 'info',
      opaqueCorrelationRef: 'demo-correlation-b',
    },
  ],
  approvalGates: [
    {
      id: 'local-staging-spike-approval',
      label: 'Local or staging spike approval',
      status: 'pending',
      requiredForPhase: '3E-local-staging-spike',
      note: 'Required before any runtime source is connected.',
    },
    {
      id: 'server-readonly-permission-review',
      label: 'Server read-only permission review',
      status: 'pending',
      requiredForPhase: '3E-local-staging-spike',
      note: 'Required before any collector implementation touches runtime sources.',
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
