/**
 * Phase 3C-3 fixture-only runtime gate verification.
 * Pure in-memory checks only; no filesystem, env, cron, gateway, server, or live data access.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createWorkConsoleAdapter,
  evaluateWorkConsoleRuntimeGate,
  normalizeWorkConsoleErrorPayload,
} from '../src/data/work-console';

const fixtureGate = evaluateWorkConsoleRuntimeGate();
assert.equal(fixtureGate.state, 'allowed');
assert.equal(fixtureGate.source, 'fixture');
assert.equal(fixtureGate.adapterKind, 'fixture');
assert.equal(fixtureGate.liveReadEnabled, false);
assert.deepEqual(fixtureGate.reasons, ['source_fixture_default']);

const defaultAdapter = createWorkConsoleAdapter();
assert.equal(defaultAdapter.adapter.id, 'mock-work-console-adapter');
assert.equal(defaultAdapter.gate.adapterKind, 'fixture');
assert.equal(defaultAdapter.adapter.getSnapshot().sourceStatus.connectionState, 'fixture_ready');
assert.equal(defaultAdapter.adapter.getSnapshot().sourceStatus.liveDisabled, true);
assert.equal(defaultAdapter.adapter.getSnapshot().sourceStatus.liveConnection.fixtureMode, true);
assert.equal(defaultAdapter.adapter.getSnapshot().sourceStatus.liveConnection.liveReadDisabled, true);
assert.equal(defaultAdapter.adapter.getSnapshot().sourceStatus.liveConnection.serverHandoffRequired, true);
assert.equal(defaultAdapter.adapter.getSnapshot().sourceStatus.liveConnection.productionLiveApproved, false);
assert.equal(defaultAdapter.adapter.getSnapshot().sourceStatus.liveConnection.currentPhase, '3C-4-safe-contract');
assert.equal(defaultAdapter.adapter.getSnapshot().sourceStatus.liveConnection.nextPhase, '3D-server-handoff-design');
assert.equal(defaultAdapter.adapter.getSnapshot().sourceStatus.serverHandoff.status, 'required');
assert.equal(defaultAdapter.adapter.getSnapshot().sourceStatus.approvalGates.some(gate => gate.id === 'production-live-approval' && gate.status === 'blocked'), true);
assert.equal(JSON.stringify(defaultAdapter.adapter.getSnapshot().sourceStatus).includes('Production live connection not approved'), true);

const unknownAdapter = createWorkConsoleAdapter({ source: 'unexpected-live-source' });
assert.equal(unknownAdapter.gate.state, 'blocked');
assert.equal(unknownAdapter.gate.liveReadEnabled, false);
assert.equal(unknownAdapter.adapter.id, 'live-hermes-work-console-disabled-adapter');
assert.equal(unknownAdapter.gate.reasons.includes('unknown_source_blocked'), true);
assert.equal(unknownAdapter.adapter.getSnapshot().sourceStatus.connectionState, 'not_configured');

const designOnlyLiveAttempt = evaluateWorkConsoleRuntimeGate({
  source: 'local-cron-readonly',
  runtimeMode: 'development',
  approval: {
    scope: 'design-only',
    artifactId: 'discord-message-123',
    approvedBy: 'ugnas',
    approvedAt: '2026-07-15T00:00:00.000Z',
  },
  featureFlagEnabled: true,
  readOnlyBoundaryVerified: true,
  writeCapabilityEnabled: false,
  networkCapabilityEnabled: false,
  pathBoundaryVerified: true,
  domainPolicyVerified: true,
  ownerPolicyVerified: true,
  metadataSanitizerVerified: true,
  cachePolicyVerified: true,
  loggingPolicyVerified: true,
  safeErrorPolicyVerified: true,
  bundleLeakScanVerified: true,
  killSwitchVerified: true,
});
assert.equal(designOnlyLiveAttempt.state, 'blocked');
assert.equal(designOnlyLiveAttempt.liveReadEnabled, false);
assert.equal(designOnlyLiveAttempt.reasons.includes('approval_scope_too_narrow'), true);
assert.equal(designOnlyLiveAttempt.reasons.includes('production_live_not_approved'), true);
assert.equal(designOnlyLiveAttempt.reasons.includes('live_cron_reader_not_implemented'), true);
assert.equal(designOnlyLiveAttempt.safeMessage.includes('Production live connection not approved'), true);

const allGatesButProduction = evaluateWorkConsoleRuntimeGate({
  source: 'local-cron-readonly',
  runtimeMode: 'production',
  approval: {
    scope: 'production-enable',
    artifactId: 'change-record-456',
    approvedBy: 'owner',
    approvedAt: '2026-07-15T00:00:00.000Z',
  },
  featureFlagEnabled: true,
  readOnlyBoundaryVerified: true,
  writeCapabilityEnabled: false,
  networkCapabilityEnabled: false,
  pathBoundaryVerified: true,
  domainPolicyVerified: true,
  ownerPolicyVerified: true,
  metadataSanitizerVerified: true,
  cachePolicyVerified: true,
  loggingPolicyVerified: true,
  safeErrorPolicyVerified: true,
  bundleLeakScanVerified: true,
  killSwitchVerified: true,
});
assert.equal(allGatesButProduction.state, 'blocked');
assert.equal(allGatesButProduction.liveReadEnabled, false);
assert.equal(allGatesButProduction.reasons.includes('production_live_read_blocked'), true);
assert.equal(allGatesButProduction.reasons.includes('production_live_not_approved'), true);
assert.equal(allGatesButProduction.reasons.includes('live_cron_reader_not_implemented'), true);

const missingEverything = evaluateWorkConsoleRuntimeGate({
  source: 'local-cron-readonly',
  runtimeMode: 'preview',
});
const requiredBlockers = [
  'missing_traceable_approval',
  'approval_scope_too_narrow',
  'read_only_boundary_unverified',
  'production_live_not_approved',
  'feature_flag_disabled',
  'write_capability_present',
  'network_capability_present',
  'path_boundary_unverified',
  'domain_policy_unverified',
  'owner_policy_unverified',
  'metadata_sanitizer_unverified',
  'cache_policy_unverified',
  'logging_policy_unverified',
  'safe_error_policy_unverified',
  'bundle_leak_scan_unverified',
  'kill_switch_unverified',
  'live_cron_reader_not_implemented',
];
for (const reason of requiredBlockers) {
  assert.equal(missingEverything.reasons.includes(reason as never), true, `missing blocker ${reason}`);
}
assert.equal(missingEverything.liveReadEnabled, false);

const safeError = normalizeWorkConsoleErrorPayload(
  new Error('Authorization Bearer abc123 sent by test@example.com in /private/runtime/job.md profiles/router/cron/jobs.json .hermes/config HERMES_GATEWAY_TOKEN eyJabc.def.ghi https://example.com/callback?token=secret for id 1526570975141826681'),
  ['safe_error_policy_unverified', 'weird reason with spaces'],
);
assert.equal(safeError.code, 'WORK_CONSOLE_SOURCE_BLOCKED');
assert.equal(/Bearer|abc123|test@example\.com|\/private\/runtime|profiles\/router\/cron|jobs\.json|\.hermes|HERMES_GATEWAY_TOKEN|eyJabc|token=secret|1526570975141826681/.test(JSON.stringify(safeError)), false);
assert.deepEqual(safeError.reasons, ['safe_error_policy_unverified', 'weird_reason_with_spaces']);

const contractDoc = readFileSync('docs/work-console-phase3c4-safe-contract-hardening.md', 'utf8');
const requiredContractPhrases = [
  'Final Goal',
  'Phase 3C-4 safe contract',
  '3D server handoff design',
  '3E local/staging spike',
  '3F staging integration',
  '3G production enable',
  'Production live connection not approved',
  'Frontend direct VPS filesystem read is forbidden',
  'server/runtime sanitized snapshot',
];
for (const phrase of requiredContractPhrases) {
  assert.equal(contractDoc.includes(phrase), true, `contract doc missing ${phrase}`);
}

console.log('Work Console Phase 3C-4 runtime gate verification passed');
