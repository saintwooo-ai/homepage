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

export type WorkConsoleJobSourcePathKind = 'cron_jobs_json' | 'cron_output_dir' | 'legacy_flat_output' | 'fixture';

export interface WorkConsoleJobOutputFixture {
  jobId: string;
  jobName: string;
  jobState: WorkConsoleJobRunState;
  enabled: boolean;
  scheduleLabel: string;
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

export interface WorkConsoleSourceStatus {
  kind: WorkConsoleSourceKind;
  connectionState: WorkConsoleSourceConnectionState;
  readOnly: true;
  liveDisabled: boolean;
  label: string;
  message: string;
  safetyNotes: string[];
  checkedAt: string;
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
