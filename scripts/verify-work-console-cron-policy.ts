/**
 * Phase 3C-1 fixture-only policy verification.
 * In-memory policy checks only; no filesystem, env, cron, gateway, or live data access.
 */

import assert from 'node:assert/strict';
import {
  buildSafeCronDigest,
  evaluateCronDomainPolicy,
  evaluateCronOwnerPolicy,
  sanitizeCronMetadata,
  summarizeCronJobOutputFixture,
} from '../src/data/work-console';

const deniedDomains = ['finance', 'real-estate', 'medical', 'legal', 'life', 'personal'];

for (const domain of deniedDomains) {
  const result = evaluateCronDomainPolicy(domain);
  assert.equal(result.domainPolicy, 'denied', `${domain} must be denied`);
  assert.equal(result.visible, false, `${domain} must be hidden`);
}

const unknownDomain = evaluateCronDomainPolicy('unregistered-domain');
assert.equal(unknownDomain.domainPolicy, 'unknown');
assert.equal(unknownDomain.visible, false);

const unknownOwner = evaluateCronOwnerPolicy('unregistered-owner');
assert.equal(unknownOwner.ownerPolicy, 'unknown');
assert.equal(unknownOwner.visible, false);

const allowedOwner = evaluateCronOwnerPolicy('work-console-fixture');
assert.equal(allowedOwner.ownerPolicy, 'allowed');
assert.equal(allowedOwner.visible, true);

const metadata = sanitizeCronMetadata({
  jobId: '/opt/data/profiles/router/cron/output/1526570975141826681',
  jobName: 'Authorization: Bearer metadata-secret for test@example.com',
  scheduleLabel: 'token=metadata-secret',
  owner: '010-1234-5678',
  domain: 'telegram 1526570975141826681',
  pausedReason: 'Webhook https://example.com/webhook/secret and .env',
});

const metadataJson = JSON.stringify(metadata);
const metadataForbidden = [
  /\/opt\/data\/profiles/i,
  /\.env/i,
  /Bearer/i,
  /token=/i,
  /metadata-secret/i,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /(?:\+?82[-\s]?)?0?1[016789][-\s]?\d{3,4}[-\s]?\d{4}/,
  /webhook/i,
  /\b\d{12,}\b/,
];

for (const pattern of metadataForbidden) {
  assert.equal(pattern.test(metadataJson), false, `metadata leaked ${pattern}`);
}

const rawLine = 'RAW LINE token=secret /opt/data/profiles/router/cron/output/job.md test@example.com webhook';
const digest = buildSafeCronDigest(rawLine);
assert.equal(digest.safeText.includes('RAW LINE'), false);
assert.equal(digest.safeText.includes('token=secret'), false);
assert.equal(digest.safeText.includes('/opt/data/profiles'), false);
assert.equal(digest.safeText.includes('test@example.com'), false);
assert.equal(/webhook/i.test(digest.safeText), false);

const hiddenSummary = summarizeCronJobOutputFixture({
  jobId: 'fixture-policy-job',
  jobName: 'Fixture Policy Job',
  jobState: 'scheduled',
  enabled: true,
  scheduleLabel: '0 9 * * *',
  owner: 'unregistered-owner',
  domain: 'finance',
  lastStatus: 'ok',
  sourcePathKind: 'fixture',
  outputText: rawLine,
});

assert.equal(hiddenSummary.visibility, 'hidden');
assert.equal(hiddenSummary.domainPolicy, 'denied');
assert.equal(hiddenSummary.ownerPolicy, 'unknown');
assert.equal(hiddenSummary.policyReasons.includes('sensitive_domain_hidden'), true);
assert.equal(hiddenSummary.policyReasons.includes('unknown_owner_hidden'), true);
assert.equal(hiddenSummary.jobId, 'hidden-job');
assert.equal(hiddenSummary.jobName, 'Hidden cron job');
assert.equal(hiddenSummary.scheduleLabel, 'schedule hidden');
assert.equal(hiddenSummary.owner, undefined);
assert.equal(hiddenSummary.domain, undefined);
assert.equal(hiddenSummary.pausedReason, undefined);
assert.equal(hiddenSummary.lastRunAt, undefined);
assert.equal(hiddenSummary.nextRunAt, undefined);
assert.equal(hiddenSummary.latestOutputAt, undefined);
assert.equal(hiddenSummary.latestOutputSizeBytes, 0);
assert.equal(hiddenSummary.outputCount, 0);
assert.equal(hiddenSummary.safeSummary, 'Hidden by policy.');
assert.equal(hiddenSummary.riskFlags.includes('hidden_by_policy'), true);

const timestampLeakSummary = summarizeCronJobOutputFixture({
  jobId: 'fixture-timestamp-job',
  jobName: 'Fixture Timestamp Job',
  jobState: 'scheduled',
  enabled: true,
  scheduleLabel: '0 12 * * *',
  owner: 'work-console-fixture',
  domain: 'operations',
  lastRunAt: '2026-07-14T09:00:00.000Z token=timestamp-secret',
  nextRunAt: '/opt/data/profiles/router/cron/output/2026-07-15T09:00:00.000Z',
  outputCreatedAt: '2026-07-14T09:05:00.000Z webhook https://example.com/webhook/timestamp test@example.com',
  lastStatus: 'ok',
  sourcePathKind: 'fixture',
  outputText: 'Visible fixture output.',
});

assert.equal(timestampLeakSummary.visibility, 'visible');
assert.equal(timestampLeakSummary.lastRunAt, undefined);
assert.equal(timestampLeakSummary.nextRunAt, undefined);
assert.equal(timestampLeakSummary.latestOutputAt, undefined);
assert.equal(timestampLeakSummary.freshness, 'missing');

const timestampLeakJson = JSON.stringify(timestampLeakSummary);
for (const forbidden of [/timestamp-secret/i, /\/opt\/data\/profiles/i, /webhook/i, /test@example\.com/i]) {
  assert.equal(forbidden.test(timestampLeakJson), false, `timestamp leaked ${forbidden}`);
}

const normalizedTimestampSummary = summarizeCronJobOutputFixture({
  jobId: 'fixture-normalized-timestamp-job',
  jobName: 'Fixture Normalized Timestamp Job',
  jobState: 'scheduled',
  enabled: true,
  scheduleLabel: '0 12 * * *',
  owner: 'work-console-fixture',
  domain: 'operations',
  lastRunAt: '2026-07-14T09:00:00+09:00',
  nextRunAt: '2026-07-15T09:00:00.000Z',
  outputCreatedAt: '2026-07-14T09:05:00.000Z',
  lastStatus: 'ok',
  sourcePathKind: 'fixture',
  outputText: '가나다',
});

assert.equal(normalizedTimestampSummary.lastRunAt, '2026-07-14T00:00:00.000Z');
assert.equal(normalizedTimestampSummary.nextRunAt, '2026-07-15T09:00:00.000Z');
assert.equal(normalizedTimestampSummary.latestOutputAt, '2026-07-14T09:05:00.000Z');
assert.equal(normalizedTimestampSummary.latestOutputSizeBytes, new TextEncoder().encode('가나다').length);

const semanticHiddenSummary = summarizeCronJobOutputFixture({
  jobId: 'semantic-hidden-job',
  jobName: 'KB증권 자동매수',
  jobState: 'scheduled',
  enabled: true,
  scheduleLabel: '매일 오전 9시',
  owner: 'work-console-fixture',
  domain: 'finance',
  pausedReason: '계좌 점검',
  lastRunAt: '2026-07-14T09:00:00.000Z',
  nextRunAt: '2026-07-15T09:00:00.000Z',
  outputCreatedAt: '2026-07-14T09:05:00.000Z',
  lastStatus: 'ok',
  sourcePathKind: 'fixture',
  outputText: '매수 완료 10주',
});

assert.equal(semanticHiddenSummary.visibility, 'hidden');
const semanticHiddenJson = JSON.stringify(semanticHiddenSummary);
for (const forbidden of [/KB증권/, /자동매수/, /매일 오전 9시/, /finance/, /계좌 점검/, /매수 완료/]) {
  assert.equal(forbidden.test(semanticHiddenJson), false, `hidden semantic metadata leaked ${forbidden}`);
}

const nonFixtureSummary = summarizeCronJobOutputFixture({
  jobId: 'non-fixture-source-job',
  jobName: 'Non Fixture Source Job',
  jobState: 'scheduled',
  enabled: true,
  scheduleLabel: '0 10 * * *',
  owner: 'work-console-fixture',
  domain: 'operations',
  lastStatus: 'ok',
  sourcePathKind: 'cron_output_dir',
  outputText: 'Non fixture source must be hidden.',
});

assert.equal(nonFixtureSummary.visibility, 'hidden');
assert.equal(nonFixtureSummary.policyReasons.includes('non_fixture_source_hidden'), true);
assert.equal(nonFixtureSummary.riskFlags.includes('hidden_by_policy'), true);

console.log('Work Console Phase 3C-1 policy verification passed');
