// ── Source platforms ──
export type PromptSource = 'chatgpt' | 'claude' | 'midjourney' | 'gemini' | 'manual';

// ── Messages between content script ↔ background ──
export interface SavePromptMessage {
  type: 'SAVE_PROMPT';
  payload: {
    text: string;
    source: PromptSource;
    url: string;
    timestamp: string;
    projectId?: string;
  };
}

export interface GetRecentMessage {
  type: 'GET_RECENT';
}

export interface RetryQueueMessage {
  type: 'RETRY_QUEUE';
}

export interface CheckConnectionMessage {
  type: 'CHECK_CONNECTION';
}

export type ExtensionMessage =
  | SavePromptMessage
  | GetRecentMessage
  | RetryQueueMessage
  | CheckConnectionMessage
  | GetProjectsMessage
  | GetProfileMessage
  | SaveClaudeLogMessage;

// ── API response ──
export interface SavePromptResponse {
  success: boolean;
  promptId?: string;
  title?: string;
  category?: string;
  tags?: string[];
  error?: string;
}

export interface HealthResponse {
  status: 'ok';
  version: string;
}

// ── Stored prompt (in chrome.storage + API) ──
export interface SavedPrompt {
  id: string;
  text: string;
  title: string;
  category: string;
  tags: string[];
  source: PromptSource;
  sourceUrl: string;
  created: string;
  synced: boolean;
}

// ── Settings ──
export interface ExtensionSettings {
  apiUrl: string;
  enabled: boolean;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  apiUrl: 'https://vukixx-server.onrender.com',
  enabled: true,
};

// ── Offline queue item ──
export interface QueuedPrompt {
  id: string;
  text: string;
  source: PromptSource;
  url: string;
  timestamp: string;
}

// ── Digital Twin types ──

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'idea';
export type ProjectPriority = 'high' | 'medium' | 'low';

export interface Project {
  id: string;
  name: string;
  goal: string;
  status: ProjectStatus;
  nextStep: string;
  priority: ProjectPriority;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  name: string;
  role: string;
  bio: string;
  communicationStyle: 'direct' | 'detailed' | 'casual' | 'formal';
  preferredLanguage: 'en' | 'sr';
  preferredStack: string[];
  currentFocus: string;
  updatedAt: string;
}

export interface ClaudeLogEntry {
  id: string;
  projectId: string;
  summary: string;
  outcome: 'success' | 'partial' | 'blocked' | 'info';
  createdAt: string;
}

// ── Digital Twin messages ──

export interface GetProjectsMessage {
  type: 'GET_PROJECTS';
}

export interface GetProfileMessage {
  type: 'GET_PROFILE';
}

export interface SaveClaudeLogMessage {
  type: 'SAVE_CLAUDE_LOG';
  payload: {
    projectId: string;
    summary: string;
    outcome: ClaudeLogEntry['outcome'];
  };
}
