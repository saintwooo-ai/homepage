/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase 3C-1 fixture-only cron owner policy.
 * Unknown owners are hidden by default until explicitly approved.
 */

export type WorkConsoleCronOwnerPolicy = 'allowed' | 'denied' | 'unknown';

export interface CronOwnerPolicyResult {
  readonly ownerPolicy: WorkConsoleCronOwnerPolicy;
  readonly visible: boolean;
  readonly policyReasons: string[];
}

const ALLOWED_OWNERS = new Set([
  'dev-architect',
  'dev-builder',
  'dev-pm',
  'hermes-builder',
  'router',
  'server',
  'work-console-fixture',
]);

const DENIED_OWNERS = new Set([
  'personal',
  'private',
  'unknown-human',
]);

function normalizeOwner(owner: string | undefined): string {
  return (owner ?? '').trim().toLowerCase();
}

export function evaluateCronOwnerPolicy(owner: string | undefined): CronOwnerPolicyResult {
  const normalized = normalizeOwner(owner);

  if (!normalized) {
    return {
      ownerPolicy: 'unknown',
      visible: false,
      policyReasons: ['unknown_owner_hidden'],
    };
  }

  if (DENIED_OWNERS.has(normalized)) {
    return {
      ownerPolicy: 'denied',
      visible: false,
      policyReasons: ['denied_owner_hidden'],
    };
  }

  if (ALLOWED_OWNERS.has(normalized)) {
    return {
      ownerPolicy: 'allowed',
      visible: true,
      policyReasons: ['allowed_owner'],
    };
  }

  return {
    ownerPolicy: 'unknown',
    visible: false,
    policyReasons: ['unknown_owner_hidden'],
  };
}
