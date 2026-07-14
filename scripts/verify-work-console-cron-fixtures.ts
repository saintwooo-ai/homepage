/**
 * Phase 3C-1 fixture-only verification for Work Console cron output summaries.
 * This script uses in-memory fixtures only. It must not read real cron output,
 * env files, databases, APIs, websockets, gateway logs, or Hermes sessions.
 */

import assert from 'node:assert/strict';
import type { WorkConsoleJobOutputFixture } from '../src/types/workConsole';
import { buildSafeCronSummary, summarizeCronJobOutputFixtures } from '../src/data/work-console';

const now = '2026-07-14T12:00:00.000Z';

const fixtures: WorkConsoleJobOutputFixture[] = [
  {
    jobId: 'fixture-newsletter-job',
    jobName: 'Fixture Newsletter Job',
    jobState: 'scheduled',
    enabled: true,
    scheduleLabel: '0 9 * * *',
    owner: 'work-console-fixture',
    domain: 'newsletter',
    lastRunAt: '2026-07-14T09:00:00.000Z',
    nextRunAt: '2026-07-15T09:00:00.000Z',
    lastStatus: 'ok',
    outputCreatedAt: '2026-07-14T09:05:00.000Z',
    sourcePathKind: 'fixture',
    outputText: [
      '# Cron Job: Fixture Newsletter Job',
      '**Job ID:** fixture-newsletter-job',
      'Summary: generated safely for Work Console.',
      'token=fixture-secret-value should not appear.',
      'Path /Users/example/.hermes/.env should not appear.',
      'Contact test@example.com should not appear.',
      'Phone 010-1234-5678 should not appear.',
      'thread: 1526570975141826681 should not appear.',
      'Webhook https://example.com/webhook/abc should not appear.',
    ].join('\n'),
  },
  {
    jobId: 'fixture-stale-job',
    jobName: 'Fixture Stale Job',
    jobState: 'paused',
    enabled: false,
    scheduleLabel: '0 18 * * 5',
    owner: 'work-console-fixture',
    domain: 'operations',
    lastStatus: 'unknown',
    outputCreatedAt: '2026-07-01T18:00:00.000Z',
    sourcePathKind: 'fixture',
    outputText: 'Older output without sensitive terms.',
  },
  {
    jobId: 'fixture-missing-output-job',
    jobName: 'Fixture Missing Output Job',
    jobState: 'scheduled',
    enabled: true,
    scheduleLabel: 'every 1m',
    owner: 'work-console-fixture',
    domain: 'qa',
    lastStatus: 'error',
    sourcePathKind: 'fixture',
    outputText: '',
  },
  {
    jobId: 'fixture-finance-job',
    jobName: 'Fixture Finance Job',
    jobState: 'scheduled',
    enabled: true,
    scheduleLabel: '0 7 * * *',
    owner: 'work-console-fixture',
    domain: 'finance',
    lastStatus: 'ok',
    outputCreatedAt: '2026-07-14T07:00:00.000Z',
    sourcePathKind: 'fixture',
    outputText: 'Domain policy fixture.',
  },
  {
    jobId: 'fixture-unknown-owner-job',
    jobName: 'Fixture Unknown Owner Job',
    jobState: 'scheduled',
    enabled: true,
    scheduleLabel: '0 11 * * *',
    owner: 'unregistered-owner',
    domain: 'operations',
    lastStatus: 'ok',
    outputCreatedAt: '2026-07-14T11:00:00.000Z',
    sourcePathKind: 'fixture',
    outputText: 'Owner policy fixture.',
  },
  {
    jobId: 'job-/opt/data/profiles/router/cron/output/1234567890123',
    jobName: 'Token token=metadata-secret for test@example.com',
    jobState: 'paused',
    enabled: false,
    scheduleLabel: 'Bearer metadata-secret',
    owner: '010-1234-5678',
    domain: 'telegram 1526570975141826681',
    pausedReason: 'Webhook https://example.com/webhook/metadata and .env',
    lastStatus: 'unknown',
    outputCreatedAt: '2026-07-14T08:00:00.000Z',
    sourcePathKind: 'fixture',
    outputText: 'Metadata policy fixture.',
  },
];

const summaries = summarizeCronJobOutputFixtures(fixtures, { now, freshWithinHours: 24 });

assert.equal(summaries.length, 6);
assert.equal(summaries[0].freshness, 'fresh');
assert.equal(summaries[1].freshness, 'stale');
assert.equal(summaries[2].freshness, 'missing');
assert.equal(summaries[0].sourcePathKind, 'fixture');
assert.equal(summaries[0].outputCount, 1);
assert.equal(summaries[0].latestOutputSizeBytes, new TextEncoder().encode(fixtures[0].outputText).length);
assert.equal(summaries[2].outputCount, 0);
assert.equal(summaries[0].visibility, 'visible');
assert.equal(summaries[3].domainPolicy, 'denied');
assert.equal(summaries[3].visibility, 'hidden');
assert.equal(summaries[3].policyReasons.includes('sensitive_domain_hidden'), true);
assert.equal(summaries[3].jobId, 'hidden-job');
assert.equal(summaries[3].jobName, 'Hidden cron job');
assert.equal(summaries[3].scheduleLabel, 'schedule hidden');
assert.equal(summaries[3].latestOutputSizeBytes, 0);
assert.equal(summaries[3].outputCount, 0);
assert.equal(summaries[3].safeSummary, 'Hidden by policy.');
assert.equal(summaries[3].riskFlags.includes('hidden_by_policy'), true);
assert.equal(summaries[4].ownerPolicy, 'unknown');
assert.equal(summaries[4].visibility, 'hidden');
assert.equal(summaries[4].policyReasons.includes('unknown_owner_hidden'), true);
assert.equal(summaries[5].visibility, 'hidden');
assert.equal(summaries[5].redactionCount >= 6, true);

const sensitiveNeedles = [
  'Summary: generated safely for Work Console.',
  'fixture-secret-value',
  '/opt/data',
  '.env',
  'test@example.com',
  '010-1234-5678',
  '1526570975141826681',
  'https://example.com/webhook/abc',
];

for (const needle of sensitiveNeedles) {
  assert.equal(summaries[0].safeSummary.includes(needle), false, `safeSummary copied or leaked ${needle}`);
}

for (const expectedFlag of ['email', 'external_callback_url', 'local_path', 'phone', 'platform_id', 'secret_like_keyword']) {
  assert.equal(summaries[0].riskFlags.includes(expectedFlag), true, `missing risk flag ${expectedFlag}`);
}

assert.equal(summaries[0].redactionCount >= 6, true);

const jwtFixture = ['e' + 'yJhbGciOiJIUzI1NiJ9', 'e' + 'yJzdWIiOiJmaXh0dXJlIn0', 'signature123'].join('.');

const redactionCases = [
  {
    label: 'authorization bearer header',
    input: `Authorization: Bearer ${'live-secret-token-abc123'}`,
    leaks: ['live-secret-token-abc123', 'Authorization: Bearer'],
    flags: ['secret_like_keyword'],
  },
  {
    label: 'bare bearer token',
    input: 'Bearer live-bearer-secret-xyz789',
    leaks: ['live-bearer-secret-xyz789', 'Bearer live-bearer-secret-xyz789'],
    flags: ['secret_like_keyword'],
  },
  {
    label: 'phone',
    input: 'Phone 010-1234-5678',
    leaks: ['010-1234-5678'],
    flags: ['phone'],
  },
  {
    label: 'email',
    input: 'Contact test@example.com',
    leaks: ['test@example.com'],
    flags: ['email'],
  },
  {
    label: 'local path',
    input: 'Path /home/example/profiles/router/cron/output/demo.md',
    leaks: ['/home/example', 'profiles/router/cron/output'],
    flags: ['local_path'],
  },
  {
    label: 'webhook',
    input: 'Webhook https://example.com/webhook/abc',
    leaks: ['https://example.com/webhook/abc', 'webhook/abc'],
    flags: ['external_callback_url'],
  },
  {
    label: 'long numeric id',
    input: 'Run id 1526570975141826681',
    leaks: ['1526570975141826681'],
    flags: ['long_numeric_id'],
  },
  {
    label: 'platform id',
    input: 'thread: 1526570975141826681',
    leaks: ['1526570975141826681'],
    flags: ['platform_id'],
  },
  {
    label: 'query token',
    input: 'Callback https://example.com/callback?token=query-secret-value&ok=true',
    leaks: ['query-secret-value'],
    flags: ['query_token'],
  },
  {
    label: 'jwt',
    input: `JWT ${jwtFixture}`,
    leaks: [jwtFixture],
    flags: ['jwt'],
  },
];

for (const testCase of redactionCases) {
  const directSummary = buildSafeCronSummary(testCase.input);
  for (const leak of testCase.leaks) {
    assert.equal(directSummary.safeText.includes(leak), false, `${testCase.label} leaked ${leak}`);
  }
  for (const flag of testCase.flags) {
    assert.equal(directSummary.riskFlags.includes(flag), true, `${testCase.label} missing ${flag}`);
  }
}

const snapshotJson = JSON.stringify(summaries);
const forbiddenSnapshotPatterns = [
  /\/opt\/data\/profiles/i,
  /\.env/i,
  /Bearer/i,
  /token=/i,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /(?:\+?82[-\s]?)?0?1[016789][-\s]?\d{3,4}[-\s]?\d{4}/,
  /webhook/i,
  /\b\d{12,}\b/,
];

for (const pattern of forbiddenSnapshotPatterns) {
  assert.equal(pattern.test(snapshotJson), false, `snapshot leaked ${pattern}`);
}

console.log('Work Console Phase 3C-1 fixture verification passed');
