/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Browser-safe Work Console data entrypoint.
 *
 * This module is fixture/static-frontend only. React UI code may import this
 * entrypoint, but must not import the internal barrel, server serializer, live
 * adapter, runtime gate, collector, gateway, cron reader, or Node-only modules.
 */

export {
  MOCK_SERVER_SNAPSHOT_ENVELOPE,
  MOCK_WORK_CONSOLE_SNAPSHOT,
  MOCK_WORK_CONSOLE_SOURCE_STATUS,
  getWorkConsoleSnapshot,
  mockWorkConsoleAdapter,
} from './mockAdapter';
export {
  AGENT_FLOW_TIMELINE,
  INITIAL_PROFILE_WORK_STATES,
  INITIAL_WORK_EVENTS,
  INITIAL_WORK_ITEMS,
  WORK_CONSOLE_SUMMARY,
} from './mockFixture';
