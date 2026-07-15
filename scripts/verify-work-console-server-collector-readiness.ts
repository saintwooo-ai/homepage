/**
 * Phase 4C/S13 Work Console server collector readiness verification.
 *
 * This verifier checks only the pre-live readiness contract fixture and the
 * marked documentation example. It does not validate or execute any live
 * runtime source, server route, gateway, scheduler, database, or filesystem
 * reader.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  WORK_CONSOLE_SERVER_COLLECTOR_READINESS_FIXTURE,
  type WorkConsoleServerCollectorReadinessContract,
} from '../src/data/work-console/serverCollectorReadinessFixture';

const docPath = 'docs/work-console-phase4c-server-collector-readiness.md';
const docBody = readFileSync(docPath, 'utf8');
const scanBlockMatch = docBody.match(
  /<!-- work-console-collector-readiness-scan:start -->([\s\S]*?)<!-- work-console-collector-readiness-scan:end -->/,
);
assert.ok(scanBlockMatch, 'Phase 4C docs must include a marked collector readiness scan block');
const docScanBlock = scanBlockMatch[1] ?? '';
const docJsonMatch = docScanBlock.match(/```json\s*([\s\S]*?)```/);
assert.ok(docJsonMatch, 'Phase 4C docs scan block must include a JSON readiness example');
const docContract = JSON.parse(docJsonMatch[1] ?? '{}') as Partial<WorkConsoleServerCollectorReadinessContract>;

const fixture = WORK_CONSOLE_SERVER_COLLECTOR_READINESS_FIXTURE;

const requiredFields: Array<keyof WorkConsoleServerCollectorReadinessContract> = [
  'contractVersion',
  'scope',
  'liveReadEnabled',
  'routeImplemented',
  'serverCollectorApproved',
  'productionLiveApproved',
  'publicAccess',
  'sharedCacheAllowed',
  'rawPayloadAllowed',
  'requiresSeparateUserApproval',
  'ownerProfile',
  'browserSourceMode',
  'allowedSourceKinds',
  'forbiddenSourceKinds',
  'gates',
];

const assertRequiredFields = (label: string, contract: Partial<WorkConsoleServerCollectorReadinessContract>) => {
  for (const field of requiredFields) {
    assert.ok(field in contract, `${label} missing required collector readiness field: ${field}`);
  }
};

const assertDisabledReadiness = (label: string, contract: Partial<WorkConsoleServerCollectorReadinessContract>) => {
  assert.equal(contract.contractVersion, 'work-console-collector-readiness.v1', `${label} unexpected contract version`);
  assert.equal(contract.scope, 'pre-live-local-staging-readiness', `${label} unexpected scope`);
  assert.equal(contract.liveReadEnabled, false, `${label} must keep liveReadEnabled false`);
  assert.equal(contract.routeImplemented, false, `${label} must not implement a route`);
  assert.equal(contract.serverCollectorApproved, false, `${label} must keep serverCollectorApproved false`);
  assert.equal(contract.productionLiveApproved, false, `${label} must keep productionLiveApproved false`);
  assert.equal(contract.publicAccess, false, `${label} must keep publicAccess false`);
  assert.equal(contract.sharedCacheAllowed, false, `${label} must keep sharedCacheAllowed false`);
  assert.equal(contract.rawPayloadAllowed, false, `${label} must keep rawPayloadAllowed false`);
  assert.equal(contract.requiresSeparateUserApproval, true, `${label} must require separate user approval`);
  assert.equal(contract.ownerProfile, 'server', `${label} future owner must remain server profile`);
  assert.equal(contract.browserSourceMode, 'fixture-only', `${label} browser source must remain fixture-only`);
  assert.ok((contract.allowedSourceKinds ?? []).length >= 5, `${label} must include allowed dummy/sanitized source categories`);
  assert.ok((contract.forbiddenSourceKinds ?? []).length >= 8, `${label} must include forbidden source categories`);
  assert.ok((contract.gates ?? []).length >= 2, `${label} must include readiness gates`);
};

assertRequiredFields('fixture', fixture);
assertRequiredFields('docs example', docContract);
assertDisabledReadiness('fixture', fixture);
assertDisabledReadiness('docs example', docContract);
assert.deepEqual(
  docContract,
  fixture,
  'docs scanned readiness contract must be a full mirror of the fixture contract',
);

const requiredGateIds = [
  'traceable-user-approval',
  'server-owned-route-boundary',
  'readonly-permission-proof',
  'allowlist-serializer-proof',
  'safe-error-proof',
  'nostore-freshness-proof',
  'server-kill-switch-proof',
  'safe-observability-proof',
  'rollback-disable-plan',
  'production-connection-approval',
];

const fixtureGateIds = new Set(fixture.gates.map((gate) => gate.id));
const docGateIds = new Set((docContract.gates ?? []).map((gate) => gate.id));
for (const gateId of requiredGateIds) {
  assert.ok(fixtureGateIds.has(gateId), `fixture missing required readiness gate: ${gateId}`);
  assert.ok(docGateIds.has(gateId), `docs scanned example missing required readiness gate: ${gateId}`);
}
assert.deepEqual(
  [...docGateIds].sort(),
  [...fixtureGateIds].sort(),
  'docs scanned readiness gates must mirror fixture readiness gates',
);

for (const gate of fixture.gates) {
  assert.match(gate.id, /^[a-z0-9-]+$/, `gate id must be stable kebab-case: ${gate.id}`);
  assert.ok(gate.label.length > 0 && gate.label.length <= 80, `gate label length invalid: ${gate.id}`);
  assert.ok(gate.requiredEvidence.length > 0 && gate.requiredEvidence.length <= 140, `gate evidence length invalid: ${gate.id}`);
  assert.ok(gate.stopCondition.length > 0 && gate.stopCondition.length <= 160, `gate stopCondition length invalid: ${gate.id}`);
  assert.doesNotMatch(gate.requiredEvidence, /\n/, `gate evidence must be single-line: ${gate.id}`);
  assert.doesNotMatch(gate.stopCondition, /\n/, `gate stopCondition must be single-line: ${gate.id}`);
  assert.notEqual(gate.status, 'passed', `pre-live readiness gates must not be pre-passed: ${gate.id}`);
}

assert.equal(
  fixture.gates.find((gate) => gate.id === 'production-connection-approval')?.status,
  'blocked',
  'production connection approval must remain blocked',
);

const requiredAllowed = [
  'dummy-in-memory-observation',
  'sanitized-safe-component-summary',
  'safe-error-bucket',
  'cache-state-bucket',
  'approval-gate-status',
];
for (const sourceKind of requiredAllowed) {
  assert.ok(fixture.allowedSourceKinds.includes(sourceKind), `missing allowed dummy/sanitized source kind: ${sourceKind}`);
}

const requiredForbidden = [
  'runtime-file-read',
  'scheduler-output-body',
  'gateway-log-read',
  'session-transcript-read',
  'profile-home-path-read',
  'environment-value-read',
  'credential-material-read',
  'database-record-read',
];
for (const sourceKind of requiredForbidden) {
  assert.ok(fixture.forbiddenSourceKinds.includes(sourceKind), `missing forbidden source kind: ${sourceKind}`);
}

const scannedBodies = [
  { label: 'serverCollectorReadinessFixture', body: JSON.stringify(fixture, null, 2) },
  { label: 'phase4cDocsScannedExample', body: docScanBlock },
];

const forbiddenChecks: Array<{ label: string; pattern: RegExp }> = [
  { label: 'host-data-path', pattern: new RegExp('/' + 'opt' + '/' + 'data', 'i') },
  { label: 'home-hermes-path', pattern: /~\/\.hermes|\/home\/[A-Za-z0-9_.-]+\/\.hermes/i },
  { label: 'profile-runtime-path', pattern: new RegExp('/' + 'profiles' + '/', 'i') },
  { label: 'runtime-db-name', pattern: /\bstate\.db\b/i },
  { label: 'authorization-header', pattern: /\bAuthorization\b/i },
  { label: 'bearer-material', pattern: /\bBearer\b/i },
  { label: 'secret-like-key', pattern: /\b(?:api[_-]?key|secret|password|access[_-]?token|refresh[_-]?token|auth[_-]?token)\b/i },
  { label: 'raw-output-field', pattern: /\brawOutput\b|\braw_output\b/i },
  { label: 'raw-log-field', pattern: /\brawLog\b|\braw_log\b/i },
  { label: 'stack-trace-field', pattern: /\bstackTrace\b|\bstack_trace\b|\btraceback\b/i },
  { label: 'raw-cause-field', pattern: /\bcauseRaw\b|\brawCause\b|\braw_cause\b/i },
  { label: 'private-path-field', pattern: /\b(?:absolutePath|filePath|runtimePath|profileHome)\b/i },
  { label: 'private-session-or-message-id', pattern: /\b(?:sessionId|guildId|channelId|messageId|threadId)\b/i },
  { label: 'discord-snowflake-like-id', pattern: /(?<!\d)\d{17,20}(?!\d)/ },
  { label: 'jwt-like', pattern: /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/ },
  { label: 'private-key-block', pattern: /BEGIN\s+(?:RSA\s+|OPENSSH\s+|EC\s+)?PRIVATE\s+KEY/i },
];

const findings: string[] = [];
for (const scanned of scannedBodies) {
  for (const check of forbiddenChecks) {
    if (check.pattern.test(scanned.body)) findings.push(`${check.label}: ${scanned.label}`);
  }
}

assert.deepEqual(findings, [], `forbidden Phase 4C collector readiness patterns:\n${findings.join('\n')}`);

console.log('Work Console Phase 4C server collector readiness verification passed');
