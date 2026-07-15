/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * S16 dummy-only approval evidence packet.
 *
 * This fixture defines what evidence must look like before any later Stage 4
 * local/staging read-only spike can be considered. It is intentionally dummy
 * and sanitized. It does not read Hermes runtime, gateway, scheduler, session,
 * database, filesystem, environment, credentials, or production sources.
 */

export interface WorkConsoleApprovalEvidenceCheck {
  id: string;
  title: string;
  status: 'pass' | 'blocked';
  evidenceKind: 'dummy-static' | 'policy-assertion' | 'negative-test';
  safeSummary: string;
}

export interface WorkConsoleDummyApprovalEvidencePacket {
  contractVersion: 'work-console-dummy-approval-evidence.v1';
  stage: 's16-stage1-dummy-only-approval-packet';
  fixtureOnly: true;
  dummyOnly: true;
  liveReadEnabled: false;
  stage4Approved: false;
  localRuntimeSourceApproved: false;
  stagingRuntimeSourceApproved: false;
  productionLiveApproved: false;
  apiRouteImplemented: false;
  serverCollectorImplemented: false;
  envSecretAccessApproved: false;
  filesystemReadApproved: false;
  gatewayReadApproved: false;
  schedulerReadApproved: false;
  sessionDatabaseReadApproved: false;
  rawEvidenceAllowed: false;
  browserDisplayAllowed: false;
  approvalMeaning: 'evidence-schema-only-not-runtime-approval';
  requiredFutureApprovals: string[];
  evidenceChecks: WorkConsoleApprovalEvidenceCheck[];
  blockerConditions: string[];
  nextGoal: 's17-dummy-evidence-ui-preview-or-stage4-review-packet';
}

export const WORK_CONSOLE_DUMMY_APPROVAL_EVIDENCE_PACKET: WorkConsoleDummyApprovalEvidencePacket = {
  contractVersion: 'work-console-dummy-approval-evidence.v1',
  stage: 's16-stage1-dummy-only-approval-packet',
  fixtureOnly: true,
  dummyOnly: true,
  liveReadEnabled: false,
  stage4Approved: false,
  localRuntimeSourceApproved: false,
  stagingRuntimeSourceApproved: false,
  productionLiveApproved: false,
  apiRouteImplemented: false,
  serverCollectorImplemented: false,
  envSecretAccessApproved: false,
  filesystemReadApproved: false,
  gatewayReadApproved: false,
  schedulerReadApproved: false,
  sessionDatabaseReadApproved: false,
  rawEvidenceAllowed: false,
  browserDisplayAllowed: false,
  approvalMeaning: 'evidence-schema-only-not-runtime-approval',
  requiredFutureApprovals: [
    'traceable-user-approval-for-stage4-local-only-scope',
    'server-profile-signoff-before-any-runtime-source-read',
    'checker-green-before-any-staging-source-read',
    'separate-production-live-connection-approval',
    'rollback-and-kill-switch-plan-before-runtime-source-read',
  ],
  evidenceChecks: [
    {
      id: 'dummy-source-boundary',
      title: 'Dummy source boundary remains locked',
      status: 'pass',
      evidenceKind: 'policy-assertion',
      safeSummary: 'Evidence packet uses checked-in dummy data only.',
    },
    {
      id: 'no-runtime-reader',
      title: 'No runtime reader exists in this packet',
      status: 'pass',
      evidenceKind: 'policy-assertion',
      safeSummary: 'No route, collector, gateway reader, scheduler reader, session reader, database reader, file reader, or environment reader is implemented.',
    },
    {
      id: 'no-browser-display',
      title: 'Evidence packet is not browser-facing',
      status: 'pass',
      evidenceKind: 'policy-assertion',
      safeSummary: 'Packet is used by verifier documentation only and is not wired into the Work Console UI.',
    },
    {
      id: 'negative-drift-required',
      title: 'Documentation drift must fail verification',
      status: 'pass',
      evidenceKind: 'negative-test',
      safeSummary: 'Changing a mirrored approval flag must make the verifier fail before the document is restored.',
    },
  ],
  blockerConditions: [
    'block-if-real-source-access-is-required',
    'block-if-raw-evidence-is-requested',
    'block-if-private-path-or-id-is-needed',
    'block-if-env-secret-or-credential-is-needed',
    'block-if-api-route-or-server-collector-is-needed',
    'block-if-stage4-or-production-approval-is-implied',
    'block-if-browser-display-of-evidence-is-requested',
  ],
  nextGoal: 's17-dummy-evidence-ui-preview-or-stage4-review-packet',
};
