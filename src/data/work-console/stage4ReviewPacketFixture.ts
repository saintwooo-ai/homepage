/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * S17 Stage 4 review packet checklist.
 *
 * This fixture defines the non-live review packet required before a future
 * Stage 4 local-only read-only spike can be approved. It is checklist-only and
 * does not approve, implement, or execute runtime source reads.
 */

export interface WorkConsoleStage4ReviewGate {
  id: string;
  owner: 'router' | 'server' | 'checker' | 'user';
  status: 'required-not-yet-approved' | 'not-applicable-in-s17';
  safeSummary: string;
}

export interface WorkConsoleStage4ReviewPacket {
  contractVersion: 'work-console-stage4-review-packet.v1';
  stage: 's17-stage4-review-packet-checklist';
  checklistOnly: true;
  fixtureOnly: true;
  liveReadEnabled: false;
  stage4Approved: false;
  localRuntimeSourceApproved: false;
  stagingRuntimeSourceApproved: false;
  productionLiveApproved: false;
  apiRouteImplemented: false;
  serverCollectorImplemented: false;
  browserDisplayApproved: false;
  envSecretAccessApproved: false;
  filesystemReadApproved: false;
  gatewayReadApproved: false;
  schedulerReadApproved: false;
  sessionDatabaseReadApproved: false;
  requiresFreshUserApproval: true;
  requiresServerSignoff: true;
  requiresCheckerGreen: true;
  requiresRollbackPlan: true;
  requiresKillSwitchPlan: true;
  gates: WorkConsoleStage4ReviewGate[];
  explicitNonApprovals: string[];
  nextGoal: 's18-stage4-local-only-approval-decision-or-dummy-ui-preview';
}

export const WORK_CONSOLE_STAGE4_REVIEW_PACKET: WorkConsoleStage4ReviewPacket = {
  contractVersion: 'work-console-stage4-review-packet.v1',
  stage: 's17-stage4-review-packet-checklist',
  checklistOnly: true,
  fixtureOnly: true,
  liveReadEnabled: false,
  stage4Approved: false,
  localRuntimeSourceApproved: false,
  stagingRuntimeSourceApproved: false,
  productionLiveApproved: false,
  apiRouteImplemented: false,
  serverCollectorImplemented: false,
  browserDisplayApproved: false,
  envSecretAccessApproved: false,
  filesystemReadApproved: false,
  gatewayReadApproved: false,
  schedulerReadApproved: false,
  sessionDatabaseReadApproved: false,
  requiresFreshUserApproval: true,
  requiresServerSignoff: true,
  requiresCheckerGreen: true,
  requiresRollbackPlan: true,
  requiresKillSwitchPlan: true,
  gates: [
    {
      id: 'fresh-user-approval',
      owner: 'user',
      status: 'required-not-yet-approved',
      safeSummary: 'Future Stage 4 work needs a fresh approval that explicitly names local-only read-only scope.',
    },
    {
      id: 'server-runtime-boundary-signoff',
      owner: 'server',
      status: 'required-not-yet-approved',
      safeSummary: 'Server must sign off the exact source boundary before any runtime source can be read.',
    },
    {
      id: 'checker-risk-review',
      owner: 'checker',
      status: 'required-not-yet-approved',
      safeSummary: 'Checker must confirm no raw logs, private paths, private identifiers, secrets, or browser exposure are introduced.',
    },
    {
      id: 'rollback-and-kill-switch-plan',
      owner: 'router',
      status: 'required-not-yet-approved',
      safeSummary: 'A disable path and rollback plan must exist before any local-only runtime source read is attempted.',
    },
    {
      id: 'staging-and-production-separated',
      owner: 'router',
      status: 'required-not-yet-approved',
      safeSummary: 'Local-only approval must not imply staging or production live data approval.',
    },
  ],
  explicitNonApprovals: [
    'no-stage4-execution-approval',
    'no-local-runtime-source-read-approval',
    'no-staging-source-read-approval',
    'no-production-live-data-approval',
    'no-api-route-implementation-approval',
    'no-server-collector-implementation-approval',
    'no-browser-display-approval',
    'no-env-secret-filesystem-gateway-scheduler-session-database-access-approval',
    'no-vps-docker-gateway-cron-server-restart-approval',
  ],
  nextGoal: 's18-stage4-local-only-approval-decision-or-dummy-ui-preview',
};
