/**
 * Work Console knowledge DB read-only verifier.
 *
 * This allows a narrow Supabase read path for the Work Console knowledge panel
 * while blocking mutations, direct KnowledgeView reuse, and unmanaged REST calls.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const files = [
  'src/services/workConsoleKnowledgeReadOnly.ts',
  'src/components/work-console/WorkConsoleKnowledgePanel.tsx',
  'src/components/work-console/WorkConsoleView.tsx',
];

const requiredFiles = [
  'src/services/workConsoleKnowledgeReadOnly.ts',
  'src/components/work-console/WorkConsoleKnowledgePanel.tsx',
];

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

const findings: string[] = [];

for (const file of requiredFiles) {
  if (!existsSync(file)) findings.push(`missing-required-file: ${file}`);
}

for (const file of files) {
  if (!existsSync(file)) continue;
  const body = readFileSync(file, 'utf8');
  const specs = importSpecifiers(body);

  for (const specifier of specs) {
    if (/KnowledgeView$|components\/KnowledgeView/.test(specifier)) findings.push(`forbidden-knowledge-view-import: ${file} -> ${specifier}`);
    if (/liveHermesWorkConsoleAdapter|adapterFactory|runtimeGate|server|gateway|cron/i.test(specifier)) findings.push(`forbidden-runtime-import: ${file} -> ${specifier}`);
  }

  const mutationPatterns: Array<[string, RegExp]> = [
    ['supabase-insert', /\.insert\s*\(/],
    ['supabase-update', /\.update\s*\(/],
    ['supabase-delete', /\.delete\s*\(/],
    ['supabase-upsert', /\.upsert\s*\(/],
    ['supabase-rpc', /\.rpc\s*\(/],
    ['rest-post', /method\s*:\s*['"]POST['"]/i],
    ['rest-patch', /method\s*:\s*['"]PATCH['"]/i],
    ['rest-put', /method\s*:\s*['"]PUT['"]/i],
    ['rest-delete', /method\s*:\s*['"]DELETE['"]/i],
    ['raw-fetch', /\bfetch\s*\(/],
    ['service-role', /service[_-]?role/i],
  ];

  for (const [label, pattern] of mutationPatterns) {
    if (pattern.test(body)) findings.push(`${label}: ${file}`);
  }
}

const readModel = existsSync('src/services/workConsoleKnowledgeReadOnly.ts')
  ? readFileSync('src/services/workConsoleKnowledgeReadOnly.ts', 'utf8')
  : '';

for (const table of ['knowledge_items', 'knowledge_sources', 'knowledge_review_queue']) {
  if (!readModel.includes(`from('${table}')`)) findings.push(`missing-read-table: ${table}`);
}

for (const unsafeColumn of ['raw_text', 'metadata']) {
  if (readModel.includes(unsafeColumn)) findings.push(`unsafe-column-selected: ${unsafeColumn}`);
}

assert.deepEqual(findings, [], `knowledge DB read-only verifier findings:\n${findings.join('\n')}`);
console.log(`Work Console knowledge DB read-only verification passed (${files.filter((file) => existsSync(file)).length} files scanned)`);
