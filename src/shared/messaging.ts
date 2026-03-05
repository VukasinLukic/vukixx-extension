import type { ExtensionMessage, SavePromptResponse, SavedPrompt } from './types';

export function sendMessage(message: ExtensionMessage): Promise<SavePromptResponse> {
  return chrome.runtime.sendMessage(message);
}

export function sendSavePrompt(
  text: string,
  source: string,
  url: string
): Promise<SavePromptResponse> {
  return chrome.runtime.sendMessage({
    type: 'SAVE_PROMPT',
    payload: {
      text,
      source,
      url,
      timestamp: new Date().toISOString(),
    },
  });
}

export function getRecentSaves(): Promise<SavedPrompt[]> {
  return chrome.runtime.sendMessage({ type: 'GET_RECENT' });
}

export function checkConnection(): Promise<{ connected: boolean }> {
  return chrome.runtime.sendMessage({ type: 'CHECK_CONNECTION' });
}

export function retryQueue(): Promise<{ retried: number }> {
  return chrome.runtime.sendMessage({ type: 'RETRY_QUEUE' });
}
