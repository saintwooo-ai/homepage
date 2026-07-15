/**
 * Phase 3C-3 build artifact leak scan.
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
];

const findings: string[] = [];
for (const file of files) {
  const body = readFileSync(file, 'utf8');
  for (const check of forbiddenChecks) {
    if (check.pattern.test(body)) findings.push(`${check.label}: ${file}`);
  }
}

assert.deepEqual(findings, [], `forbidden Work Console runtime strings in dist:\n${findings.join('\n')}`);
console.log(`Work Console Phase 3C-3 dist leak scan passed (${files.length} files scanned)`);
