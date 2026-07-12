/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task, Profile, KnowledgePipeline, EventLog, EventLevel, TaskStatus } from './types';

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'router',
    name: 'router',
    role: '사용자 요청 해석, 전문 프로필 라우팅, 결과 통합',
    status: 'healthy',
    lastUsedAt: '방금 전',
    recentTask: 'Hermes 프론트엔드 홈페이지 기획안 작성',
    callCount: 128,
  },
  {
    id: 'server',
    name: 'server',
    role: 'VPS, Docker, gateway 관리, 서버 상태 및 로그 배포 모니터링',
    status: 'idle',
    lastUsedAt: '10분 전',
    recentTask: 'Vercel 배포 완료 상태 확인',
    callCount: 42,
  },
  {
    id: 'mac',
    name: 'mac',
    role: '로컬 장비 제어, 파일 시스템 연동, 환경 설정 빌드',
    status: 'healthy',
    lastUsedAt: '3분 전',
    recentTask: '로컬 캐시 정리 및 환경 변수 파일 생성',
    callCount: 89,
  },
  {
    id: 'dev-pm',
    name: 'dev-pm',
    role: '개발 프로젝트 매니징, 태스크 분해, 개발 로드맵 산출',
    status: 'healthy',
    lastUsedAt: '방금 전',
    recentTask: 'Hermes 프론트엔드 홈페이지 기획안 작성',
    callCount: 65,
  },
  {
    id: 'dev-builder',
    name: 'dev-builder',
    role: '실제 React/Vite 코드 작성, 버그 수정, 린트 및 빌드 검증',
    status: 'idle',
    lastUsedAt: '1시간 전',
    recentTask: 'Tailwind CSS 테마 설정 최적화',
    callCount: 54,
  },
  {
    id: 'obsidian-architect',
    name: 'obsidian-architect',
    role: 'Obsidian 볼트(Vault) 구조 설계, 지식 보관 흐름 및 링크 관계 정의',
    status: 'idle',
    lastUsedAt: '30분 전',
    recentTask: 'Atomic note 관계 맵 구축',
    callCount: 73,
  },
  {
    id: 'ad-pm',
    name: 'ad-pm',
    role: '광고 캠페인 매니징, 팀원 배정 및 최종 카피/디자인 검토',
    status: 'idle',
    lastUsedAt: '2시간 전',
    recentTask: '신규 화장품 브랜드 런칭 광고 기획',
    callCount: 31,
  },
  {
    id: 'ad-researcher',
    name: 'ad-researcher',
    role: '시장 리서치, 경쟁사 광고 소스 분석, 타겟 고객 군 설정',
    status: 'idle',
    lastUsedAt: '2시간 전',
    recentTask: '신규 화장품 브랜드 런칭 광고 기획',
    callCount: 29,
  },
  {
    id: 'ad-planner',
    name: 'ad-planner',
    role: '광고 컨셉 제안, 메시지 맵 작성, 매체 집행 계획 수립',
    status: 'idle',
    lastUsedAt: '2시간 전',
    recentTask: '신규 화장품 브랜드 런칭 광고 기획',
    callCount: 35,
  },
  {
    id: 'ad-copywriter',
    name: 'ad-copywriter',
    role: '헤드카피, 서브카피, 상세 상세 페이지 원고 및 슬로건 작성',
    status: 'idle',
    lastUsedAt: '2시간 전',
    recentTask: '신규 화장품 브랜드 런칭 광고 기획',
    callCount: 48,
  },
  {
    id: 'ad-art-director',
    name: 'ad-art-director',
    role: '비주얼 키컨셉 설정, 배너 디자인 가이드, 이미지 생성 프롬프트 설계',
    status: 'idle',
    lastUsedAt: '5시간 전',
    recentTask: 'IT 제품 배너 광고 비주얼 에셋 설계',
    callCount: 19,
  },
  {
    id: 'health-advisor',
    name: 'health-advisor',
    role: '수집된 헬스 데이터 분석, 수면 및 운동 패턴 기반 맞춤 조언 리포트 작성',
    status: 'idle',
    lastUsedAt: '1일 전',
    recentTask: '주간 수면 효율 분석 및 가이드',
    callCount: 15,
  },
  {
    id: 'stock-researcher',
    name: 'stock-researcher',
    role: '글로벌 증시 모니터링, 주요 공시 및 뉴스 요약, 관심 종목 분석 보고서 작성',
    status: 'idle',
    lastUsedAt: '4시간 전',
    recentTask: '반도체 산업 주요 이슈 정리',
    callCount: 22,
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task_001',
    title: 'Hermes 프론트엔드 홈페이지 기획안 작성',
    status: 'in_progress',
    owner: 'router',
    profiles: ['router', 'dev-pm'],
    currentStep: '기획안 정리 및 v0.1 화면 범위 확정',
    nextAction: 'Vite React 기반 프로토타입 배포',
    updatedAt: '2026-07-11 14:20',
    progress: 68,
    estimatedTime: '4분',
  },
  {
    id: 'task_002',
    title: 'Mimir 뉴스레터 자동 수집 및 파이낸셜 요약',
    status: 'in_progress',
    owner: 'router',
    profiles: ['router', 'stock-researcher'],
    currentStep: '해외 뉴스레터 RSS 파싱 및 필터링',
    nextAction: '요약 보고서 Obsidian 자동 업로드',
    updatedAt: '2026-07-11 14:15',
    progress: 35,
    estimatedTime: '12분',
  },
  {
    id: 'task_003',
    title: 'gateway SSL 인증서 자동 갱신 및 재시작 승인',
    status: 'needs_review',
    owner: 'server',
    profiles: ['server'],
    currentStep: 'SSL 인증서 발급 완료, 데몬 재시작 승인 대기',
    nextAction: '사용자 보안 인증 후 게이트웨이 재시작 수행',
    updatedAt: '2026-07-11 13:58',
    progress: 90,
    estimatedTime: '승인 대기',
  },
  {
    id: 'task_004',
    title: '개발용 Sandbox 컨테이너 자원 한도 초과 오류 해결',
    status: 'completed',
    owner: 'server',
    profiles: ['server', 'mac'],
    currentStep: 'Docker volume 가비지 컬렉션 수행 완료',
    nextAction: '없음',
    updatedAt: '2026-07-11 11:30',
    progress: 100,
    estimatedTime: '완료',
  },
  {
    id: 'task_005',
    title: '블로그 마케팅 광고 슬로건 및 아트 가이드 작성',
    status: 'completed',
    owner: 'router',
    profiles: ['router', 'ad-pm', 'ad-copywriter', 'ad-art-director'],
    currentStep: '헤드카피 도출 및 3종 비주얼 에셋 저장 완료',
    nextAction: '없음',
    updatedAt: '2026-07-11 10:15',
    progress: 100,
    estimatedTime: '완료',
  },
];

export const INITIAL_KNOWLEDGE: KnowledgePipeline = {
  newsletterCollected: 24,
  sourceSaved: 20,
  reportCreated: 8,
  atomicNoteCreated: 14,
  needsReview: 4,
  errors: 0,
  obsidianSavedToday: 6,
  missingLinks: 1,
  missingTags: 2,
};

export const INITIAL_EVENTS: EventLog[] = [
  {
    id: 'evt_001',
    time: '14:20:00',
    actor: 'router',
    action: '사용자 요청을 [Hermes Dashboard 기획안 작성]으로 분류 및 진행',
    level: 'info',
  },
  {
    id: 'evt_002',
    time: '14:18:32',
    actor: 'dev-pm',
    action: 'Hermes 프론트엔드 v0.1 요구 사양 분석 및 화면 구조 설계 수립 완료',
    level: 'success',
  },
  {
    id: 'evt_003',
    time: '14:15:00',
    actor: 'router',
    action: 'Mimir 뉴스레터 수집 스크립트 실행 (수집 대상: 3개 RSS 채널)',
    level: 'info',
  },
  {
    id: 'evt_004',
    time: '14:10:12',
    actor: 'stock-researcher',
    action: '반도체 산업 일일 공시 원시 데이터 분석 시작',
    level: 'info',
  },
  {
    id: 'evt_005',
    time: '13:58:45',
    actor: 'server',
    action: 'gateway SSL 인증서 갱신 감지. 웹소켓 프록시 재구동 승인 요청 생성',
    level: 'warning',
  },
  {
    id: 'evt_006',
    time: '11:30:22',
    actor: 'server',
    action: 'Docker 컨테이너 미사용 볼륨 prune 완료 (8.2GB 공간 확보)',
    level: 'success',
  },
  {
    id: 'evt_007',
    time: '11:15:00',
    actor: 'mac',
    action: '로컬 장비 CPU 로드 일시적 스파이크 감지 (사용률 94%). 자동 스로틀링 적용',
    level: 'warning',
  },
  {
    id: 'evt_008',
    time: '10:15:00',
    actor: 'ad-copywriter',
    action: '신규 브랜드 런칭 카피안 4종 작성 완료 및 Obsidian 아카이브 전송',
    level: 'success',
  },
];

// 가상 요청 시나리오 목록
export interface ScenarioStep {
  delay: number;
  actor: string;
  action: string;
  level: EventLevel;
  taskTitle?: string;
  taskStep?: string;
  taskNext?: string;
  taskStatus?: TaskStatus;
  profilesInvolved?: string[];
  knowledgeIncrement?: Partial<KnowledgePipeline>;
  progress?: number;
  estimatedTime?: string;
}

export const SCENARIOS: Record<string, ScenarioStep[]> = {
  ad: [
    {
      delay: 500,
      actor: 'router',
      action: '사용자 요청 ["친환경 텀블러 SNS 광고 기획"] 접수. 광고 프로필 활성화',
      level: 'info',
      taskTitle: '친환경 텀블러 SNS 광고 기획',
      taskStep: '요청 수신 및 타겟 분석 시작',
      taskNext: '시장 조사 및 타겟 세그먼트 도출',
      taskStatus: 'in_progress',
      profilesInvolved: ['router', 'ad-pm'],
      progress: 15,
      estimatedTime: '8분',
    },
    {
      delay: 2500,
      actor: 'ad-pm',
      action: '작업 할당 수행: ad-researcher(시장 분석), ad-planner(메시지 컨셉)',
      level: 'info',
      taskStep: '전문 팀원 업무 분배 완료',
      taskNext: '경쟁사 타겟 분석 보고서 작성',
      profilesInvolved: ['router', 'ad-pm', 'ad-researcher', 'ad-planner'],
      progress: 35,
      estimatedTime: '6분',
    },
    {
      delay: 5000,
      actor: 'ad-researcher',
      action: '친환경 텀블러 시장 조사 완료. "MZ 세대의 제로웨이스트 트렌드" 주요 소구점 설정',
      level: 'success',
      taskStep: '시장 타겟 분석 완료',
      taskNext: '헤드카피 및 슬로건 초안 작성',
      knowledgeIncrement: { newsletterCollected: 1, sourceSaved: 1 },
      progress: 55,
      estimatedTime: '4분',
    },
    {
      delay: 7500,
      actor: 'ad-copywriter',
      action: '광고 헤드 카피 도출: "지구를 지키는 한 걸음, 나만의 온도를 채우다."',
      level: 'success',
      taskStep: 'SNS 맞춤형 카피라이팅 작성 완료',
      taskNext: '비주얼 무드보드 및 이미지 프롬프트 생성',
      profilesInvolved: ['router', 'ad-pm', 'ad-researcher', 'ad-planner', 'ad-copywriter'],
      knowledgeIncrement: { reportCreated: 1 },
      progress: 75,
      estimatedTime: '2분',
    },
    {
      delay: 10000,
      actor: 'ad-art-director',
      action: '텀블러 실물 3D 무드 컷 생성용 Midjourney 프롬프트 설계 완료',
      level: 'success',
      taskStep: '비주얼 가이드라인 및 프롬프트 확정',
      taskNext: '최종 기획안 취합 및 Obsidian 저장',
      profilesInvolved: ['router', 'ad-pm', 'ad-researcher', 'ad-planner', 'ad-copywriter', 'ad-art-director'],
      progress: 90,
      estimatedTime: '1분',
    },
    {
      delay: 12500,
      actor: 'obsidian-architect',
      action: '기획안을 Obsidian 보관소 [/Marketing/2026/Tumbler_Campaign.md] 에 저장 완료',
      level: 'success',
      taskStep: '기획 작업 완료 및 아카이브 완료',
      taskNext: '없음',
      taskStatus: 'completed',
      knowledgeIncrement: { atomicNoteCreated: 2, obsidianSavedToday: 1 },
      progress: 100,
      estimatedTime: '완료',
    }
  ],
  dev: [
    {
      delay: 500,
      actor: 'router',
      action: '사용자 요청 ["Hermes 상태 모니터 전송용 API 개발"] 분석 완료. 개발 프로필 할당',
      level: 'info',
      taskTitle: '상태 모니터 API 개발',
      taskStep: 'API 스펙 설계 및 엔드포인트 도출',
      taskNext: '라우터 코드 구현',
      taskStatus: 'in_progress',
      profilesInvolved: ['router', 'dev-pm'],
      progress: 20,
      estimatedTime: '5분',
    },
    {
      delay: 3000,
      actor: 'dev-pm',
      action: 'API 요구사항 구체화 완료: GET /api/status 및 POST /api/event 구현',
      level: 'info',
      taskStep: '기능 명세 완료',
      taskNext: 'Express 라우터 및 미들웨어 통합',
      profilesInvolved: ['router', 'dev-pm', 'dev-builder'],
      progress: 50,
      estimatedTime: '3분',
    },
    {
      delay: 6000,
      actor: 'dev-builder',
      action: 'Express 기반 API 엔드포인트 구현 및 로컬 테스트 통과 (200 OK)',
      level: 'success',
      taskStep: '코드 구현 및 로컬 유닛 테스트 통과',
      taskNext: '서버 Docker 컨테이너 재배포',
      profilesInvolved: ['router', 'dev-pm', 'dev-builder', 'server'],
      progress: 80,
      estimatedTime: '1분',
    },
    {
      delay: 9000,
      actor: 'server',
      action: 'Docker 빌드 성공. 신규 모니터링 컨테이너 Rolling Update 완료',
      level: 'success',
      taskStep: '서버 클라우드 배포 완료',
      taskNext: '없음',
      taskStatus: 'completed',
      progress: 100,
      estimatedTime: '완료',
    }
  ],
  obsidian: [
    {
      delay: 500,
      actor: 'router',
      action: '사용자 요청 ["오늘 수집된 인공지능 연구자료 정리"] 처리 개시',
      level: 'info',
      taskTitle: 'AI 연구자료 Obsidian 수집 정리',
      taskStep: '오늘 수집된 소스 파일 취합',
      taskNext: '주요 인사이트 분석 및 요약',
      taskStatus: 'in_progress',
      profilesInvolved: ['router', 'obsidian-architect'],
      progress: 25,
      estimatedTime: '4분',
    },
    {
      delay: 2500,
      actor: 'obsidian-architect',
      action: '오늘자 뉴스레터 4건 분석: LLM 에이전트 협업 체계 신규 아키텍처 추출',
      level: 'info',
      taskStep: '핵심 내용 및 요약 정보 작성',
      taskNext: '원자 단위 노트 분할 및 링크 관계 형성',
      knowledgeIncrement: { newsletterCollected: 4, sourceSaved: 4 },
      progress: 65,
      estimatedTime: '1분',
    },
    {
      delay: 5000,
      actor: 'obsidian-architect',
      action: '인사이트 노트 3건 생성 완료 및 기존 Agent_Network 노드와 양방향 링크(Wiki Link) 체결',
      level: 'success',
      taskStep: '원자적 지식 저장 및 링크 연결 완료',
      taskNext: '없음',
      taskStatus: 'completed',
      knowledgeIncrement: { reportCreated: 1, atomicNoteCreated: 3, obsidianSavedToday: 3, missingLinks: -1 },
      progress: 100,
      estimatedTime: '완료',
    }
  ]
};

// 지식 보관소 (Obsidian Atomic Vault) 마크다운 실시간 뷰어 데이터
import { KnowledgeDoc } from './types';

export const MOCK_KNOWLEDGE_DOCS: KnowledgeDoc[] = [
  {
    id: 'doc_001',
    name: 'Tumbler_Campaign.md',
    category: 'atomic',
    path: '/Marketing/2026/Tumbler_Campaign.md',
    tags: ['#marketing', '#ad-pm', '#concept'],
    size: '3.4KB',
    date: '방금 전',
    content: `# 친환경 텀블러 SNS 광고 마케팅 기획안
    
## 1. 캠페인 컨셉
* **메인 슬로건**: "지구를 지키는 한 걸음, 나만의 온도를 채우다."
* **핵심 타겟**: MZ세대 및 제로웨이스트(Zero Waste) 라이프스타일 지향 소비자층
* **기획 배경**: 일회용 플라스틱 컵 퇴출 흐름과 개인형 텀블러 사용 일상화 연결

## 2. SNS 카피라이팅 가이드 (by @ad-copywriter)
* **메인 카피**: 매일 버려지는 컵 대신, 나만의 라이프스타일을 담으세요.
* **서브 카피**: 24시간 변함없는 온도 유지, 환경을 생각하는 가장 스마트한 행동.
* **해시태그**: #친환경라이프 #텀블러추천 #제로웨이스트 #지속가능성 #UGNAS_AI

## 3. 비주얼 키 프롬프트 (by @ad-art-director)
> \`/imagine prompt: minimalist reusable tumbler bottle on a sleek marble table, soft morning sunlight casting natural branch shadows, aesthetic green leaves, 8k resolution, photorealistic, cinematic light --ar 16:9\`

## 4. 연관 지식 노드 링크
* [[Zero_Waste_Trend_2026]]
* [[Marketing_Strategy_Vault]]
`
  },
  {
    id: 'doc_002',
    name: 'LLM_Agent_Orchestration.md',
    category: 'report',
    path: '/Research/AI/Agent/LLM_Agent_Orchestration.md',
    tags: ['#ai-agent', '#router', '#architecture'],
    size: '5.2KB',
    date: '5분 전',
    content: `# LLM 기반 멀티 에이전트 협업 체계 신규 아키텍처
    
## 1. 아키텍처 개요
본 아키텍처는 하나의 큰 언어 모델이 모든 영역을 감당하는 대신, **router**역할을 하는 게이트웨이 LLM이 자연어 요구사항을 수집한 뒤 전문화된 **Sub-agent Profile**들에게 순차적 또는 병렬적으로 작업을 파이프라이닝(Pipelining)해 전달하는 유기적 구조입니다.

## 2. 에이전트 라우팅 가이드
* **동적 해석**: 사용자의 입력을 받아 개발(dev), 광고(ad), 투자(stock), 건강(health) 등 핵심 도메인 벡터 분류
* **상태 동기화**: Redis 기반 단일 세션 키 공유를 통한 작업 상태(State Machine) 동시 관리

## 3. 시나리오 협업 워크플로우 예시
1. **사용자 입력** -> "SNS 광고 제안서 생성해줘"
2. **router** -> 요청 맥락 분석 후 \`ad-pm\` 활성화
3. **ad-pm** -> 업무 세분화 후 \`ad-researcher\` 및 \`ad-copywriter\` 동시 기동
4. **결과 취합** -> Obsidian 아카이브 연동

## 4. 한계 및 개선 방향
* 에이전트 호출 간의 컨텍스트 윈도우 한계 극복을 위한 [[RAG_System_Mimir]] 연결
* 다단계 멀티에이전트 토큰 병목 현상 해소를 위해 로컬 LLM 오프로딩 기술 검토
`
  },
  {
    id: 'doc_003',
    name: 'SSL_Certificate_Daemon_Guide.md',
    category: 'source',
    path: '/Server/Security/SSL_Certificate_Daemon_Guide.md',
    tags: ['#server', '#ssl', '#security'],
    size: '1.8KB',
    date: '25분 전',
    content: `# gateway SSL 인증서 자동 갱신 데몬 구축 가이드
    
## 1. 요구 사항
* Let's Encrypt를 활용한 와일드카드 인증서 발급 자동화
* Nginx Reverse Proxy 컨테이너 무중단 설정 리로드 (\`nginx -s reload\`)

## 2. 크론 스케줄 구성
매월 1일 새벽 3시에 갱신 데몬이 자동으로 가동되어 Let's Encrypt API를 호출하고 자격 증명을 갱신합니다.
\`\`\`bash
0 3 1 * * /usr/local/bin/certbot renew --quiet --post-hook "nginx -s reload"
\`\`\`

## 3. 예외 상황 처리 (Warning)
* **포트 충돌**: 인증서 갱신 시점에 80포트 바인딩 확인 필수
* **승인 필요**: SSL 교체 이후 웹소켓 라우트가 차단되지 않도록 사용자 콘솔([[UGNAS_AI_Dashboard]])의 수동 승인 신호 수신 대기 구조 결합
`
  },
  {
    id: 'doc_004',
    name: 'Water_Intake_Smart_Advice.md',
    category: 'atomic',
    path: '/Health/Personal/Water_Intake_Smart_Advice.md',
    tags: ['#health', '#pattern', '#daily'],
    size: '2.1KB',
    date: '2시간 전',
    content: `# 개인 맞춤형 수분 섭취 가이드 리포트
    
## 1. 데이터 분석 결과
* **활동량**: 일일 평균 9,200보
* **수면 효율**: 평균 84%
* **분석 의견**: 카페인 섭취가 많은 날 수분 손실률이 급격히 증가함. 수면 중 탈수 방지를 위해 기상 직후 300ml 섭취 적극 권장.

## 2. 스마트 어드바이스
* 하루 권장 섭취량: **2.3 Liters**
* 알림 인터벌: 모바일 웨어러블 밴드 동기화를 통해 매 2시간마다 소프트 진동 가이드 전달.

## 3. 원자 노드 연결
* [[Daily_Health_Streak]]
* [[Bio_Sensor_Integration]]
`
  },
  {
    id: 'doc_005',
    name: 'Newsletter_AI_Revolution.md',
    category: 'newsletter',
    path: '/Inbox/Newsletter_AI_Revolution.md',
    tags: ['#ai-trend', '#newsletter'],
    size: '4.8KB',
    date: '오늘 아침',
    content: `# [Newsletter] AI Revolution: LLM Context Window 2.0
    
## OpenAI 및 Google의 Context Window 확장 경쟁
최근 릴리즈된 모델들은 수백만 토큰의 컨텍스트 윈도우를 기본 지원하기 시작했습니다. 이로 인해 과거의 정교한 RAG(검색 증강 생성) 무용론이 일시적으로 고개를 들었으나, 토큰 비용 단가 및 탐색 레이턴시 측면에서 여전히 경량 벡터 검색과 원자적 노트 정리 체계([[Obsidian_Atomic_Method]])가 절대적으로 우위에 있음이 검증되었습니다.

## 핵심 요약 및 인사이트
1. **롱 컨텍스트**: 한 번에 소설책 여러 권 분량을 읽을 수 있으나, "Needle in a Haystack" 현상(중간 영역 소실)은 여전히 잔존함.
2. **비용 효율**: 원자 노드로 요약 압축된 데이터만을 LLM에 프롬프트로 공급하는 구조가 토큰 사용량을 90% 이상 절감함.
`
  }
];
