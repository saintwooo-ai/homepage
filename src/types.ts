/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TaskStatus = 'in_progress' | 'completed' | 'needs_review' | 'failed' | 'idle';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  owner: string;
  profiles: string[];
  currentStep: string;
  nextAction: string;
  updatedAt: string;
  progress: number;        // 진척도 (0 ~ 100)
  estimatedTime: string;   // 예상 소요시간 (e.g. "3분", "완료", "대기")
}

export interface KnowledgeDoc {
  id: string;
  name: string;
  category: 'newsletter' | 'source' | 'report' | 'atomic';
  path: string;
  tags: string[];
  size: string;
  date: string;
  content: string; // Markdown formatted content
}

export type ProfileStatus = 'healthy' | 'warning' | 'error' | 'idle';

export interface Profile {
  id: string;
  name: string;
  role: string;
  status: ProfileStatus;
  lastUsedAt: string;
  recentTask: string;
  callCount: number;
}

export interface KnowledgePipeline {
  newsletterCollected: number;
  sourceSaved: number;
  reportCreated: number;
  atomicNoteCreated: number;
  needsReview: number;
  errors: number;
  obsidianSavedToday: number;
  missingLinks: number;
  missingTags: number;
}

export type EventLevel = 'info' | 'warning' | 'error' | 'success';

export interface EventLog {
  id: string;
  time: string;
  actor: string;
  action: string;
  level: EventLevel;
}

export interface DashboardStats {
  inProgress: number;
  completed: number;
  needsReview: number;
  failed: number;
}
