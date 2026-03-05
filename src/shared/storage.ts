import type { ExtensionSettings, SavedPrompt, QueuedPrompt, DEFAULT_SETTINGS } from './types';
import { DEFAULT_SETTINGS as DEFAULTS } from './types';

// ── Settings ──
export async function getSettings(): Promise<ExtensionSettings> {
  const result = await chrome.storage.local.get('settings');
  return result.settings ?? { ...DEFAULTS };
}

export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  const current = await getSettings();
  await chrome.storage.local.set({ settings: { ...current, ...settings } });
}

// ── Recent saves ──
export async function getRecentSaves(limit = 10): Promise<SavedPrompt[]> {
  const result = await chrome.storage.local.get('recentSaves');
  const saves: SavedPrompt[] = result.recentSaves ?? [];
  return saves.slice(0, limit);
}

export async function addRecentSave(prompt: SavedPrompt): Promise<void> {
  const saves = await getRecentSaves(100);
  saves.unshift(prompt);
  // Keep only last 100
  await chrome.storage.local.set({ recentSaves: saves.slice(0, 100) });
}

// ── Offline queue ──
export async function getQueue(): Promise<QueuedPrompt[]> {
  const result = await chrome.storage.local.get('offlineQueue');
  return result.offlineQueue ?? [];
}

export async function addToQueue(item: QueuedPrompt): Promise<void> {
  const queue = await getQueue();
  queue.push(item);
  await chrome.storage.local.set({ offlineQueue: queue });
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  await chrome.storage.local.set({
    offlineQueue: queue.filter((q) => q.id !== id),
  });
}

export async function clearQueue(): Promise<void> {
  await chrome.storage.local.set({ offlineQueue: [] });
}
