/**
 * Phase 4B Work Console snapshot policy verification.
 * Checks only the dummy policy fixture and the marked documentation example.
 * It does not validate a live collector or server route.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WORK_CONSOLE_PHASE4B_SERVER_SNAPSHOT_POLICY_FIXTURE } from '../src/data/work-console/serverSnapshotPolicyFixture';
import type { WorkConsoleServerSnapshotPolicyEnvelope } from '../src/types/workConsole';

const docPath = 'docs/work-console-phase4b-design.md';
const docBody = readFileSync(docPath, 'utf8');
const scanBlockMatch = docBody.match(/<!-- work-console-phase4b-policy-scan:start -->([\s\S]*?)<!-- work-console-phase4b-policy-scan:end -->/);
assert.ok(scanBlockMatch, 'Phase 4B docs must include a marked policy scan block');
const docScanBlock = scanBlockMatch[1] ?? '';
const docJsonMatch = docScanBlock.match(/```json\s*([\s\S]*?)```/);
assert.ok(docJsonMatch, 'Phase 4B docs scan block must include a JSON policy example');
const docEnvelope = JSON.parse(docJsonMatch[1] ?? '{}') as Partial<WorkConsoleServerSnapshotPolicyEnvelope>;

const fixture = WORK_CONSOLE_PHASE4B_SERVER_SNAPSHOT_POLICY_FIXTURE;

const requiredFields: Array<keyof WorkConsoleServerSnapshotPolicyEnvelope> = [
  'apiVersion',
  'audience',
  'collectorState',
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
  'endpointPolicy',
  'freshnessPolicy',
  'killSwitch',
  'safeComponents',
  'errors',
  'approvalGates',
];

const assertRequiredFields = (label: string, envelope: Partial<WorkConsoleServerSnapshotPolicyEnvelope>) => {
  for (const field of requiredFields) {
    assert.ok(field in envelope, `${label} missing required Phase 4B policy field: ${field}`);
  }
};

assertRequiredFields('fixture', fixture);
assertRequiredFields('docs example', docEnvelope);

const assertDisabledPolicy = (label: string, envelope: Partial<WorkConsoleServerSnapshotPolicyEnvelope>) => {
  assert.equal(envelope.apiVersion, 'work-console-snapshot.v1', `${label} must use expected API version`);
  assert.equal(envelope.audience, 'admin-internal', `${label} must remain admin-internal`);
  assert.equal(envelope.collectorState, 'disabled', `${label} collector must remain disabled`);
  assert.equal(envelope.sourceMode, 'server-snapshot-disabled', `${label} must remain disabled`);
  assert.equal(envelope.cacheState, 'disabled', `${label} must remain disabled cache state`);
  assert.equal(envelope.readOnly, true, `${label} must be read-only`);
  assert.equal(envelope.liveReadEnabled, false, `${label} must not enable live reads`);
  assert.equal(envelope.productionLiveApproved, false, `${label} must not approve production live data`);
  assert.equal(envelope.serverCollectorApproved, false, `${label} must not approve server collector`);
  assert.equal(envelope.privateIdsRedacted, true, `${label} must mark private IDs redacted`);
  assert.equal(envelope.rawLogsIncluded, false, `${label} must not include raw logs`);
  assert.equal(envelope.rawRuntimeOutputIncluded, false, `${label} must not include raw runtime output`);
  assert.equal(envelope.endpointPolicy?.routeImplemented, false, `${label} must not implement route`);
  assert.equal(envelope.endpointPolicy?.adminOnly, true, `${label} must require admin boundary`);
  assert.equal(envelope.endpointPolicy?.publicAccess, false, `${label} must not allow public access`);
  assert.equal(envelope.endpointPolicy?.cacheHeader, 'no-store', `${label} must require no-store cache policy`);
  assert.equal(envelope.freshnessPolicy?.allowSharedCache, false, `${label} must not allow shared cache`);
  assert.equal(envelope.killSwitch?.state, 'forced_disabled', `${label} kill switch must remain forced disabled`);
  assert.equal(envelope.killSwitch?.serverSideRequired, true, `${label} must require server-side kill switch`);
  assert.equal(envelope.killSwitch?.clientFallbackOnly, true, `${label} must treat client fallback as display-only`);
  assert.ok((envelope.safeComponents?.length ?? 0) > 0, `${label} must include safe components`);
  assert.ok((envelope.approvalGates?.length ?? 0) > 0, `${label} must include approval gates`);
};

assertDisabledPolicy('fixture', fixture);
assertDisabledPolicy('docs example', docEnvelope);

const scannedBodies = [
  { label: 'serverSnapshotPolicyFixture', body: JSON.stringify(fixture, null, 2) },
  { label: 'phase4bDocsScannedExample', body: docScanBlock },
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

assert.deepEqual(findings, [], `forbidden Phase 4B snapshot policy patterns:\n${findings.join('\n')}`);

const assertSafeShapeDetails = (label: string, envelope: Partial<WorkConsoleServerSnapshotPolicyEnvelope>) => {
  for (const component of envelope.safeComponents ?? []) {
    assert.match(component.componentRef, /^demo-component-[a-z]$/, `${label} componentRef must be dummy-only: ${component.componentRef}`);
    assert.ok(component.safeMessage.length <= 140, `${label} safeMessage too long for ${component.componentRef}`);
    assert.doesNotMatch(component.safeMessage, /\n/, `${label} safeMessage must be single-line for ${component.componentRef}`);
  }

  for (const error of envelope.errors ?? []) {
    assert.match(error.code, /^[A-Z0-9_]+$/, `${label} safe error code must be uppercase bucket: ${error.code}`);
    assert.ok(error.safeMessage.length <= 140, `${label} safe error message too long for ${error.code}`);
    assert.doesNotMatch(error.safeMessage, /\n/, `${label} safe error message must be single-line for ${error.code}`);
  }

  for (const gate of envelope.approvalGates ?? []) {
    assert.notEqual(gate.status, 'passed', `${label} Phase 4B pre-implementation gates must not be pre-passed: ${gate.id}`);
  }
};

assertSafeShapeDetails('fixture', fixture);
assertSafeShapeDetails('docs example', docEnvelope);

console.log('Work Console Phase 4B snapshot policy verification passed');
