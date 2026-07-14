/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase 3B fixture-only reader.
 * This reader never reads files. It converts caller-provided fixture records into
 * UI-safe summaries so redaction and contract rules can be tested before any
 * real cron output source is approved.
 */

import type {
  WorkConsoleJobOutputFixture,
  WorkConsoleJobRunSummary,
  WorkConsoleSourceFreshness,
} from '../../types/workConsole';
import { buildSafeCronDigest, sanitizeCronOutputText } from './cronOutputSanitizer';
import { evaluateCronDomainPolicy } from './cronDomainPolicy';
import { sanitizeCronMetadata } from './cronMetadataSanitizer';
import { evaluateCronOwnerPolicy } from './cronOwnerPolicy';

export interface CronJobOutputReaderOptions {
  readonly now?: string;
  readonly freshWithinHours?: number;
}

const DEFAULT_FRESH_WITHIN_HOURS = 24;

function normalizeSafeTimestamp(timestamp: string | undefined): string | undefined {
  if (!timestamp) {
    return undefined;
  }

  const trimmedTimestamp = timestamp.trim();
  if (!trimmedTimestamp) {
    return undefined;
  }

  const sanitizedTimestamp = sanitizeCronOutputText(trimmedTimestamp);
  if (sanitizedTimestamp.redactionCount > 0 || sanitizedTimestamp.riskFlags.length > 0) {
    return undefined;
  }

  const parsedTimestamp = Date.parse(trimmedTimestamp);
  if (Number.isNaN(parsedTimestamp)) {
    return undefined;
  }

  return new Date(parsedTimestamp).toISOString();
}

function getFreshness(outputCreatedAt: string | undefined, options: CronJobOutputReaderOptions): WorkConsoleSourceFreshness {
  const safeOutputCreatedAt = normalizeSafeTimestamp(outputCreatedAt);
  if (!safeOutputCreatedAt) {
    return 'missing';
  }

  const safeNow = normalizeSafeTimestamp(options.now) ?? new Date().toISOString();
  const nowMs = Date.parse(safeNow);
  const outputMs = Date.parse(safeOutputCreatedAt);

  if (Number.isNaN(nowMs) || Number.isNaN(outputMs)) {
    return 'unknown';
  }

  const freshWithinMs = (options.freshWithinHours ?? DEFAULT_FRESH_WITHIN_HOURS) * 60 * 60 * 1000;
  return nowMs - outputMs <= freshWithinMs ? 'fresh' : 'stale';
}

export function summarizeCronJobOutputFixture(
  fixture: WorkConsoleJobOutputFixture,
  options: CronJobOutputReaderOptions = {},
): WorkConsoleJobRunSummary {
  const safeSummary = buildSafeCronDigest(fixture.outputText);
  const latestOutputSizeBytes = new TextEncoder().encode(fixture.outputText).length;
  const safeMetadata = sanitizeCronMetadata({
    jobId: fixture.jobId,
    jobName: fixture.jobName,
    scheduleLabel: fixture.scheduleLabel,
    owner: fixture.owner,
    domain: fixture.domain,
    pausedReason: fixture.pausedReason,
  });
  const domainPolicy = evaluateCronDomainPolicy(safeMetadata.domain);
  const ownerPolicy = evaluateCronOwnerPolicy(safeMetadata.owner);
  const fixtureSourceVisible = fixture.sourcePathKind === 'fixture';
  const policyReasons = [
    ...domainPolicy.policyReasons,
    ...ownerPolicy.policyReasons,
    ...(fixtureSourceVisible ? [] : ['non_fixture_source_hidden']),
  ];
  const visible = domainPolicy.visible && ownerPolicy.visible && fixtureSourceVisible;
  const riskFlags = [
    ...new Set([...safeSummary.riskFlags, ...safeMetadata.riskFlags, ...(visible ? [] : ['hidden_by_policy'])]),
  ].sort();

  if (!visible) {
    return {
      jobId: 'hidden-job',
      jobName: 'Hidden cron job',
      jobState: 'unknown',
      enabled: false,
      scheduleLabel: 'schedule hidden',
      visibility: 'hidden',
      domainPolicy: domainPolicy.domainPolicy,
      ownerPolicy: ownerPolicy.ownerPolicy,
      policyReasons,
      lastStatus: 'unknown',
      latestOutputSizeBytes: 0,
      outputCount: 0,
      freshness: 'missing',
      safeSummary: 'Hidden by policy.',
      riskFlags,
      redactionCount: safeSummary.redactionCount + safeMetadata.redactionCount,
      sourcePathKind: fixture.sourcePathKind,
    };
  }

  return {
    jobId: safeMetadata.jobId,
    jobName: safeMetadata.jobName,
    jobState: fixture.jobState,
    enabled: fixture.enabled,
    scheduleLabel: safeMetadata.scheduleLabel,
    owner: safeMetadata.owner,
    domain: safeMetadata.domain,
    pausedReason: safeMetadata.pausedReason,
    visibility: visible ? 'visible' : 'hidden',
    domainPolicy: domainPolicy.domainPolicy,
    ownerPolicy: ownerPolicy.ownerPolicy,
    policyReasons,
    lastRunAt: normalizeSafeTimestamp(fixture.lastRunAt),
    nextRunAt: normalizeSafeTimestamp(fixture.nextRunAt),
    lastStatus: fixture.lastStatus ?? 'unknown',
    latestOutputAt: normalizeSafeTimestamp(fixture.outputCreatedAt),
    latestOutputSizeBytes,
    outputCount: fixture.outputText ? 1 : 0,
    freshness: getFreshness(fixture.outputCreatedAt, options),
    safeSummary: safeSummary.safeText,
    riskFlags,
    redactionCount: safeSummary.redactionCount + safeMetadata.redactionCount,
    sourcePathKind: fixture.sourcePathKind,
  };
}

export function summarizeCronJobOutputFixtures(
  fixtures: readonly WorkConsoleJobOutputFixture[],
  options: CronJobOutputReaderOptions = {},
): WorkConsoleJobRunSummary[] {
  return fixtures.map((fixture) => summarizeCronJobOutputFixture(fixture, options));
}
