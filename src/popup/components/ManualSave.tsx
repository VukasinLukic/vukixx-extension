import React, { useState } from 'react';
import type { PromptSource } from '../../shared/types';

interface ManualSaveProps {
  onSaved: () => void;
}

export function ManualSave({ onSaved }: ManualSaveProps) {
  const [text, setText] = useState('');
  const [source, setSource] = useState<PromptSource>('manual');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) return;

    setSaving(true);
    try {
      const response = await new Promise<{ success: boolean; error?: string }>((resolve) => {
        chrome.runtime.sendMessage(
          {
            type: 'SAVE_PROMPT',
            payload: {
              text: text.trim(),
              source,
              url: '',
              timestamp: new Date().toISOString(),
            },
          },
          resolve
        );
      });

      if (response.success) {
        setText('');
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) setText(clipText);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div className="vkx-manual">
      <textarea
        className="vkx-manual__textarea"
        placeholder="Paste or type a prompt here...&#10;&#10;Copy any prompt from the web and paste it here to save to Vukixxx."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={saving}
      />

      <div className="vkx-manual__source">
        <label>Source:</label>
        <select value={source} onChange={(e) => setSource(e.target.value as PromptSource)}>
          <option value="manual">Manual / Web</option>
          <option value="chatgpt">ChatGPT</option>
          <option value="claude">Claude</option>
          <option value="gemini">Gemini</option>
          <option value="midjourney">Midjourney</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className="vkx-btn vkx-btn--secondary"
          onClick={handlePaste}
          style={{ flex: '0 0 auto' }}
        >
          Paste
        </button>
        <button
          className="vkx-btn vkx-btn--primary"
          onClick={handleSave}
          disabled={!text.trim() || saving}
          style={{ flex: 1 }}
        >
          {saving ? 'Saving...' : 'Save to Vukixxx'}
        </button>
      </div>
    </div>
  );
}
