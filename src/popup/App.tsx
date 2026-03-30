import React, { useState, useEffect, useCallback } from 'react';
import { ManualSave } from './components/ManualSave';
import { RecentSaves } from './components/RecentSaves';
import { Projects } from './components/Projects';
import { Settings } from './components/Settings';
import { StatusBar } from './components/StatusBar';
import type { SavedPrompt, ExtensionSettings, Project } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/types';

type Tab = 'save' | 'recent' | 'projects' | 'settings';

export function App() {
  const [tab, setTab] = useState<Tab>('save');
  const [connected, setConnected] = useState<boolean | null>(null);
  const [queueCount, setQueueCount] = useState(0);
  const [recentSaves, setRecentSaves] = useState<SavedPrompt[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Load settings, check connection, and fetch projects on mount
  useEffect(() => {
    chrome.storage.local.get(['settings', 'recentSaves', 'offlineQueue'], (result) => {
      if (result.settings) setSettings(result.settings);
      if (result.recentSaves) setRecentSaves(result.recentSaves.slice(0, 10));
      if (result.offlineQueue) setQueueCount(result.offlineQueue.length);
    });

    chrome.runtime.sendMessage({ type: 'CHECK_CONNECTION' }, (res) => {
      setConnected(res?.connected ?? false);
    });

    // Fetch projects
    chrome.runtime.sendMessage({ type: 'GET_PROJECTS' }, (res) => {
      if (Array.isArray(res)) setProjects(res);
    });
  }, []);

  const refreshRecent = useCallback(() => {
    chrome.runtime.sendMessage({ type: 'GET_RECENT' }, (saves) => {
      if (Array.isArray(saves)) setRecentSaves(saves);
    });
  }, []);

  const refreshProjects = useCallback(() => {
    chrome.runtime.sendMessage({ type: 'GET_PROJECTS' }, (res) => {
      if (Array.isArray(res)) setProjects(res);
    });
  }, []);

  const handleSaved = useCallback(() => {
    showToast('Prompt saved!', 'success');
    refreshRecent();
  }, [showToast, refreshRecent]);

  const handleLogSaved = useCallback(() => {
    showToast('Claude log saved!', 'success');
  }, [showToast]);

  const handleSettingsSaved = useCallback((newSettings: ExtensionSettings) => {
    setSettings(newSettings);
    showToast('Settings saved!', 'success');
    // Re-check connection with new URL
    chrome.runtime.sendMessage({ type: 'CHECK_CONNECTION' }, (res) => {
      setConnected(res?.connected ?? false);
    });
    // Refresh projects with new URL
    refreshProjects();
  }, [showToast, refreshProjects]);

  return (
    <div className="vkx-popup">
      {/* Header */}
      <div className="vkx-header">
        <div className="vkx-header__title">
          <div className="vkx-header__logo">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L2 4.5V11.5L8 15L14 11.5V4.5L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M8 5V11M5 8H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          Vukixxx
        </div>
      </div>

      {/* Tabs */}
      <div className="vkx-tabs">
        <button
          className={`vkx-tab ${tab === 'save' ? 'vkx-tab--active' : ''}`}
          onClick={() => setTab('save')}
        >
          Save
        </button>
        <button
          className={`vkx-tab ${tab === 'recent' ? 'vkx-tab--active' : ''}`}
          onClick={() => { setTab('recent'); refreshRecent(); }}
        >
          Recent
        </button>
        <button
          className={`vkx-tab ${tab === 'projects' ? 'vkx-tab--active' : ''}`}
          onClick={() => { setTab('projects'); refreshProjects(); }}
        >
          Projects
        </button>
        <button
          className={`vkx-tab ${tab === 'settings' ? 'vkx-tab--active' : ''}`}
          onClick={() => setTab('settings')}
        >
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="vkx-content">
        {tab === 'save' && <ManualSave onSaved={handleSaved} projects={projects} />}
        {tab === 'recent' && <RecentSaves saves={recentSaves} />}
        {tab === 'projects' && <Projects projects={projects} onLogSaved={handleLogSaved} />}
        {tab === 'settings' && <Settings settings={settings} onSaved={handleSettingsSaved} />}
      </div>

      {/* Status bar */}
      <StatusBar connected={connected} queueCount={queueCount} />

      {/* Toast */}
      {toast && (
        <div className={`vkx-toast vkx-toast--${toast.type} vkx-toast--visible`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
