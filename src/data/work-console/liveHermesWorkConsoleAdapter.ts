/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase 3C-4 safety boundary:
 * This adapter intentionally does not import env, database, fetch, websocket,
 * gateway, filesystem, or Hermes session modules. It only returns an empty
 * disabled snapshot so the UI can be wired to adapter-shaped data safely.
 */

import type { WorkConsoleDataAdapter, WorkConsoleSnapshot } from '../../types/workConsole';

const STATUS_LABELS = {
  queued: '대기',
  running: '진행중',
  needs_approval: '승인필요',
  blocked: '막힘',
  in_review: '검토중',
  completed: '완료',
} as const;

export const LIVE_HERMES_DISABLED_SNAPSHOT: WorkConsoleSnapshot = {
  summary: {
    mode: 'live-disabled',
    generatedAt: '2026-07-14T00:00:00.000Z',
    sourceLabel: 'Hermes live adapter disabled / not configured',
    statusLabels: STATUS_LABELS,
    phase2Notice: 'Phase 3C-4에서는 실제 Hermes session DB/API/websocket/gateway 연결을 하지 않습니다. server handoff와 production approval 전까지 빈 read-only snapshot만 반환합니다.',
  },
  sourceStatus: {
    kind: 'hermes-live-disabled',
    connectionState: 'not_configured',
    readOnly: true,
    liveDisabled: true,
    label: 'Live Hermes disabled · Production not approved',
    message: '실제 Hermes 연결은 설정되지 않았고 Phase 3C-4 안전 경계에 의해 비활성화되어 있습니다. Server handoff required 및 production live connection not approved 상태입니다.',
    safetyNotes: [
      'Fixture fallback only',
      'Live read disabled',
      'Server handoff required',
      'Production live connection not approved',
      'no Hermes DB/API/websocket/gateway call',
      'no env/secret/session import',
    ],
    liveConnection: {
      fixtureMode: false,
      liveReadDisabled: true,
      serverHandoffRequired: true,
      productionLiveApproved: false,
      currentPhase: '3C-4-safe-contract',
      nextPhase: '3D-server-handoff-design',
      statusMessage: 'Live source is disabled; production live connection is not approved.',
    },
    serverHandoff: {
      required: true,
      status: 'required',
      owner: 'server',
      note: 'A future live path must be provided by server/runtime as a sanitized snapshot, not by frontend filesystem access.',
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
    checkedAt: '2026-07-14T00:00:00.000Z',
  },
  workItems: [],
  profileStates: [],
  events: [],
  agentFlow: [],
};

export const liveHermesWorkConsoleAdapter: WorkConsoleDataAdapter = {
  id: 'live-hermes-work-console-disabled-adapter',
  label: 'Live Hermes Work Console Adapter (disabled)',
  getSnapshot: () => LIVE_HERMES_DISABLED_SNAPSHOT,
};
