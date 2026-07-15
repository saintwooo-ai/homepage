/**
 * Phase 4B local dummy serializer verification.
 * This test proves only that caller-provided dummy observations are converted
 * into a safe browser-facing envelope. It does not touch live runtime sources.
 */

import assert from 'node:assert/strict';
import { serializeDummyServerSnapshot } from '../src/data/work-console/serverSnapshotSerializer';

const privatePath = ['opt', 'data', 'private', 'runtime.log'].join('/');
const snowflakeLike = '1526778499699048570';
const jwtLike = ['eyJ' + 'hbGciOiJIUzI1NiJ9', 'eyJ' + 'zdWIiOiJkZW1vIn0', 'signaturepart'].join('.');
const secretLike = 'api_key=should-not-leak';
const unsafeGeneratedAt = `${privatePath} ${secretLike}`;
const unsafeObservedAt = `${snowflakeLike} ${jwtLike}`;

const envelope = serializeDummyServerSnapshot({
  generatedAt: unsafeGeneratedAt,
  observations: [
    {
      kind: 'gateway',
      state: 'ok',
      count: 8,
      observedAt: unsafeObservedAt,
      issueCode: secretLike,
      message: `raw detail ${privatePath} ${snowflakeLike} ${jwtLike} ${secretLike}`,
    },
    {
      kind: 'scheduler',
      state: 'degraded',
      count: 3,
      observedAt: '2026-07-15T00:01:00.000Z',
      issueCode: 'SOURCE_DEGRADED',
      message: 'Scheduler summary\nwith newline and extra spacing',
    },
  ],
  errors: [
    {
      code: privatePath,
      message: `Failure contained ${privatePath} and ${secretLike}`,
      retryable: true,
      severity: 'error',
    },
  ],
  killSwitch: {
    state: 'forced_disabled',
    safeMessage: `Blocked because ${privatePath} must not leave server boundary`,
  },
});

assert.equal(envelope.apiVersion, 'work-console-snapshot.v1');
assert.equal(envelope.audience, 'admin-internal');
assert.equal(envelope.collectorState, 'disabled');
assert.equal(envelope.sourceMode, 'server-snapshot-disabled');
assert.equal(envelope.cacheState, 'disabled');
assert.equal(envelope.generatedAt, '2026-07-15T00:00:00.000Z');
assert.equal(envelope.readOnly, true);
assert.equal(envelope.liveReadEnabled, false);
assert.equal(envelope.productionLiveApproved, false);
assert.equal(envelope.serverCollectorApproved, false);
assert.equal(envelope.privateIdsRedacted, true);
assert.equal(envelope.rawLogsIncluded, false);
assert.equal(envelope.rawRuntimeOutputIncluded, false);
assert.equal(envelope.endpointPolicy.routeImplemented, false);
assert.equal(envelope.endpointPolicy.adminOnly, true);
assert.equal(envelope.endpointPolicy.publicAccess, false);
assert.equal(envelope.endpointPolicy.cacheHeader, 'no-store');
assert.equal(envelope.freshnessPolicy.allowSharedCache, false);
assert.equal(envelope.killSwitch.state, 'forced_disabled');
assert.equal(envelope.killSwitch.serverSideRequired, true);
assert.equal(envelope.killSwitch.clientFallbackOnly, true);
assert.equal(envelope.staleAfter, '2026-07-15T00:02:00.000Z');
assert.equal(envelope.expiresAt, '2026-07-15T00:10:00.000Z');

assert.equal(envelope.safeComponents.length, 2);
assert.equal(envelope.safeComponents[0]?.componentRef, 'demo-component-a');
assert.equal(envelope.safeComponents[0]?.status, 'unknown');
assert.equal(envelope.safeComponents[0]?.countBucket, '5+');
assert.equal(envelope.safeComponents[0]?.lastUpdatedAt, undefined);
assert.equal(envelope.safeComponents[0]?.issueCode, 'DUMMY_OBSERVATION');
assert.equal(envelope.safeComponents[1]?.componentRef, 'demo-component-b');
assert.equal(envelope.safeComponents[1]?.status, 'degraded');
assert.equal(envelope.safeComponents[1]?.countBucket, '1-5');
assert.equal(envelope.safeComponents[1]?.lastUpdatedAt, '2026-07-15T00:01:00.000Z');
assert.equal(envelope.safeComponents[1]?.issueCode, 'SOURCE_DEGRADED');
assert.equal(envelope.errors[0]?.code, 'WORK_CONSOLE_SAFE_ERROR');
assert.equal(envelope.errors[0]?.retryable, true);
assert.equal(envelope.errors[0]?.severity, 'error');

for (const component of envelope.safeComponents) {
  assert.match(component.componentRef, /^demo-component-[a-z]+$/);
  assert.ok(component.safeMessage.length <= 140);
  assert.doesNotMatch(component.safeMessage, /\n/);
}

for (const error of envelope.errors) {
  assert.match(error.code, /^[A-Z0-9_]+$/);
  assert.ok(error.safeMessage.length <= 140);
  assert.doesNotMatch(error.safeMessage, /\n/);
}

for (const gate of envelope.approvalGates) {
  assert.notEqual(gate.status, 'passed');
}

const serialized = JSON.stringify(envelope, null, 2);
const forbiddenFragments = [
  privatePath,
  snowflakeLike,
  jwtLike,
  secretLike,
  unsafeGeneratedAt,
  unsafeObservedAt,
  'should-not-leak',
  'raw detail',
];

for (const fragment of forbiddenFragments) {
  assert.equal(serialized.includes(fragment), false, `serializer leaked forbidden fragment: ${fragment}`);
}

assert.equal(Object.prototype.hasOwnProperty.call(envelope, 'rawObservations'), false);
assert.equal(Object.prototype.hasOwnProperty.call(envelope, 'rawErrors'), false);
assert.equal(Object.prototype.hasOwnProperty.call(envelope, 'internalSource'), false);

const fallbackEnvelope = serializeDummyServerSnapshot({
  generatedAt: '2026-07-15T00:00:00.000Z',
  observations: [
    {
      kind: 'system-check',
      state: 'fallback',
      count: 1,
      message: 'Only a stale safe summary is available.',
    },
  ],
  killSwitch: {
    state: 'enabled',
  },
});

assert.equal(fallbackEnvelope.collectorState, 'not_approved');
assert.equal(fallbackEnvelope.sourceMode, 'server-snapshot-disabled');
assert.equal(fallbackEnvelope.cacheState, 'disabled');
assert.equal(fallbackEnvelope.liveReadEnabled, false);
assert.equal(fallbackEnvelope.productionLiveApproved, false);
assert.equal(fallbackEnvelope.serverCollectorApproved, false);

const manyObservationsEnvelope = serializeDummyServerSnapshot({
  generatedAt: '2026-07-15T00:00:00.000Z',
  observations: Array.from({ length: 30 }, (_, index) => ({
    kind: 'system-check' as const,
    state: 'disabled' as const,
    message: `Dummy observation ${index}`,
    issueCode: 'DUMMY_OBSERVATION',
  })),
});

assert.equal(manyObservationsEnvelope.safeComponents[0]?.componentRef, 'demo-component-a');
assert.equal(manyObservationsEnvelope.safeComponents[25]?.componentRef, 'demo-component-z');
assert.equal(manyObservationsEnvelope.safeComponents[26]?.componentRef, 'demo-component-aa');
for (const component of manyObservationsEnvelope.safeComponents) {
  assert.match(component.componentRef, /^demo-component-[a-z]+$/);
}

console.log('Work Console Phase 4B local dummy serializer verification passed');
