/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase 4A fixture-only server handoff envelope.
 * This is not a live source and does not call a network, database, gateway,
 * scheduler, or runtime file reader. It exists only to keep the future
 * sanitized snapshot contract testable while live collection stays disabled.
 */

import type { WorkConsoleServerSnapshotEnvelope } from '../../types/workConsole';

export const WORK_CONSOLE_PHASE4A_SERVER_HANDOFF_FIXTURE: WorkConsoleServerSnapshotEnvelope = {
  apiVersion: 'work-console-snapshot.v1',
  sourceMode: 'fixture-only',
  cacheState: 'disabled',
  generatedAt: '2026-07-15T00:00:00.000Z',
  staleAfter: '2026-07-15T00:05:00.000Z',
  expiresAt: '2026-07-15T00:30:00.000Z',
  readOnly: true,
  liveReadEnabled: false,
  productionLiveApproved: false,
  serverCollectorApproved: false,
  privateIdsRedacted: true,
  rawLogsIncluded: false,
  rawRuntimeOutputIncluded: false,
  safeComponents: [
    {
      componentRef: 'demo-component-a',
      kind: 'gateway',
      status: 'disabled',
      safeMessage: 'Fixture-only contract. No live Hermes runtime is connected.',
      lastUpdatedAt: '2026-07-15T00:00:00.000Z',
      countBucket: '0',
      issueCode: 'LIVE_SOURCE_NOT_CONNECTED',
    },
    {
      componentRef: 'demo-component-b',
      kind: 'scheduler',
      status: 'fallback',
      safeMessage: 'Server collector is pending approval. No runtime read is performed.',
      lastUpdatedAt: '2026-07-15T00:00:00.000Z',
      countBucket: '0',
      issueCode: 'SERVER_COLLECTOR_PENDING_APPROVAL',
    },
  ],
  errors: [
    {
      code: 'WORK_CONSOLE_LIVE_NOT_APPROVED',
      safeMessage: 'Live Work Console data is not connected in Phase 4A.',
      retryable: false,
      severity: 'info',
      opaqueCorrelationRef: 'demo-correlation-a',
    },
  ],
  approvalGates: [
    {
      id: 'server-collector-design-review',
      label: 'Server collector design review',
      status: 'pending',
      requiredForPhase: '3E-local-staging-spike',
      note: 'Required before any runtime source is connected.',
    },
    {
      id: 'admin-only-boundary-review',
      label: 'Admin-only route boundary review',
      status: 'pending',
      requiredForPhase: '3E-local-staging-spike',
      note: 'Required before any server snapshot endpoint is implemented.',
    },
    {
      id: 'production-live-enable-approval',
      label: 'Production live enable approval',
      status: 'blocked',
      requiredForPhase: '3G-production-enable',
      note: 'Production live connection remains blocked.',
    },
  ],
};
