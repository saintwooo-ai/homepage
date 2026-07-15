/**
 * S15 Work Console local/staging spike scope verification.
 *
 * This verifier checks only a fixture-only scope lock and its marked
 * documentation JSON block. It does not validate or execute any live runtime
 * source, server route, gateway, scheduler, database, filesystem, or
 * environment/secret reader.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  WORK_CONSOLE_LOCAL_SPIKE_SCOPE_FIXTURE,
  type WorkConsoleLocalSpikeScopeDecision,
} from '../src/data/work-console/localSpikeScopeFixture';

const docPath = 'docs/work-console-s15-local-staging-spike-design-review.md';
const docBody = readFileSync(docPath, 'utf8');
const scanBlockMatch = docBody.match(
  /<!-- work-console-local-spike-scope:start -->([\s\S]*?)<!-- work-console-local-spike-scope:end -->/,
);
assert.ok(scanBlockMatch, 'S15 docs must include a marked local spike scope scan block');
const docScanBlock = scanBlockMatch[1] ?? '';
const docJsonMatch = docScanBlock.match(/```json\s*([\s\S]*?)```/);
assert.ok(docJsonMatch, 'S15 docs scan block must include a JSON scope decision');
const docDecision = JSON.parse(docJsonMatch[1] ?? '{}') as Partial<WorkConsoleLocalSpikeScopeDecision>;
const fixture = WORK_CONSOLE_LOCAL_SPIKE_SCOPE_FIXTURE;

assert.deepEqual(
  docDecision,
  fixture,
  'S15 docs scanned scope decision must be a full mirror of the fixture',
);

const requiredFalseFields: Array<keyof WorkConsoleLocalSpikeScopeDecision> = [
  'liveReadEnabled',
  'routeImplemented',
  'serverCollectorImplemented',
  'apiRouteImplemented',
  'stagingRuntimeSourceApproved',
  'productionLiveApproved',
  'envSecretAccessApproved',
  'filesystemReadApproved',
  'gatewayReadApproved',
  'schedulerReadApproved',
  'sessionDatabaseReadApproved',
];

for (const field of requiredFalseFields) {
  assert.equal(fixture[field], false, `S15 scope must keep ${field} false`);
}

const requiredTrueFields: Array<keyof WorkConsoleLocalSpikeScopeDecision> = [
  'fixtureOnly',
  'dummyOnly',
  'readOnly',
  'requiresSeparateStage4Approval',
  'requiresSeparateProductionApproval',
  'verifierPassDoesNotApproveLiveConnection',
];

for (const field of requiredTrueFields) {
  assert.equal(fixture[field], true, `S15 scope must keep ${field} true`);
}

assert.equal(fixture.contractVersion, 'work-console-local-spike-scope.v1');
assert.equal(fixture.scope, 's15-local-only-design-review');
assert.equal(fixture.nextGoal, 's16-stage1-dummy-approval-packet');

const requiredAllowedWork = [
  'docs-only-scope-lock',
  'fixture-only-contract',
  'scanned-json-deep-equality',
  'verifier-only-guardrails',
  'dummy-sanitized-source-categories',
  'build-gate-integration',
];
for (const item of requiredAllowedWork) {
  assert.ok(fixture.allowedS15Work.includes(item), `S15 allowed work missing: ${item}`);
}

const requiredDeferredWork = [
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
];
for (const item of requiredDeferredWork) {
  assert.ok(fixture.deferredWork.includes(item), `S15 deferred work missing: ${item}`);
}

assert.ok(
  /does \*\*not\*\* approve a server collector, API route, local runtime source read, staging source read, or production live data connection/i.test(
    docBody,
  ),
  'S15 docs must state that verifier pass does not approve live/server/API/source connection',
);

const scannedBodies = [
  { label: 'localSpikeScopeFixture', body: JSON.stringify(fixture, null, 2) },
  { label: 's15DocsScannedExample', body: docScanBlock },
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

assert.deepEqual(findings, [], `forbidden S15 local spike scope patterns:\n${findings.join('\n')}`);

console.log('Work Console S15 local spike scope verification passed');
