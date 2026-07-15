/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase 3C-3 runtime gate contract.
 * Pure fixture-only logic: no env, filesystem, network, database, gateway, cron,
 * or server runtime imports. This gate only decides whether a future source may
 * be constructed. The live cron reader is still absent and disabled.
 */

import { sanitizeCronOutputText } from './cronOutputSanitizer';

export type WorkConsoleRuntimeSource = 'fixture' | 'local-cron-readonly' | 'disabled';

export type WorkConsoleRuntimeMode = 'development' | 'test' | 'preview' | 'production' | 'unknown';

export type WorkConsoleApprovalScope =
  | 'none'
  | 'design-only'
  | 'fixture-only-gate'
  | 'local-readonly-spike'
  | 'production-enable';

export type WorkConsoleGateDecisionState = 'allowed' | 'blocked';

export type WorkConsoleGateReason =
  | 'source_fixture_default'
  | 'source_disabled'
  | 'unknown_source_blocked'
  | 'missing_traceable_approval'
  | 'approval_scope_too_narrow'
  | 'read_only_boundary_unverified'
  | 'production_live_read_blocked'
  | 'feature_flag_disabled'
  | 'write_capability_present'
  | 'network_capability_present'
  | 'path_boundary_unverified'
  | 'domain_policy_unverified'
  | 'owner_policy_unverified'
  | 'metadata_sanitizer_unverified'
  | 'cache_policy_unverified'
  | 'logging_policy_unverified'
  | 'safe_error_policy_unverified'
  | 'bundle_leak_scan_unverified'
  | 'kill_switch_unverified'
  | 'live_cron_reader_not_implemented';

export interface WorkConsoleApprovalEvidence {
  scope: WorkConsoleApprovalScope;
  artifactId?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface WorkConsoleRuntimeGateInput {
  source?: string;
  runtimeMode?: WorkConsoleRuntimeMode;
  approval?: WorkConsoleApprovalEvidence;
  featureFlagEnabled?: boolean;
  readOnlyBoundaryVerified?: boolean;
  writeCapabilityEnabled?: boolean;
  networkCapabilityEnabled?: boolean;
  pathBoundaryVerified?: boolean;
  domainPolicyVerified?: boolean;
  ownerPolicyVerified?: boolean;
  metadataSanitizerVerified?: boolean;
  cachePolicyVerified?: boolean;
  loggingPolicyVerified?: boolean;
  safeErrorPolicyVerified?: boolean;
  bundleLeakScanVerified?: boolean;
  killSwitchVerified?: boolean;
}

export interface WorkConsoleRuntimeGateDecision {
  state: WorkConsoleGateDecisionState;
  source: WorkConsoleRuntimeSource;
  liveReadEnabled: false;
  adapterKind: 'fixture' | 'disabled-live';
  reasons: WorkConsoleGateReason[];
  safeMessage: string;
}

const LIVE_APPROVAL_SCOPES = new Set<WorkConsoleApprovalScope>([
  'local-readonly-spike',
  'production-enable',
]);

const normalizeSource = (source: string | undefined): WorkConsoleRuntimeSource | 'unknown' => {
  if (!source || source === 'fixture') return 'fixture';
  if (source === 'disabled') return 'disabled';
  if (source === 'local-cron-readonly') return 'local-cron-readonly';
  return 'unknown';
};

const hasTraceableApproval = (approval: WorkConsoleApprovalEvidence | undefined): boolean => Boolean(
  approval?.artifactId?.trim() && approval?.approvedBy?.trim() && approval?.approvedAt?.trim(),
);

export const evaluateWorkConsoleRuntimeGate = (
  input: WorkConsoleRuntimeGateInput = {},
): WorkConsoleRuntimeGateDecision => {
  const source = normalizeSource(input.source);

  if (source === 'fixture') {
    return {
      state: 'allowed',
      source: 'fixture',
      liveReadEnabled: false,
      adapterKind: 'fixture',
      reasons: ['source_fixture_default'],
      safeMessage: 'Fixture/demo source is active. Live cron read remains disabled.',
    };
  }

  const reasons: WorkConsoleGateReason[] = [];

  if (source === 'unknown') {
    reasons.push('unknown_source_blocked');
  }

  if (source === 'disabled') {
    reasons.push('source_disabled');
  }

  if (source === 'local-cron-readonly') {
    if (!hasTraceableApproval(input.approval)) reasons.push('missing_traceable_approval');
    if (!LIVE_APPROVAL_SCOPES.has(input.approval?.scope ?? 'none')) reasons.push('approval_scope_too_narrow');
    if (!input.readOnlyBoundaryVerified) reasons.push('read_only_boundary_unverified');
    if (input.runtimeMode === 'production') reasons.push('production_live_read_blocked');
    if (!input.featureFlagEnabled) reasons.push('feature_flag_disabled');
    if (input.writeCapabilityEnabled !== false) reasons.push('write_capability_present');
    if (input.networkCapabilityEnabled !== false) reasons.push('network_capability_present');
    if (!input.pathBoundaryVerified) reasons.push('path_boundary_unverified');
    if (!input.domainPolicyVerified) reasons.push('domain_policy_unverified');
    if (!input.ownerPolicyVerified) reasons.push('owner_policy_unverified');
    if (!input.metadataSanitizerVerified) reasons.push('metadata_sanitizer_unverified');
    if (!input.cachePolicyVerified) reasons.push('cache_policy_unverified');
    if (!input.loggingPolicyVerified) reasons.push('logging_policy_unverified');
    if (!input.safeErrorPolicyVerified) reasons.push('safe_error_policy_unverified');
    if (!input.bundleLeakScanVerified) reasons.push('bundle_leak_scan_unverified');
    if (!input.killSwitchVerified) reasons.push('kill_switch_unverified');
    reasons.push('live_cron_reader_not_implemented');
  }

  return {
    state: 'blocked',
    source: source === 'unknown' ? 'disabled' : source,
    liveReadEnabled: false,
    adapterKind: 'disabled-live',
    reasons,
    safeMessage: 'Work Console live cron read is blocked by the runtime gate. Fixture or disabled state must be shown instead.',
  };
};

export interface WorkConsoleSafeErrorPayload {
  code: 'WORK_CONSOLE_SOURCE_BLOCKED' | 'WORK_CONSOLE_SOURCE_ERROR';
  message: string;
  reasons: string[];
}

const SECRET_LIKE_PATTERN = /(?:authorization\s+bearer|bearer|token|secret|password|authorization|webhook|api[_-]?key|github_pat_[A-Za-z0-9_]+|ghp_[A-Za-z0-9_]+|sk-[A-Za-z0-9_-]+)[\s:=/]*[^\s"'<>]*/gi;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const LONG_ID_PATTERN = /\b\d{12,}\b/g;
const ABSOLUTE_PATH_PATTERN = /(?:[A-Za-z]:\\|\/)[^\s"'<>]+/g;
const ENV_NAME_PATTERN = /\b(?:HERMES|DISCORD|TELEGRAM|SUPABASE|VITE)_[A-Z0-9_]+\b/g;

export const normalizeWorkConsoleErrorPayload = (
  unknownError: unknown,
  reasons: string[] = [],
): WorkConsoleSafeErrorPayload => {
  const raw = unknownError instanceof Error ? unknownError.message : String(unknownError ?? 'unknown error');
  const baseSanitized = sanitizeCronOutputText(raw).safeText;
  const sanitized = baseSanitized
    .replace(SECRET_LIKE_PATTERN, '[REDACTED_SECRET]')
    .replace(EMAIL_PATTERN, '[REDACTED_EMAIL]')
    .replace(LONG_ID_PATTERN, '[REDACTED_ID]')
    .replace(ABSOLUTE_PATH_PATTERN, '[REDACTED_PATH]')
    .replace(ENV_NAME_PATTERN, '[REDACTED_ENV_NAME]')
    .slice(0, 160);

  return {
    code: 'WORK_CONSOLE_SOURCE_BLOCKED',
    message: sanitized || 'Work Console source is blocked.',
    reasons: reasons.map((reason) => reason.replace(/[^a-z0-9_-]/gi, '_')).slice(0, 24),
  };
};
