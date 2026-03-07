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
  | CheckConnectionMessage;

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
