import React, { useState } from 'react';
import type { ExtensionSettings } from '../../shared/types';

interface SettingsProps {
  settings: ExtensionSettings;
  onSaved: (settings: ExtensionSettings) => void;
}

export function Settings({ settings, onSaved }: SettingsProps) {
  const [apiUrl, setApiUrl] = useState(settings.apiUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(null);

  const handleSave = () => {
    const newSettings: ExtensionSettings = {
      ...settings,
      apiUrl: apiUrl.replace(/\/+$/, ''), // trim trailing slashes
    };
    chrome.storage.local.set({ settings: newSettings }, () => {
      onSaved(newSettings);
    });
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(`${apiUrl.replace(/\/+$/, '')}/api/health`, {
        signal: AbortSignal.timeout(5000),
      });
      setTestResult(res.ok ? 'ok' : 'fail');
    } catch {
      setTestResult('fail');
    } finally {
      setTesting(false);
    }
  };

  const handleRetryQueue = () => {
    chrome.runtime.sendMessage({ type: 'RETRY_QUEUE' }, (result) => {
      if (result?.retried > 0) {
        alert(`Retried ${result.retried} queued prompts. ${result.remaining} remaining.`);
      } else {
        alert('No queued prompts to retry, or server is unreachable.');
      }
    });
  };

  return (
    <div className="vkx-settings">
      <div className="vkx-settings__group">
        <label className="vkx-settings__label">API Server URL</label>
        <div className="vkx-settings__row">
          <input
            className="vkx-settings__input"
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://localhost:3777"
          />
          <button
            className="vkx-btn vkx-btn--secondary"
            onClick={handleTest}
            disabled={testing}
            style={{ whiteSpace: 'nowrap' }}
          >
            {testing ? '...' : 'Test'}
          </button>
        </div>
        {testResult === 'ok' && (
          <span style={{ color: '#34c759', fontSize: 12, fontWeight: 500 }}>
            Connected successfully!
          </span>
        )}
        {testResult === 'fail' && (
          <span style={{ color: '#ff3b30', fontSize: 12, fontWeight: 500 }}>
            Connection failed. Check URL and server.
          </span>
        )}
      </div>

      <button className="vkx-btn vkx-btn--primary" onClick={handleSave}>
        Save Settings
      </button>

      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 16 }}>
        <div className="vkx-settings__group">
          <label className="vkx-settings__label">Offline Queue</label>
          <p style={{ fontSize: 12, color: '#86868b', marginBottom: 8 }}>
            When the server is unreachable, prompts are queued locally and retried automatically every 5 minutes.
          </p>
          <button className="vkx-btn vkx-btn--secondary" onClick={handleRetryQueue}>
            Retry Queued Prompts Now
          </button>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 16 }}>
        <div className="vkx-settings__group">
          <label className="vkx-settings__label">About</label>
          <p style={{ fontSize: 12, color: '#86868b' }}>
            VukixxExtension v1.0.0<br />
            Save prompts from ChatGPT, Claude, Gemini, and Midjourney to your Vukixxx library.
          </p>
        </div>
      </div>
    </div>
  );
}
