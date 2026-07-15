/**
 * Phase 4A Work Console server handoff contract verification.
 * This verifier checks only the dummy contract fixture and the marked safe
 * documentation example. It does not validate any live runtime source.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WORK_CONSOLE_PHASE4A_SERVER_HANDOFF_FIXTURE } from '../src/data/work-console/serverHandoffContractFixture';
import type { WorkConsoleServerSnapshotEnvelope } from '../src/types/workConsole';

const docPath = 'docs/work-console-phase4a-server-handoff-contract.md';
const docBody = readFileSync(docPath, 'utf8');
const scanBlockMatch = docBody.match(/<!-- work-console-contract-scan:start -->([\s\S]*?)<!-- work-console-contract-scan:end -->/);
assert.ok(scanBlockMatch, 'Phase 4A docs must include a marked contract scan block');
const docScanBlock = scanBlockMatch[1] ?? '';
const docJsonMatch = docScanBlock.match(/```json\s*([\s\S]*?)```/);
assert.ok(docJsonMatch, 'Phase 4A docs scan block must include a JSON envelope example');
const docEnvelope = JSON.parse(docJsonMatch[1] ?? '{}') as Partial<WorkConsoleServerSnapshotEnvelope>;

const requiredFields: Array<keyof WorkConsoleServerSnapshotEnvelope> = [
  'apiVersion',
  'sourceMode',
  'cacheState',
  'generatedAt',
  'staleAfter',
  'expiresAt',
  'readOnly',
  'liveReadEnabled',
  'productionLiveApproved',
  'serverCollectorApproved',
  'privateIdsRedacted',
  'rawLogsIncluded',
  'rawRuntimeOutputIncluded',
  'safeComponents',
  'errors',
  'approvalGates',
];

const fixture = WORK_CONSOLE_PHASE4A_SERVER_HANDOFF_FIXTURE;

const assertRequiredEnvelopeFields = (label: string, envelope: Partial<WorkConsoleServerSnapshotEnvelope>) => {
  for (const field of requiredFields) {
    assert.ok(field in envelope, `${label} missing required server handoff envelope field: ${field}`);
  }
};

assertRequiredEnvelopeFields('fixture', fixture);
assertRequiredEnvelopeFields('docs example', docEnvelope);

assert.equal(fixture.apiVersion, 'work-console-snapshot.v1', 'unexpected snapshot API version');
assert.equal(fixture.sourceMode, 'fixture-only', 'Phase 4A fixture must remain fixture-only');
assert.equal(fixture.cacheState, 'disabled', 'Phase 4A fixture must remain disabled');
assert.equal(fixture.readOnly, true, 'snapshot contract must be read-only');
assert.equal(fixture.liveReadEnabled, false, 'Phase 4A must not enable live reads');
assert.equal(fixture.productionLiveApproved, false, 'production live approval must remain false');
assert.equal(fixture.serverCollectorApproved, false, 'server collector approval must remain false');
assert.equal(fixture.privateIdsRedacted, true, 'private IDs must be marked redacted');
assert.equal(fixture.rawLogsIncluded, false, 'raw logs must not be included');
assert.equal(fixture.rawRuntimeOutputIncluded, false, 'raw runtime output must not be included');
assert.ok(fixture.safeComponents.length > 0, 'fixture must include at least one safe component summary');
assert.ok(fixture.approvalGates.length > 0, 'fixture must include approval gates');

const scannedBodies = [
  { label: 'serverHandoffContractFixture', body: JSON.stringify(fixture, null, 2) },
  { label: 'phase4aDocsScannedExample', body: docScanBlock },
];

const forbiddenChecks: Array<{ label: string; pattern: RegExp }> = [
  { label: 'host-data-path', pattern: new RegExp('/' + 'opt' + '/' + 'data', 'i') },
  { label: 'home-hermes-path', pattern: /~\/\.hermes|\/home\/[A-Za-z0-9_.-]+\/\.hermes/i },
  { label: 'profile-runtime-path', pattern: new RegExp('/' + 'profiles' + '/', 'i') },
  { label: 'runtime-db-name', pattern: /\bstate\.db\b/i },
  { label: 'cron-output-or-log-path', pattern: /\bcron[\s/_-]*(?:output|log)\b/i },
  { label: 'gateway-log-path', pattern: /\bgateway[\s/_-]*log\b/i },
  { label: 'authorization-header', pattern: /\bAuthorization\b/i },
  { label: 'bearer-material', pattern: /\bBearer\b/i },
  { label: 'secret-like-key', pattern: /\b(?:api[_-]?key|secret|password|access[_-]?token|refresh[_-]?token)\b/i },
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

assert.deepEqual(findings, [], `forbidden Phase 4A server handoff contract patterns:\n${findings.join('\n')}`);

for (const component of fixture.safeComponents) {
  assert.match(component.componentRef, /^demo-component-[a-z]$/, `componentRef must be dummy-only: ${component.componentRef}`);
  assert.ok(component.safeMessage.length <= 140, `safeMessage too long for ${component.componentRef}`);
  assert.doesNotMatch(component.safeMessage, /\n/, `safeMessage must be single-line for ${component.componentRef}`);
}

for (const error of fixture.errors) {
  assert.match(error.code, /^[A-Z0-9_]+$/, `safe error code must be uppercase bucket: ${error.code}`);
  assert.ok(error.safeMessage.length <= 140, `safe error message too long for ${error.code}`);
  assert.doesNotMatch(error.safeMessage, /\n/, `safe error message must be single-line for ${error.code}`);
}

console.log('Work Console Phase 4A server handoff contract verification passed');
