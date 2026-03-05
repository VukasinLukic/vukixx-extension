import React from 'react';
import type { SavedPrompt } from '../../shared/types';

interface RecentSavesProps {
  saves: SavedPrompt[];
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export function RecentSaves({ saves }: RecentSavesProps) {
  if (saves.length === 0) {
    return (
      <div className="vkx-recent">
        <div className="vkx-recent__empty">
          No saved prompts yet.<br />
          Use the "Save" tab or click the Vukixxx button on ChatGPT, Claude, Gemini, or Midjourney.
        </div>
      </div>
    );
  }

  return (
    <div className="vkx-recent">
      {saves.map((save) => (
        <div key={save.id} className="vkx-recent__item">
          <div className="vkx-recent__item-header">
            <span className="vkx-recent__item-title">{save.title}</span>
            <span className={`vkx-recent__item-source vkx-recent__item-source--${save.source}`}>
              {save.source}
            </span>
          </div>
          <div className="vkx-recent__item-text">{save.text}</div>
          <div className="vkx-recent__item-meta">
            <span className="vkx-recent__item-time">{formatTime(save.created)}</span>
            <span className={`vkx-recent__item-synced vkx-recent__item-synced--${save.synced ? 'yes' : 'no'}`}>
              {save.synced ? '✓ Synced' : '◌ Queued'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
