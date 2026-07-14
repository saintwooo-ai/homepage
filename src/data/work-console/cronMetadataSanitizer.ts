/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase 3C-1 fixture-only cron metadata sanitizer.
 * Accepts caller-provided metadata only; never reads cron files or live config.
 */

import { sanitizeCronOutputText } from './cronOutputSanitizer';

export interface CronMetadataInput {
  readonly jobId: string;
  readonly jobName: string;
  readonly scheduleLabel: string;
  readonly owner?: string;
  readonly domain?: string;
  readonly pausedReason?: string;
}

export interface CronMetadataSanitizeResult {
  readonly jobId: string;
  readonly jobName: string;
  readonly scheduleLabel: string;
  readonly owner?: string;
  readonly domain?: string;
  readonly pausedReason?: string;
  readonly riskFlags: string[];
  readonly redactionCount: number;
}

const MAX_METADATA_CHARS = 96;

function sanitizeMetadataValue(value: string | undefined, fallback: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const sanitized = sanitizeCronOutputText(trimmed).safeText.trim();
  const hasRedaction = sanitized.includes('[REDACTED_');
  const alias = hasRedaction ? fallback : sanitized;
  return alias.slice(0, MAX_METADATA_CHARS);
}

function collectFlags(values: readonly (string | undefined)[]): { riskFlags: string[]; redactionCount: number } {
  const flags = new Set<string>();
  let redactionCount = 0;

  for (const value of values) {
    if (value === undefined || value.trim() === '') {
      continue;
    }

    const result = sanitizeCronOutputText(value);
    redactionCount += result.redactionCount;
    for (const flag of result.riskFlags) {
      flags.add(flag);
    }
  }

  return {
    riskFlags: [...flags].sort(),
    redactionCount,
  };
}

export function sanitizeCronMetadata(input: CronMetadataInput): CronMetadataSanitizeResult {
  const values = [
    input.jobId,
    input.jobName,
    input.scheduleLabel,
    input.owner,
    input.domain,
    input.pausedReason,
  ];
  const collected = collectFlags(values);

  return {
    jobId: sanitizeMetadataValue(input.jobId, 'job-alias') ?? 'job-alias',
    jobName: sanitizeMetadataValue(input.jobName, 'Cron job') ?? 'Cron job',
    scheduleLabel: sanitizeMetadataValue(input.scheduleLabel, 'schedule hidden') ?? 'schedule hidden',
    owner: sanitizeMetadataValue(input.owner, 'owner-alias'),
    domain: sanitizeMetadataValue(input.domain, 'domain-alias'),
    pausedReason: sanitizeMetadataValue(input.pausedReason, 'paused reason hidden'),
    riskFlags: collected.riskFlags,
    redactionCount: collected.redactionCount,
  };
}
