import { VukixxAPI } from '../shared/api';
import {
  getSettings,
  addRecentSave,
  getRecentSaves,
  addToQueue,
  getQueue,
  removeFromQueue,
} from '../shared/storage';
import type { ExtensionMessage, SavedPrompt } from '../shared/types';

// ── Message handler ──
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse).catch((err) => {
    sendResponse({ success: false, error: err.message });
  });
  return true; // async response
});

async function handleMessage(message: ExtensionMessage) {
  switch (message.type) {
    case 'SAVE_PROMPT':
      return handleSavePrompt(message.payload);
    case 'GET_RECENT':
      return getRecentSaves(10);
    case 'CHECK_CONNECTION':
      return handleCheckConnection();
    case 'RETRY_QUEUE':
      return handleRetryQueue();
    default:
      return { success: false, error: 'Unknown message type' };
  }
}

// ── Save prompt ──
async function handleSavePrompt(payload: {
  text: string;
  source: string;
  url: string;
  timestamp: string;
}) {
  const settings = await getSettings();
  const api = new VukixxAPI(settings.apiUrl);

  try {
    const result = await api.savePrompt(payload);

    // Save to recent
    const saved: SavedPrompt = {
      id: result.promptId || generateId(),
      text: payload.text.substring(0, 200),
      title: result.title || payload.text.substring(0, 50),
      category: result.category || 'uncategorized',
      tags: result.tags || [],
      source: payload.source as SavedPrompt['source'],
      sourceUrl: payload.url,
      created: payload.timestamp,
      synced: true,
    };
    await addRecentSave(saved);

    return { success: true, ...result };
  } catch (err) {
    // API unreachable — queue for later
    const queueItem = {
      id: generateId(),
      text: payload.text,
      source: payload.source as SavedPrompt['source'],
      url: payload.url,
      timestamp: payload.timestamp,
    };
    await addToQueue(queueItem);

    // Still save locally
    const saved: SavedPrompt = {
      id: queueItem.id,
      text: payload.text.substring(0, 200),
      title: payload.text.substring(0, 50),
      category: 'uncategorized',
      tags: [],
      source: payload.source as SavedPrompt['source'],
      sourceUrl: payload.url,
      created: payload.timestamp,
      synced: false,
    };
    await addRecentSave(saved);

    return { success: true, queued: true, promptId: queueItem.id };
  }
}

// ── Check connection ──
async function handleCheckConnection() {
  const settings = await getSettings();
  const api = new VukixxAPI(settings.apiUrl);
  try {
    await api.checkHealth();
    return { connected: true };
  } catch {
    return { connected: false };
  }
}

// ── Retry queued prompts ──
async function handleRetryQueue() {
  const settings = await getSettings();
  const api = new VukixxAPI(settings.apiUrl);
  const queue = await getQueue();
  let retried = 0;

  for (const item of queue) {
    try {
      await api.savePrompt({
        text: item.text,
        source: item.source,
        url: item.url,
        timestamp: item.timestamp,
      });
      await removeFromQueue(item.id);
      retried++;
    } catch {
      // Still offline, stop retrying
      break;
    }
  }

  return { retried, remaining: queue.length - retried };
}

// ── Periodic retry alarm ──
chrome.alarms.create('retry-queue', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'retry-queue') {
    const queue = await getQueue();
    if (queue.length > 0) {
      await handleRetryQueue();
    }
  }
});

// ── Helpers ──
function generateId(): string {
  return `vkx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}
