/**
 * Phase 3B fixture-only verification for Work Console cron output summaries.
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
    lastStatus: 'error',
    sourcePathKind: 'fixture',
    outputText: '',
  },
];

const summaries = summarizeCronJobOutputFixtures(fixtures, { now, freshWithinHours: 24 });

assert.equal(summaries.length, 3);
assert.equal(summaries[0].freshness, 'fresh');
assert.equal(summaries[1].freshness, 'stale');
assert.equal(summaries[2].freshness, 'missing');
assert.equal(summaries[0].sourcePathKind, 'fixture');
assert.equal(summaries[0].outputCount, 1);
assert.equal(summaries[2].outputCount, 0);

const sensitiveNeedles = [
  'fixture-secret-value',
  '/opt/data',
  '.env',
  'test@example.com',
  '1526570975141826681',
  'https://example.com/webhook/abc',
];

for (const needle of sensitiveNeedles) {
  assert.equal(summaries[0].safeSummary.includes(needle), false, `safeSummary leaked ${needle}`);
}

for (const expectedFlag of ['email', 'local_path', 'platform_id', 'secret_like_keyword', 'webhook']) {
  assert.equal(summaries[0].riskFlags.includes(expectedFlag), true, `missing risk flag ${expectedFlag}`);
}

assert.equal(summaries[0].redactionCount >= 5, true);

const redactionCases = [
  {
    label: 'bearer token',
    input: 'Authorization: Bearer abc.def.ghi',
    leaks: ['abc.def.ghi'],
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
    leaks: ['https://example.com/webhook/abc'],
    flags: ['webhook'],
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
    input: 'JWT eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature123',
    leaks: ['eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature123'],
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

console.log('Work Console Phase 3B fixture verification passed');
