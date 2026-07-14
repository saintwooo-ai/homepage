/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase 2 safety boundary:
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
    phase2Notice: 'Phase 2에서는 실제 Hermes session DB/API/websocket/gateway 연결을 하지 않습니다. 승인된 Phase 3 전까지 빈 read-only snapshot만 반환합니다.',
  },
  sourceStatus: {
    kind: 'hermes-live-disabled',
    connectionState: 'not_configured',
    readOnly: true,
    liveDisabled: true,
    label: 'Live Hermes disabled',
    message: '실제 Hermes 연결은 설정되지 않았고 Phase 2 안전 경계에 의해 비활성화되어 있습니다.',
    safetyNotes: [
      'read-only',
      'live disabled',
      'no Hermes DB/API/websocket/gateway call',
      'no env/secret/session import',
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
