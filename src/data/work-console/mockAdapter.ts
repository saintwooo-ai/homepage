/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  WorkConsoleDataAdapter,
  WorkConsoleServerSnapshotPolicyEnvelope,
  WorkConsoleSnapshot,
  WorkConsoleSourceStatus,
} from '../../types/workConsole';
import {
  AGENT_FLOW_TIMELINE,
  INITIAL_PROFILE_WORK_STATES,
  INITIAL_WORK_EVENTS,
  INITIAL_WORK_ITEMS,
  WORK_CONSOLE_SUMMARY,
} from './mockFixture';

export const MOCK_SERVER_SNAPSHOT_ENVELOPE: WorkConsoleServerSnapshotPolicyEnvelope = {
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
      safeMessage: 'Dummy serializer envelope is connected to the UI fixture path only. No runtime source is connected.',
      lastUpdatedAt: '2026-07-15T00:00:00.000Z',
      countBucket: '0',
      issueCode: 'COLLECTOR_DISABLED',
    },
    {
      componentRef: 'demo-component-b',
      kind: 'gateway',
      status: 'disabled',
      safeMessage: 'Gateway status remains intentionally uncollected until server handoff and approval gates pass.',
      lastUpdatedAt: undefined,
      countBucket: '0',
      issueCode: 'SOURCE_NOT_CONNECTED',
    },
    {
      componentRef: 'demo-component-c',
      kind: 'scheduler',
      status: 'disabled',
      safeMessage: 'Scheduler and scheduled job state are not read by the browser fixture.',
      lastUpdatedAt: undefined,
      countBucket: '0',
      issueCode: 'SOURCE_NOT_CONNECTED',
    },
  ],
  errors: [
    {
      code: 'WORK_CONSOLE_COLLECTOR_DISABLED',
      safeMessage: 'Server collector route is not implemented or approved in this phase.',
      retryable: false,
      severity: 'info',
      opaqueCorrelationRef: 'demo-correlation-a',
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
      id: 'production-connection-approval',
      label: 'Production connection approval',
      status: 'blocked',
      requiredForPhase: '3G-production-enable',
      note: 'Production live connection is blocked until a separate approval.',
    },
  ],
};

export const MOCK_WORK_CONSOLE_SOURCE_STATUS: WorkConsoleSourceStatus = {
  kind: 'mock-fixture',
  connectionState: 'fixture_ready',
  readOnly: true,
  liveDisabled: true,
  label: 'Fixture mode · Live read disabled',
  message: 'Phase 3C-4 safe contract: fixture/default snapshot만 표시합니다. Server handoff required 상태이며 production live connection not approved입니다.',
  safetyNotes: [
    'Fixture mode',
    'Live read disabled',
    'Server handoff required',
    'Production live connection not approved',
    'read-only sanitized snapshot props only',
    'no Hermes DB/API/websocket/gateway call',
  ],
  liveConnection: {
    fixtureMode: true,
    liveReadDisabled: true,
    serverHandoffRequired: true,
    productionLiveApproved: false,
    currentPhase: '3C-4-safe-contract',
    nextPhase: '3D-server-handoff-design',
    statusMessage: 'Fixture mode is the only enabled frontend path; production live connection is not approved.',
  },
  serverHandoff: {
    required: true,
    status: 'required',
    owner: 'server',
    note: 'Future live data must arrive as a server/runtime sanitized snapshot after server handoff design and approval gates.',
  },
  approvalGates: [
    {
      id: 'server-runtime-sanitized-snapshot',
      label: 'Server/runtime sanitized snapshot design',
      status: 'pending',
      requiredForPhase: '3D-server-handoff-design',
      note: 'Frontend direct VPS filesystem reads remain forbidden.',
    },
    {
      id: 'local-staging-readonly-spike',
      label: 'Local/staging read-only spike approval',
      status: 'blocked',
      requiredForPhase: '3E-local-staging-spike',
      note: 'No live reader is implemented in Phase 3C-4.',
    },
    {
      id: 'production-live-approval',
      label: 'Production live connection approval',
      status: 'blocked',
      requiredForPhase: '3G-production-enable',
      note: 'Production live connection not approved.',
    },
  ],
  checkedAt: WORK_CONSOLE_SUMMARY.generatedAt,
  serverSnapshotEnvelope: MOCK_SERVER_SNAPSHOT_ENVELOPE,
};

export const MOCK_WORK_CONSOLE_SNAPSHOT: WorkConsoleSnapshot = {
  summary: WORK_CONSOLE_SUMMARY,
  sourceStatus: MOCK_WORK_CONSOLE_SOURCE_STATUS,
  workItems: INITIAL_WORK_ITEMS,
  profileStates: INITIAL_PROFILE_WORK_STATES,
  events: INITIAL_WORK_EVENTS,
  agentFlow: AGENT_FLOW_TIMELINE,
};

export const mockWorkConsoleAdapter: WorkConsoleDataAdapter = {
  id: 'mock-work-console-adapter',
  label: 'Mock Work Console Adapter',
  getSnapshot: () => MOCK_WORK_CONSOLE_SNAPSHOT,
};

export const getWorkConsoleSnapshot = (
  adapter: WorkConsoleDataAdapter = mockWorkConsoleAdapter,
): WorkConsoleSnapshot => adapter.getSnapshot();
