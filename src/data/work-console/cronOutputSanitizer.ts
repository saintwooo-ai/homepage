/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase 3B fixture-only sanitizer.
 * This module accepts caller-provided text and performs deterministic redaction.
 * It does not import fs, env, database, fetch, websocket, gateway, or Hermes session modules.
 */

export interface WorkConsoleSanitizeResult {
  safeText: string;
  riskFlags: string[];
  redactionCount: number;
}

interface RedactionRule {
  flag: string;
  pattern: RegExp;
  replacement: string;
}

const REDACTION_RULES: RedactionRule[] = [
  {
    flag: 'webhook',
    pattern: /https?:\/\/[^\s]*webhook[^\s]*/gi,
    replacement: '[REDACTED_WEBHOOK_URL]',
  },
  {
    flag: 'jwt',
    pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
    replacement: '[REDACTED_JWT]',
  },
  {
    flag: 'query_token',
    pattern: /([?&](?:token|code|key|secret|auth)=)[^\s&#]+/gi,
    replacement: '$1[REDACTED_QUERY_VALUE]',
  },
  {
    flag: 'secret_like_keyword',
    pattern: /\bBearer\s+[A-Za-z0-9._-]+\b/gi,
    replacement: 'Bearer [REDACTED_SECRET]',
  },
  {
    flag: 'secret_like_keyword',
    pattern: /\b(?:api[_-]?key|token|secret|bearer|authorization|password|passwd|oauth|github_pat_[A-Za-z0-9_]+|ghp_[A-Za-z0-9_]+|sk-[A-Za-z0-9_-]+)\b\s*[:=]?\s*[^\s,;)]*/gi,
    replacement: '[REDACTED_SECRET]',
  },
  {
    flag: 'email',
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replacement: '[REDACTED_EMAIL]',
  },
  {
    flag: 'phone',
    pattern: /\b(?:\+?82[-\s]?)?0?1[016789][-\s]?\d{3,4}[-\s]?\d{4}\b/g,
    replacement: '[REDACTED_PHONE]',
  },
  {
    flag: 'local_path',
    pattern: /(?:\/opt\/data|\/Users|\/home|\/var|\/tmp|~\/|profiles\/|\.hermes|\.env)[^\s)]*/g,
    replacement: '[REDACTED_PATH]',
  },
  {
    flag: 'platform_id',
    pattern: /\b(?:guild|channel|thread|chat_id|message_id|discord|telegram)\s*[:=]?\s*\d{8,}\b/gi,
    replacement: '[REDACTED_PLATFORM_ID]',
  },
  {
    flag: 'long_numeric_id',
    pattern: /\b\d{12,}\b/g,
    replacement: '[REDACTED_ID]',
  },
];

const MAX_INPUT_CHARS = 4_000;
const MAX_SUMMARY_LINES = 2;
const MAX_SUMMARY_CHARS = 240;

export function sanitizeCronOutputText(rawText: string): WorkConsoleSanitizeResult {
  const truncatedInput = rawText.slice(0, MAX_INPUT_CHARS);
  const flags = new Set<string>();
  let redactionCount = rawText.length > MAX_INPUT_CHARS ? 1 : 0;
  let safeText = truncatedInput;

  for (const rule of REDACTION_RULES) {
    safeText = safeText.replace(rule.pattern, (...args: unknown[]) => {
      const match = String(args[0] ?? '');
      if (match !== rule.replacement) {
        flags.add(rule.flag);
        redactionCount += 1;
      }
      return rule.replacement;
    });
  }

  if (rawText.length > MAX_INPUT_CHARS) {
    flags.add('truncated');
    safeText += '\n[TRUNCATED]';
  }

  return {
    safeText,
    riskFlags: [...flags].sort(),
    redactionCount,
  };
}

export function buildSafeCronSummary(rawText: string): WorkConsoleSanitizeResult {
  const result = sanitizeCronOutputText(rawText);
  const lines = result.safeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('# Cron Job:'))
    .filter((line) => !line.startsWith('**Job ID:**'))
    .slice(0, MAX_SUMMARY_LINES);

  const safeText = lines.join(' · ').slice(0, MAX_SUMMARY_CHARS);

  return {
    safeText,
    riskFlags: result.riskFlags,
    redactionCount: result.redactionCount,
  };
}
