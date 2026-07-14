/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { WorkConsoleDataAdapter, WorkConsoleSnapshot, WorkConsoleSourceStatus } from '../../types/workConsole';
import {
  AGENT_FLOW_TIMELINE,
  INITIAL_PROFILE_WORK_STATES,
  INITIAL_WORK_EVENTS,
  INITIAL_WORK_ITEMS,
  WORK_CONSOLE_SUMMARY,
} from './mockFixture';

export const MOCK_WORK_CONSOLE_SOURCE_STATUS: WorkConsoleSourceStatus = {
  kind: 'mock-fixture',
  connectionState: 'fixture_ready',
  readOnly: true,
  liveDisabled: true,
  label: 'Mock fixture only',
  message: 'Phase 2는 mock fixture가 준비된 상태만 표시합니다. live Hermes 연결 준비 완료나 실제 연결 상태가 아닙니다.',
  safetyNotes: [
    'read-only snapshot props only',
    'live disabled',
    'no Hermes DB/API/websocket/gateway call',
  ],
  checkedAt: WORK_CONSOLE_SUMMARY.generatedAt,
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
