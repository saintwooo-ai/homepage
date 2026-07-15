/**
 * S16 Work Console dummy-only approval evidence verification.
 *
 * This verifier checks only a dummy evidence packet fixture and the marked
 * documentation JSON block. It does not validate or execute any live runtime
 * source, server route, gateway, scheduler, database, filesystem, browser UI,
 * or environment/secret reader.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  WORK_CONSOLE_DUMMY_APPROVAL_EVIDENCE_PACKET,
  type WorkConsoleDummyApprovalEvidencePacket,
} from '../src/data/work-console/dummyApprovalEvidenceFixture';

const docPath = 'docs/work-console-s16-dummy-approval-evidence.md';
const docBody = readFileSync(docPath, 'utf8');
const scanBlockMatch = docBody.match(
  /<!-- work-console-dummy-approval-evidence:start -->([\s\S]*?)<!-- work-console-dummy-approval-evidence:end -->/,
);
assert.ok(scanBlockMatch, 'S16 docs must include a marked dummy approval evidence scan block');
const docScanBlock = scanBlockMatch[1] ?? '';
const docJsonMatch = docScanBlock.match(/```json\s*([\s\S]*?)```/);
assert.ok(docJsonMatch, 'S16 docs scan block must include a JSON evidence packet');
const docPacket = JSON.parse(docJsonMatch[1] ?? '{}') as Partial<WorkConsoleDummyApprovalEvidencePacket>;
const fixture = WORK_CONSOLE_DUMMY_APPROVAL_EVIDENCE_PACKET;

assert.deepEqual(
  docPacket,
  fixture,
  'S16 docs scanned evidence packet must be a full mirror of the fixture',
);

const requiredFalseFields: Array<keyof WorkConsoleDummyApprovalEvidencePacket> = [
  'liveReadEnabled',
  'stage4Approved',
  'localRuntimeSourceApproved',
  'stagingRuntimeSourceApproved',
  'productionLiveApproved',
  'apiRouteImplemented',
  'serverCollectorImplemented',
  'envSecretAccessApproved',
  'filesystemReadApproved',
  'gatewayReadApproved',
  'schedulerReadApproved',
  'sessionDatabaseReadApproved',
  'rawEvidenceAllowed',
  'browserDisplayAllowed',
];

for (const field of requiredFalseFields) {
  assert.equal(fixture[field], false, `S16 evidence packet must keep ${field} false`);
}

const requiredTrueFields: Array<keyof WorkConsoleDummyApprovalEvidencePacket> = [
  'fixtureOnly',
  'dummyOnly',
];

for (const field of requiredTrueFields) {
  assert.equal(fixture[field], true, `S16 evidence packet must keep ${field} true`);
}

assert.equal(fixture.contractVersion, 'work-console-dummy-approval-evidence.v1');
assert.equal(fixture.stage, 's16-stage1-dummy-only-approval-packet');
assert.equal(fixture.approvalMeaning, 'evidence-schema-only-not-runtime-approval');
assert.equal(fixture.nextGoal, 's17-dummy-evidence-ui-preview-or-stage4-review-packet');

const requiredFutureApprovals = [
  'traceable-user-approval-for-stage4-local-only-scope',
  'server-profile-signoff-before-any-runtime-source-read',
  'checker-green-before-any-staging-source-read',
  'separate-production-live-connection-approval',
  'rollback-and-kill-switch-plan-before-runtime-source-read',
];
for (const item of requiredFutureApprovals) {
  assert.ok(fixture.requiredFutureApprovals.includes(item), `S16 future approval missing: ${item}`);
}

const requiredEvidenceChecks = [
  'dummy-source-boundary',
  'no-runtime-reader',
  'no-browser-display',
  'negative-drift-required',
];
for (const id of requiredEvidenceChecks) {
  const check = fixture.evidenceChecks.find((item) => item.id === id);
  assert.ok(check, `S16 evidence check missing: ${id}`);
  assert.equal(check.status, 'pass', `S16 evidence check must pass: ${id}`);
  assert.ok(check.safeSummary.length > 10, `S16 evidence check needs a safe summary: ${id}`);
}

const requiredBlockers = [
  'block-if-real-source-access-is-required',
  'block-if-raw-evidence-is-requested',
  'block-if-private-path-or-id-is-needed',
  'block-if-env-secret-or-credential-is-needed',
  'block-if-api-route-or-server-collector-is-needed',
  'block-if-stage4-or-production-approval-is-implied',
  'block-if-browser-display-of-evidence-is-requested',
];
for (const item of requiredBlockers) {
  assert.ok(fixture.blockerConditions.includes(item), `S16 blocker condition missing: ${item}`);
}

assert.ok(
  /does \*\*not\*\* approve Stage 4, server collector implementation, API route implementation, local runtime source read, staging source read, browser evidence display, or production live data connection/i.test(
    docBody,
  ),
  'S16 docs must state that verifier pass does not approve Stage 4/live/server/API/source/UI connection',
);

const scannedBodies = [
  { label: 'dummyApprovalEvidenceFixture', body: JSON.stringify(fixture, null, 2) },
  { label: 's16DocsScannedExample', body: docScanBlock },
];

const forbiddenChecks: Array<{ label: string; pattern: RegExp }> = [
  { label: 'host-data-path', pattern: new RegExp('/' + 'opt' + '/' + 'data', 'i') },
  { label: 'home-hermes-path', pattern: /~\/\.hermes|\/home\/[A-Za-z0-9_.-]+\/\.hermes/i },
  { label: 'profile-runtime-path', pattern: new RegExp('/' + 'profiles' + '/', 'i') },
  { label: 'runtime-db-name', pattern: /\bstate\.db\b/i },
  { label: 'authorization-header', pattern: /\bAuthorization\b/i },
  { label: 'bearer-material', pattern: /\bBearer\b/i },
  { label: 'secret-like-key', pattern: /\b(?:api[_-]?key|password|access[_-]?token|refresh[_-]?token|auth[_-]?token)\b/i },
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

assert.deepEqual(findings, [], `forbidden S16 dummy approval evidence patterns:\n${findings.join('\n')}`);

console.log('Work Console S16 dummy approval evidence verification passed');
