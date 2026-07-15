/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WorkItemStatus =
  | 'queued'
  | 'running'
  | 'needs_approval'
  | 'blocked'
  | 'in_review'
  | 'completed';

export type WorkItemKind =
  | 'user_request'
  | 'kanban_task'
  | 'profile_run'
  | 'approval_gate'
  | 'mimir_placeholder';

export type WorkPriority = 'low' | 'normal' | 'high' | 'urgent';

export type WorkSource = 'mock' | 'kanban' | 'gateway' | 'session' | 'mimir';

export type WorkConsoleJobRunState = 'scheduled' | 'paused' | 'disabled' | 'unknown';

export type WorkConsoleJobRunStatus = 'ok' | 'error' | 'unknown';

export type WorkConsoleSourceFreshness = 'fresh' | 'stale' | 'missing' | 'unknown';

export type WorkConsoleCronVisibility = 'visible' | 'hidden';

export type WorkConsoleCronDomainPolicy = 'allowed' | 'denied' | 'unknown';

export type WorkConsoleCronOwnerPolicy = 'allowed' | 'denied' | 'unknown';

export type WorkConsoleJobSourcePathKind = 'cron_jobs_json' | 'cron_output_dir' | 'legacy_flat_output' | 'fixture';

export interface WorkConsoleJobOutputFixture {
  jobId: string;
  jobName: string;
  jobState: WorkConsoleJobRunState;
  enabled: boolean;
  scheduleLabel: string;
  owner?: string;
  domain?: string;
  pausedReason?: string;
  lastRunAt?: string;
  nextRunAt?: string;
  lastStatus?: WorkConsoleJobRunStatus;
  outputText: string;
  outputCreatedAt?: string;
  sourcePathKind: WorkConsoleJobSourcePathKind;
}

export interface WorkConsoleJobRunSummary {
  jobId: string;
  jobName: string;
  jobState: WorkConsoleJobRunState;
  enabled: boolean;
  scheduleLabel: string;
  owner?: string;
  domain?: string;
  pausedReason?: string;
  visibility: WorkConsoleCronVisibility;
  domainPolicy: WorkConsoleCronDomainPolicy;
  ownerPolicy: WorkConsoleCronOwnerPolicy;
  policyReasons: string[];
  lastRunAt?: string;
  nextRunAt?: string;
  lastStatus: WorkConsoleJobRunStatus;
  latestOutputAt?: string;
  latestOutputSizeBytes: number;
  outputCount: number;
  freshness: WorkConsoleSourceFreshness;
  safeSummary: string;
  riskFlags: string[];
  redactionCount: number;
  sourcePathKind: WorkConsoleJobSourcePathKind;
}

export type WorkArtifactRefType = 'comment' | 'file' | 'url' | 'diff' | 'report' | 'mimir_link';

export interface WorkArtifactRef {
  label: string;
  type: WorkArtifactRefType;
  href?: string;
  path?: string;
  description?: string;
}

export interface WorkItem {
  id: string;
  externalId?: string;
  kind: WorkItemKind;
  title: string;
  summary: string;
  status: WorkItemStatus;
  priority: WorkPriority;
  ownerProfile: string;
  assignedProfiles: string[];
  parentId?: string | null;
  childIds: string[];
  dependsOn: string[];
  progress: number;
  currentStep: string;
  nextAction: string;
  blockerReason?: string;
  approvalRequired?: boolean;
  approvalLabel?: string;
  reviewRequired?: boolean;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  lastHeartbeatAt?: string;
  estimatedDoneAt?: string;
  source: WorkSource;
  tags: string[];
  artifactRefs: WorkArtifactRef[];
}

export type ProfileWorkStatus =
  | 'idle'
  | 'queued'
  | 'running'
  | 'blocked'
  | 'waiting_approval'
  | 'waiting_review'
  | 'offline'
  | 'error';

export interface ProfileWorkState {
  profileId: string;
  displayName: string;
  role: string;
  status: ProfileWorkStatus;
  currentFocus: string;
  outputSummary: string;
  activeWorkItemIds: string[];
  queueDepth: number;
  currentAction: string;
  lastEventId?: string;
  lastHeartbeatAt?: string;
  lastUsedAt: string;
  successCountToday: number;
  blockedCountToday: number;
  averageTurnaroundMinutes?: number;
  capabilities: string[];
  handoffTo: string[];
}

export type WorkEventType =
  | 'request_received'
  | 'routed'
  | 'task_created'
  | 'task_claimed'
  | 'profile_started'
  | 'heartbeat'
  | 'comment_added'
  | 'blocked'
  | 'approval_requested'
  | 'approval_granted'
  | 'review_required'
  | 'completed'
  | 'failed'
  | 'artifact_created'
  | 'mimir_placeholder';

export type WorkEventLevel = 'info' | 'success' | 'warning' | 'error';

export interface WorkEvent {
  id: string;
  workItemId: string;
  parentWorkItemId?: string;
  timestamp: string;
  actorProfile: string;
  targetProfile?: string;
  type: WorkEventType;
  level: WorkEventLevel;
  title: string;
  message: string;
  payload?: Record<string, string | number | boolean | null>;
  source: WorkSource;
}

export interface AgentFlowStep {
  id: string;
  order: number;
  profile: string;
  role: string;
  status: WorkItemStatus;
  outputSummary: string;
  startedAt: string;
  completedAt?: string;
  relatedWorkItemId: string;
  handoffTo?: string;
}

export interface WorkConsoleSummary {
  mode: 'mock' | 'live-disabled';
  generatedAt: string;
  sourceLabel: string;
  statusLabels: Record<WorkItemStatus, string>;
  phase2Notice: string;
}

export type WorkConsoleSourceKind = 'mock-fixture' | 'hermes-live-disabled';

export type WorkConsoleSourceConnectionState = 'fixture_ready' | 'disabled' | 'not_configured';

export type WorkConsoleContractPhase =
  | '3C-4-safe-contract'
  | '3D-server-handoff-design'
  | '3E-local-staging-spike'
  | '3F-staging-integration'
  | '3G-production-enable';

export type WorkConsoleGateStatus = 'passed' | 'blocked' | 'pending';

export interface WorkConsoleApprovalGateStatus {
  id: string;
  label: string;
  status: WorkConsoleGateStatus;
  requiredForPhase: WorkConsoleContractPhase;
  note: string;
}

export interface WorkConsoleServerHandoffStatus {
  required: boolean;
  status: 'required' | 'not_required' | 'completed';
  owner: 'server' | 'frontend' | 'router';
  note: string;
}

export interface WorkConsoleLiveConnectionStatus {
  fixtureMode: boolean;
  liveReadDisabled: true;
  serverHandoffRequired: boolean;
  productionLiveApproved: false;
  currentPhase: WorkConsoleContractPhase;
  nextPhase: WorkConsoleContractPhase;
  statusMessage: string;
}

export interface WorkConsoleSourceStatus {
  kind: WorkConsoleSourceKind;
  connectionState: WorkConsoleSourceConnectionState;
  readOnly: true;
  liveDisabled: boolean;
  label: string;
  message: string;
  safetyNotes: string[];
  liveConnection: WorkConsoleLiveConnectionStatus;
  serverHandoff: WorkConsoleServerHandoffStatus;
  approvalGates: WorkConsoleApprovalGateStatus[];
  checkedAt: string;
  serverSnapshotEnvelope?: WorkConsoleServerSnapshotPolicyEnvelope;
}

export type WorkConsoleSnapshotApiVersion = 'work-console-snapshot.v1';

export type WorkConsoleServerSnapshotSourceMode =
  | 'fixture-only'
  | 'server-snapshot-disabled'
  | 'server-snapshot-stale'
  | 'server-snapshot-fallback'
  | 'server-snapshot';

export type WorkConsoleServerSnapshotCacheState = 'fresh' | 'stale' | 'fallback' | 'disabled' | 'unavailable';

export type WorkConsoleSafeComponentKind = 'gateway' | 'scheduler' | 'profile-group' | 'session-summary' | 'system-check';

export interface WorkConsoleSafeApiError {
  code: string;
  safeMessage: string;
  retryable: boolean;
  severity: 'info' | 'warning' | 'error';
  opaqueCorrelationRef?: string;
}

export interface WorkConsoleSafeComponentSummary {
  componentRef: string;
  kind: WorkConsoleSafeComponentKind;
  status: 'disabled' | 'stale' | 'fallback' | 'unknown' | 'degraded';
  safeMessage: string;
  lastUpdatedAt?: string;
  countBucket?: '0' | '1-5' | '5+';
  issueCode?: string;
}

export interface WorkConsoleServerSnapshotEnvelope {
  apiVersion: WorkConsoleSnapshotApiVersion;
  sourceMode: WorkConsoleServerSnapshotSourceMode;
  cacheState: WorkConsoleServerSnapshotCacheState;
  generatedAt: string;
  staleAfter: string;
  expiresAt: string;
  readOnly: true;
  liveReadEnabled: boolean;
  productionLiveApproved: boolean;
  serverCollectorApproved: boolean;
  privateIdsRedacted: true;
  rawLogsIncluded: false;
  rawRuntimeOutputIncluded: false;
  safeComponents: WorkConsoleSafeComponentSummary[];
  errors: WorkConsoleSafeApiError[];
  approvalGates: WorkConsoleApprovalGateStatus[];
}

export type WorkConsoleSnapshotAudience = 'admin-internal';

export type WorkConsoleCollectorState =
  | 'disabled'
  | 'not_approved'
  | 'collecting'
  | 'degraded'
  | 'unavailable';

export type WorkConsoleKillSwitchState = 'enabled' | 'disabled' | 'forced_disabled';

export interface WorkConsoleSnapshotEndpointPolicy {
  routeImplemented: boolean;
  adminOnly: boolean;
  publicAccess: boolean;
  cacheHeader: 'no-store';
  authBoundary: 'admin-session-or-internal-relay';
}

export interface WorkConsoleSnapshotFreshnessPolicy {
  maxFreshAgeSeconds: number;
  maxStaleFallbackSeconds: number;
  allowStaleFallback: boolean;
  allowSharedCache: boolean;
}

export interface WorkConsoleSnapshotKillSwitchPolicy {
  state: WorkConsoleKillSwitchState;
  serverSideRequired: boolean;
  clientFallbackOnly: boolean;
  safeMessage: string;
}

export interface WorkConsoleServerSnapshotPolicyEnvelope extends WorkConsoleServerSnapshotEnvelope {
  audience: WorkConsoleSnapshotAudience;
  collectorState: WorkConsoleCollectorState;
  endpointPolicy: WorkConsoleSnapshotEndpointPolicy;
  freshnessPolicy: WorkConsoleSnapshotFreshnessPolicy;
  killSwitch: WorkConsoleSnapshotKillSwitchPolicy;
}

export interface WorkConsoleSnapshot {
  summary: WorkConsoleSummary;
  sourceStatus: WorkConsoleSourceStatus;
  workItems: WorkItem[];
  profileStates: ProfileWorkState[];
  events: WorkEvent[];
  agentFlow: AgentFlowStep[];
}

export interface WorkConsoleDataAdapter {
  readonly id: string;
  readonly label: string;
  getSnapshot: () => WorkConsoleSnapshot;
}
