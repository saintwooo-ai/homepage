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
import { buildSafeCronSummary } from './cronOutputSanitizer';

export interface CronJobOutputReaderOptions {
  readonly now?: string;
  readonly freshWithinHours?: number;
}

const DEFAULT_FRESH_WITHIN_HOURS = 24;

function getFreshness(outputCreatedAt: string | undefined, options: CronJobOutputReaderOptions): WorkConsoleSourceFreshness {
  if (!outputCreatedAt) {
    return 'missing';
  }

  const nowMs = Date.parse(options.now ?? new Date().toISOString());
  const outputMs = Date.parse(outputCreatedAt);

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
  const safeSummary = buildSafeCronSummary(fixture.outputText);

  return {
    jobId: fixture.jobId,
    jobName: fixture.jobName,
    jobState: fixture.jobState,
    enabled: fixture.enabled,
    scheduleLabel: fixture.scheduleLabel,
    lastRunAt: fixture.lastRunAt,
    nextRunAt: fixture.nextRunAt,
    lastStatus: fixture.lastStatus ?? 'unknown',
    latestOutputAt: fixture.outputCreatedAt,
    latestOutputSizeBytes: fixture.outputText.length,
    outputCount: fixture.outputText ? 1 : 0,
    freshness: getFreshness(fixture.outputCreatedAt, options),
    safeSummary: safeSummary.safeText,
    riskFlags: safeSummary.riskFlags,
    redactionCount: safeSummary.redactionCount,
    sourcePathKind: fixture.sourcePathKind,
  };
}

export function summarizeCronJobOutputFixtures(
  fixtures: readonly WorkConsoleJobOutputFixture[],
  options: CronJobOutputReaderOptions = {},
): WorkConsoleJobRunSummary[] {
  return fixtures.map((fixture) => summarizeCronJobOutputFixture(fixture, options));
}
