/**
 * S18 Live Work Status v0 verifier.
 *
 * This validates only the public safe status payload and browser fetcher guardrails.
 * It does not read Hermes runtime, gateway, cron, session DB, env, or VPS files.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const publicStatusPath = 'public/work-status.json';
const liveStatusSourcePath = 'src/liveWorkStatus.ts';
const packagePath = 'package.json';

const payload = JSON.parse(readFileSync(publicStatusPath, 'utf8')) as Record<string, unknown>;
const liveStatusSource = readFileSync(liveStatusSourcePath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8')) as { scripts?: Record<string, string> };

assert.equal(payload.schemaVersion, 'live-work-status.v0');
assert.equal(payload.mode, 'safe-public-status');
assert.equal(payload.status, 'active');
assert.equal(typeof payload.mission, 'string');
assert.equal(typeof payload.activeProfile, 'string');
assert.ok(Array.isArray(payload.supportingProfiles));
assert.equal(typeof payload.phase, 'string');
assert.equal(typeof payload.progress, 'number');
assert.ok(Number(payload.progress) >= 0 && Number(payload.progress) <= 100);
assert.equal(typeof payload.updatedAt, 'string');
assert.ok(!Number.isNaN(new Date(String(payload.updatedAt)).getTime()), 'updatedAt must be an ISO-like timestamp');
assert.equal(typeof payload.staleAfterSeconds, 'number');
assert.ok(Number(payload.staleAfterSeconds) >= 30);

const safety = payload.safety as Record<string, unknown> | undefined;
assert.ok(safety, 'safety block is required');
assert.equal(safety.readOnly, true);
assert.equal(safety.publicSafeOnly, true);
assert.equal(safety.rawLogsIncluded, false);
assert.equal(safety.hermesRuntimeRead, false);
assert.equal(safety.gatewayRead, false);
assert.equal(safety.cronRead, false);
assert.equal(safety.sessionDbRead, false);
assert.equal(safety.envRead, false);

const events = payload.events as Array<Record<string, unknown>> | undefined;
assert.ok(Array.isArray(events));
assert.ok(events.length >= 2);
for (const event of events) {
  assert.equal(typeof event.id, 'string');
  assert.equal(typeof event.timestamp, 'string');
  assert.equal(typeof event.profile, 'string');
  assert.ok(['info', 'success', 'warning', 'error'].includes(String(event.level)));
  assert.equal(typeof event.message, 'string');
}

const serialized = JSON.stringify(payload);
const forbiddenPayloadPatterns: Array<[string, RegExp]> = [
  ['openai-key', /sk-[A-Za-z0-9_-]{16,}/],
  ['github-token', /ghp_[A-Za-z0-9_]{16,}|github_pat_[A-Za-z0-9_]{16,}/],
  ['slack-token', /xox[baprs]-[A-Za-z0-9-]{16,}/],
  ['jwt', /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ['private-key', /-----BEGIN (?:RSA |OPENSSH |EC |DSA |)?PRIVATE KEY-----/],
  ['profile-path', /\/opt\/data\/profiles\//],
  ['hermes-home', /\/\.hermes\//],
  ['cron-path', /\/cron\//],
  ['jobs-json', /jobs\.json/i],
];
for (const [label, pattern] of forbiddenPayloadPatterns) {
  assert.ok(!pattern.test(serialized), `forbidden payload pattern leaked: ${label}`);
}

assert.ok(liveStatusSource.includes('api.github.com/repos/saintwooo-ai/homepage/contents/public/work-status.json?ref=main'));
assert.ok(liveStatusSource.includes("const LOCAL_STATUS_URL = '/work-status.json'"));
assert.ok(!/process\.env|import\.meta\.env|localStorage|sessionStorage|document\.cookie/.test(liveStatusSource));
assert.ok(!/@supabase\/supabase-js|createClient\s*\(/.test(liveStatusSource));
assert.ok(!/WebSocket|EventSource/.test(liveStatusSource));
assert.ok(!/jobs\.json|gateway[-_.]internal|CronReader|ProfileReader/.test(liveStatusSource));

const buildScript = packageJson.scripts?.build ?? '';
assert.ok(packageJson.scripts?.['verify:live-work-status']);
assert.ok(buildScript.includes('npm run verify:live-work-status'));

console.log('Live Work Status v0 verification passed');
