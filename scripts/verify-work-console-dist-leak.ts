/**
 * Phase 3C-4 build artifact leak scan.
 * Reads only local build artifacts under dist after `npm run build`.
 */

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const distDir = 'dist';
assert.equal(existsSync(distDir), true, 'dist directory must exist; run npm run build first');

const files: string[] = [];
const walk = (dir: string) => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path);
      continue;
    }
    if (/\.(js|css|html|map)$/i.test(path)) files.push(path);
  }
};
walk(distDir);

const forbiddenChecks: Array<{ label: string; pattern: RegExp }> = [
  { label: 'host-data-path', pattern: new RegExp('/' + 'opt' + '/' + 'data', 'i') },
  { label: 'profile-cron-path', pattern: new RegExp('/' + 'profiles' + '/[^\\s"\']*' + '/' + 'cron', 'i') },
  { label: 'jobs-json', pattern: new RegExp('jobs' + '\\.' + 'json', 'i') },
  { label: 'cron-output', pattern: new RegExp('cron' + '/' + 'output', 'i') },
  { label: 'gateway-internal-hostname', pattern: /gateway[-_.]internal/i },
  { label: 'bearer-token-like', pattern: /bearer\s+[a-z0-9._-]{12,}/i },
  { label: 'webhook-url', pattern: /https?:\/\/[^\s"']*webhook[^\s"']*/i },
  { label: 'hermes-env-var-name', pattern: /\bHERMES_[A-Z0-9_]+\b/ },
  { label: 'work-console-live-env-name', pattern: /\bWORK_CONSOLE_[A-Z0-9_]*(?:LIVE|CRON|READER|SOURCE)[A-Z0-9_]*\b/ },
  { label: 'explicit-secret-assignment', pattern: /\b(?:api[_-]?key|secret|password|token)[\s:=]+(?:live|prod|real)[a-z0-9._-]{8,}/i },
  { label: 'jwt-like', pattern: /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/ },
  { label: 'private-key-block', pattern: /BEGIN\s+(?:RSA\s+|OPENSSH\s+|EC\s+)?PRIVATE\s+KEY/i },
];

const findings: string[] = [];
for (const file of files) {
  const body = readFileSync(file, 'utf8');
  for (const check of forbiddenChecks) {
    if (check.pattern.test(body)) findings.push(`${check.label}: ${file}`);
  }
}

assert.deepEqual(findings, [], `forbidden Work Console runtime strings in dist:\n${findings.join('\n')}`);

const combinedBody = files.map(file => readFileSync(file, 'utf8')).join('\n');
const removedMenuChecks: Array<{ label: string; pattern: RegExp }> = [
  { label: 'collaboration-profile-menu', pattern: /협업 프로필/ },
  { label: 'knowledge-pipeline-menu', pattern: /지식 파이프라인/ },
  { label: 'work-console-seed-title', pattern: /Work Console v1 요청 접수/ },
  { label: 'work-console-seed-label', pattern: /Work Console mock-only adapter seed/ },
];
const removedMenuFindings = removedMenuChecks
  .filter((check) => check.pattern.test(combinedBody))
  .map((check) => check.label);
assert.deepEqual(removedMenuFindings, [], `removed menu/mock strings still present in dist:\n${removedMenuFindings.join('\n')}`);

console.log(`Homepage dist leak scan passed (${files.length} files scanned)`);
