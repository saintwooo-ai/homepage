/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * S15 fixture-only local/staging spike scope decision. This file is a scope
 * lock for review and verification only. It does not implement a route,
 * collector, gateway reader, scheduler reader, session reader, database reader,
 * filesystem reader, or environment/secret reader.
 */

export interface WorkConsoleLocalSpikeScopeDecision {
  contractVersion: 'work-console-local-spike-scope.v1';
  scope: 's15-local-only-design-review';
  fixtureOnly: true;
  dummyOnly: true;
  readOnly: true;
  liveReadEnabled: false;
  routeImplemented: false;
  serverCollectorImplemented: false;
  apiRouteImplemented: false;
  stagingRuntimeSourceApproved: false;
  productionLiveApproved: false;
  envSecretAccessApproved: false;
  filesystemReadApproved: false;
  gatewayReadApproved: false;
  schedulerReadApproved: false;
  sessionDatabaseReadApproved: false;
  requiresSeparateStage4Approval: true;
  requiresSeparateProductionApproval: true;
  verifierPassDoesNotApproveLiveConnection: true;
  allowedS15Work: string[];
  deferredWork: string[];
  stopConditions: string[];
  nextGoal: 's16-stage1-dummy-approval-packet';
}

export const WORK_CONSOLE_LOCAL_SPIKE_SCOPE_FIXTURE: WorkConsoleLocalSpikeScopeDecision = {
  contractVersion: 'work-console-local-spike-scope.v1',
  scope: 's15-local-only-design-review',
  fixtureOnly: true,
  dummyOnly: true,
  readOnly: true,
  liveReadEnabled: false,
  routeImplemented: false,
  serverCollectorImplemented: false,
  apiRouteImplemented: false,
  stagingRuntimeSourceApproved: false,
  productionLiveApproved: false,
  envSecretAccessApproved: false,
  filesystemReadApproved: false,
  gatewayReadApproved: false,
  schedulerReadApproved: false,
  sessionDatabaseReadApproved: false,
  requiresSeparateStage4Approval: true,
  requiresSeparateProductionApproval: true,
  verifierPassDoesNotApproveLiveConnection: true,
  allowedS15Work: [
    'docs-only-scope-lock',
    'fixture-only-contract',
    'scanned-json-deep-equality',
    'verifier-only-guardrails',
    'dummy-sanitized-source-categories',
    'build-gate-integration',
  ],
  deferredWork: [
    'server-collector-implementation',
    'api-route-implementation',
    'local-runtime-source-read',
    'staging-runtime-source-read',
    'production-live-data-connection',
    'env-secret-access',
    'filesystem-profile-read',
    'gateway-log-read',
    'scheduler-output-read',
    'session-database-read',
    'vps-docker-gateway-cron-restart',
  ],
  stopConditions: [
    'stop-if-real-source-access-is-needed',
    'stop-if-api-route-or-collector-code-is-needed',
    'stop-if-env-secret-or-credential-access-is-needed',
    'stop-if-raw-output-log-path-id-or-stack-is-needed',
    'stop-if-staging-or-production-live-source-is-implied',
    'stop-if-verifier-pass-is-described-as-live-approval',
  ],
  nextGoal: 's16-stage1-dummy-approval-packet',
};
