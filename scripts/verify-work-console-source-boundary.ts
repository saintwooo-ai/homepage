/**
 * Phase 3C-4 Work Console source-boundary verification.
 * Scans only Work Console source paths to ensure this frontend path stays
 * fixture/default and cannot import runtime, env, filesystem, network, DB,
 * gateway, or cron readers before server handoff approval.
 */

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const scanRoots = [
  'src/data/work-console',
  'src/components/work-console',
  'src/types/workConsole.ts',
];

const files: string[] = [];

const walk = (path: string) => {
  if (!existsSync(path)) return;
  const stat = statSync(path);
  if (stat.isFile()) {
    if (/\.(ts|tsx)$/i.test(path)) files.push(path);
    return;
  }
  for (const entry of readdirSync(path)) walk(join(path, entry));
};

for (const root of scanRoots) walk(root);

const forbiddenChecks: Array<{ label: string; pattern: RegExp }> = [
  { label: 'node-fs-import', pattern: /from\s+['"]node:fs['"]|from\s+['"]fs['"]|require\(['"]fs['"]\)/ },
  { label: 'node-path-live-reader-import', pattern: /from\s+['"]node:path['"]|from\s+['"]path['"]|require\(['"]path['"]\)/ },
  { label: 'process-env', pattern: /process\.env/ },
  { label: 'vite-env', pattern: /import\.meta\.env/ },
  { label: 'fetch-call', pattern: /\bfetch\s*\(/ },
  { label: 'websocket', pattern: /\bWebSocket\b/ },
  { label: 'eventsource', pattern: /\bEventSource\b/ },
  { label: 'supabase-client', pattern: /@supabase\/supabase-js|\bcreateClient\s*\(/ },
  { label: 'jobs-json', pattern: /jobs\.json/i },
  { label: 'profile-path', pattern: /\/profiles\//i },
  { label: 'cron-output-path', pattern: /\/cron\//i },
  { label: 'gateway-runtime-client', pattern: /\b(?:new\s+)?Gateway(?:Client|Reader)\b|gateway[-_.]internal/i },
  { label: 'live-source-client-construction', pattern: /\b(?:new\s+)?(?:Cron|Job|Profile)(?:Reader|Client)\b/ },
];

const findings: string[] = [];
for (const file of files) {
  const body = readFileSync(file, 'utf8');
  for (const check of forbiddenChecks) {
    if (check.pattern.test(body)) findings.push(`${check.label}: ${file}`);
  }
}

assert.deepEqual(findings, [], `forbidden Work Console source-boundary patterns:\n${findings.join('\n')}`);
console.log(`Work Console Phase 3C-4 source-boundary verification passed (${files.length} files scanned)`);
