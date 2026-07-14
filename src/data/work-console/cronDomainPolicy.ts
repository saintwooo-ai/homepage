/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase 3C-1 fixture-only cron domain policy.
 * No filesystem, env, database, gateway, or live cron source access is allowed here.
 */

export type WorkConsoleCronDomainPolicy = 'allowed' | 'denied' | 'unknown';

export interface CronDomainPolicyResult {
  readonly domainPolicy: WorkConsoleCronDomainPolicy;
  readonly visible: boolean;
  readonly policyReasons: string[];
}

const ALLOWED_DOMAINS = new Set([
  'analytics',
  'content',
  'engineering',
  'marketing',
  'newsletter',
  'operations',
  'qa',
  'system',
  'work-console',
]);

const DENIED_DOMAINS = new Set([
  'finance',
  'financial',
  'real-estate',
  'real estate',
  'medical',
  'health',
  'healthcare',
  'legal',
  'law',
  'life',
  'personal',
]);

function normalizeDomain(domain: string | undefined): string {
  return (domain ?? '').trim().toLowerCase().replace(/[_\s]+/g, '-');
}

export function evaluateCronDomainPolicy(domain: string | undefined): CronDomainPolicyResult {
  const normalized = normalizeDomain(domain);

  if (!normalized) {
    return {
      domainPolicy: 'unknown',
      visible: false,
      policyReasons: ['unknown_domain_hidden'],
    };
  }

  if (DENIED_DOMAINS.has(normalized)) {
    return {
      domainPolicy: 'denied',
      visible: false,
      policyReasons: ['sensitive_domain_hidden'],
    };
  }

  if (ALLOWED_DOMAINS.has(normalized)) {
    return {
      domainPolicy: 'allowed',
      visible: true,
      policyReasons: ['allowed_domain'],
    };
  }

  return {
    domainPolicy: 'unknown',
    visible: false,
    policyReasons: ['unknown_domain_hidden'],
  };
}
