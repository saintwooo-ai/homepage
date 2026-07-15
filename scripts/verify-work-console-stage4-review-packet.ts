/**
 * S17 Work Console Stage 4 review packet verification.
 *
 * This verifier checks only a checklist fixture and its marked documentation
 * JSON block. It does not approve or execute Stage 4, runtime reads, server
 * routes, collectors, browser display, environment/secret access, or restarts.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  WORK_CONSOLE_STAGE4_REVIEW_PACKET,
  type WorkConsoleStage4ReviewPacket,
} from '../src/data/work-console/stage4ReviewPacketFixture';

const docPath = 'docs/work-console-s17-stage4-review-packet.md';
const docBody = readFileSync(docPath, 'utf8');
const scanBlockMatch = docBody.match(
  /<!-- work-console-stage4-review-packet:start -->([\s\S]*?)<!-- work-console-stage4-review-packet:end -->/,
);
assert.ok(scanBlockMatch, 'S17 docs must include a marked Stage 4 review packet scan block');
const docScanBlock = scanBlockMatch[1] ?? '';
const docJsonMatch = docScanBlock.match(/```json\s*([\s\S]*?)```/);
assert.ok(docJsonMatch, 'S17 docs scan block must include a JSON review packet');
const docPacket = JSON.parse(docJsonMatch[1] ?? '{}') as Partial<WorkConsoleStage4ReviewPacket>;
const fixture = WORK_CONSOLE_STAGE4_REVIEW_PACKET;

assert.deepEqual(
  docPacket,
  fixture,
  'S17 docs scanned review packet must be a full mirror of the fixture',
);

const requiredFalseFields: Array<keyof WorkConsoleStage4ReviewPacket> = [
  'liveReadEnabled',
  'stage4Approved',
  'localRuntimeSourceApproved',
  'stagingRuntimeSourceApproved',
  'productionLiveApproved',
  'apiRouteImplemented',
  'serverCollectorImplemented',
  'browserDisplayApproved',
  'envSecretAccessApproved',
  'filesystemReadApproved',
  'gatewayReadApproved',
  'schedulerReadApproved',
  'sessionDatabaseReadApproved',
];
for (const field of requiredFalseFields) {
  assert.equal(fixture[field], false, `S17 review packet must keep ${field} false`);
}

const requiredTrueFields: Array<keyof WorkConsoleStage4ReviewPacket> = [
  'checklistOnly',
  'fixtureOnly',
  'requiresFreshUserApproval',
  'requiresServerSignoff',
  'requiresCheckerGreen',
  'requiresRollbackPlan',
  'requiresKillSwitchPlan',
];
for (const field of requiredTrueFields) {
  assert.equal(fixture[field], true, `S17 review packet must keep ${field} true`);
}

assert.equal(fixture.contractVersion, 'work-console-stage4-review-packet.v1');
assert.equal(fixture.stage, 's17-stage4-review-packet-checklist');
assert.equal(fixture.nextGoal, 's18-stage4-local-only-approval-decision-or-dummy-ui-preview');

const requiredGates = [
  'fresh-user-approval',
  'server-runtime-boundary-signoff',
  'checker-risk-review',
  'rollback-and-kill-switch-plan',
  'staging-and-production-separated',
];
assert.equal(
  fixture.gates.length,
  requiredGates.length,
  'S17 review packet must not include extra gates outside the required checklist',
);

for (const gate of fixture.gates) {
  assert.ok(requiredGates.includes(gate.id), `S17 review gate is not in the required checklist: ${gate.id}`);
  assert.equal(
    gate.status,
    'required-not-yet-approved',
    `S17 review gate must remain unapproved: ${gate.id}`,
  );
  assert.ok(gate.safeSummary.length > 20, `S17 review gate needs a safe summary: ${gate.id}`);
}

for (const gateId of requiredGates) {
  assert.ok(fixture.gates.some((item) => item.id === gateId), `S17 review gate missing: ${gateId}`);
}

const requiredNonApprovals = [
  'no-stage4-execution-approval',
  'no-local-runtime-source-read-approval',
  'no-staging-source-read-approval',
  'no-production-live-data-approval',
  'no-api-route-implementation-approval',
  'no-server-collector-implementation-approval',
  'no-browser-display-approval',
  'no-env-secret-filesystem-gateway-scheduler-session-database-access-approval',
  'no-vps-docker-gateway-cron-server-restart-approval',
];
for (const item of requiredNonApprovals) {
  assert.ok(fixture.explicitNonApprovals.includes(item), `S17 non-approval missing: ${item}`);
}

assert.ok(
  /does \*\*not\*\* approve Stage 4 execution, local runtime source reads, staging source reads, production live data, API routes, server collectors, browser display, env\/secret\/filesystem\/gateway\/scheduler\/session\/database access, or server restarts/i.test(
    docBody,
  ),
  'S17 docs must state that verifier pass does not approve Stage 4/live/server/API/source/UI/env/restart connection',
);

const scannedBodies = [
  { label: 'stage4ReviewPacketFixture', body: JSON.stringify(fixture, null, 2) },
  { label: 's17DocsScannedExample', body: docScanBlock },
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
assert.deepEqual(findings, [], `forbidden S17 review packet patterns:\n${findings.join('\n')}`);

console.log('Work Console S17 Stage 4 review packet verification passed');
