/**
 * Phase 3C-5 Work Console source-boundary verification.
 *
 * This verifies the fixture/static frontend path only. It does not approve or
 * exercise live server/API/runtime/Hermes gateway/cron reads.
 */

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, normalize } from 'node:path';

const allScanRoots = [
  'src/data/work-console',
  'src/components/work-console',
  'src/components/AgentFlowTimelineView.tsx',
  'src/components/ApprovalBlockerPanel.tsx',
  'src/components/KanbanView.tsx',
  'src/components/MimirPhase2Panel.tsx',
  'src/components/ProfileWorkStatePanel.tsx',
  'src/types/workConsole.ts',
];

const uiScanRoots = [
  'src/components/work-console',
  'src/components/AgentFlowTimelineView.tsx',
  'src/components/ApprovalBlockerPanel.tsx',
  'src/components/KanbanView.tsx',
  'src/components/MimirPhase2Panel.tsx',
  'src/components/ProfileWorkStatePanel.tsx',
];

const browserEntrypoint = 'src/data/work-console/browser.ts';

const collectFiles = (roots: string[]) => {
  const files: string[] = [];
  const walk = (path: string) => {
    if (!existsSync(path)) return;
    const stat = statSync(path);
    if (stat.isFile()) {
      if (/\.(ts|tsx)$/i.test(path)) files.push(normalize(path));
      return;
    }
    for (const entry of readdirSync(path)) walk(join(path, entry));
  };

  for (const root of roots) walk(root);
  return Array.from(new Set(files)).sort();
};

const allFiles = collectFiles(allScanRoots);
const uiFiles = collectFiles(uiScanRoots);
const browserFiles = existsSync(browserEntrypoint) ? [browserEntrypoint] : [];

const importSpecifiers = (body: string) => {
  const specs: string[] = [];
  const patterns = [
    /import(?:\s+type)?\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    /export(?:\s+type)?\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(body))) specs.push(match[1]);
  }
  return specs;
};

const isWorkConsoleDataImport = (specifier: string) => /(?:^|\/)data\/work-console(?:\/|$)/.test(specifier);
const isAllowedBrowserImport = (specifier: string) => /(?:^|\/)data\/work-console\/browser$/.test(specifier);
const isBareWorkConsoleBarrel = (specifier: string) => /(?:^|\/)data\/work-console(?:\/index)?$/.test(specifier);
const isForbiddenWorkConsoleModule = (specifier: string) => /(?:serverSnapshotSerializer|liveHermesWorkConsoleAdapter|adapterFactory|runtimeGate|cronJobOutputReader|cronOutputSanitizer|cronMetadataSanitizer|cronDomainPolicy|cronOwnerPolicy|collector|gateway|hermes|serializer|runtime|server)(?:\.|$|\/)/i.test(specifier);
const isNodeOnlyImport = (specifier: string) => /^(?:node:)?(?:fs|path|process|child_process|os|crypto)$/.test(specifier);

const forbiddenSourceChecks: Array<{ label: string; pattern: RegExp }> = [
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

for (const file of allFiles) {
  const body = readFileSync(file, 'utf8');
  for (const check of forbiddenSourceChecks) {
    if (check.pattern.test(body)) findings.push(`${check.label}: ${file}`);
  }
}

for (const file of [...uiFiles, ...browserFiles]) {
  const body = readFileSync(file, 'utf8');
  for (const specifier of importSpecifiers(body)) {
    if (isNodeOnlyImport(specifier)) findings.push(`node-only-import: ${file} -> ${specifier}`);
  }
}

for (const file of uiFiles) {
  const body = readFileSync(file, 'utf8');
  for (const specifier of importSpecifiers(body)) {
    if (isBareWorkConsoleBarrel(specifier)) findings.push(`ui-work-console-barrel-import: ${file} -> ${specifier}`);
    if (isWorkConsoleDataImport(specifier) && !isAllowedBrowserImport(specifier)) {
      findings.push(`ui-non-browser-work-console-import: ${file} -> ${specifier}`);
    }
    if (isForbiddenWorkConsoleModule(specifier)) findings.push(`ui-forbidden-work-console-import: ${file} -> ${specifier}`);
  }
}

for (const file of browserFiles) {
  const body = readFileSync(file, 'utf8');
  for (const specifier of importSpecifiers(body)) {
    if (isForbiddenWorkConsoleModule(specifier)) findings.push(`browser-forbidden-work-console-import: ${file} -> ${specifier}`);
    if (isBareWorkConsoleBarrel(specifier)) findings.push(`browser-barrel-import: ${file} -> ${specifier}`);
  }
}

assert.deepEqual(findings, [], `forbidden Work Console source-boundary patterns:\n${findings.join('\n')}`);
console.log(
  `Work Console source-boundary verification passed (${allFiles.length} files scanned, ${uiFiles.length} UI files, browser entrypoint locked)`,
);
