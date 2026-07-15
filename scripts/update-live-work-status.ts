import { writeFileSync } from 'node:fs';

const now = new Date();
const iso = now.toISOString();

const payload = {
  schemaVersion: 'live-work-status.v0',
  mode: 'safe-public-status',
  source: 'router-manual-safe-status',
  status: 'active',
  mission: '홈페이지 Work Console에서 Hermes 프로필 작업 상태가 보이도록 Live Work Status v0 구현',
  activeProfile: 'router',
  supportingProfiles: ['dev-pm', 'dev-builder', 'checker'],
  phase: 'implementation-and-verification',
  progress: 78,
  updatedAt: iso,
  staleAfterSeconds: 900,
  safeSummary: '업무대장이 사용자 승인 후 공개 가능한 작업 상태만 Work Console에 표시하는 Live Work Status v0를 구현 중입니다.',
  currentAction: 'safe status polling UI, public status payload, verifier, build gate를 검증하고 있습니다.',
  nextAction: 'checker 검토 후 GitHub main 반영, Vercel production 확인, ugnas.vercel.app smoke를 수행합니다.',
  safety: {
    readOnly: true,
    publicSafeOnly: true,
    rawLogsIncluded: false,
    privateIdsRedacted: true,
    tokensRemoved: true,
    hermesRuntimeRead: false,
    gatewayRead: false,
    cronRead: false,
    sessionDbRead: false,
    envRead: false,
  },
  events: [
    {
      id: 'evt-s18-001',
      timestamp: new Date(now.getTime() - 9 * 60 * 1000).toISOString(),
      profile: 'router',
      level: 'info',
      message: '사용자가 실시간 Hermes 프로필 작업 상태 표시 목표를 승인했습니다.',
    },
    {
      id: 'evt-s18-002',
      timestamp: new Date(now.getTime() - 7 * 60 * 1000).toISOString(),
      profile: 'router',
      level: 'info',
      message: '브라우저가 Hermes 내부를 직접 읽지 않는 공개 safe status polling 구조로 구현 범위를 확정했습니다.',
    },
    {
      id: 'evt-s18-003',
      timestamp: new Date(now.getTime() - 4 * 60 * 1000).toISOString(),
      profile: 'router',
      level: 'success',
      message: 'Live Work Status v0 UI와 verifier를 작성했습니다.',
    },
    {
      id: 'evt-s18-004',
      timestamp: iso,
      profile: 'router',
      level: 'info',
      message: '검증, checker, GitHub main 반영, Vercel production 확인 단계로 이동합니다.',
    },
  ],
};

writeFileSync('public/work-status.json', `${JSON.stringify(payload, null, 2)}\n`);
console.log(`updated public/work-status.json at ${iso}`);
