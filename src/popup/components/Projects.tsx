import React, { useState } from 'react';
import type { Project, ClaudeLogEntry } from '../../shared/types';

interface ProjectsProps {
  projects: Project[];
  onLogSaved: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ff3b30',
  medium: '#ff9500',
  low: '#86868b',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#34c759',
  paused: '#ff9500',
  completed: '#86868b',
  idea: '#af52de',
};

export function Projects({ projects, onLogSaved }: ProjectsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logSummary, setLogSummary] = useState('');
  const [logOutcome, setLogOutcome] = useState<ClaudeLogEntry['outcome']>('success');
  const [saving, setSaving] = useState(false);

  const handleSaveLog = async (projectId: string) => {
    if (!logSummary.trim()) return;
    setSaving(true);
    try {
      await new Promise<void>((resolve) => {
        chrome.runtime.sendMessage(
          {
            type: 'SAVE_CLAUDE_LOG',
            payload: { projectId, summary: logSummary.trim(), outcome: logOutcome },
          },
          () => resolve()
        );
      });
      setLogSummary('');
      onLogSaved();
    } finally {
      setSaving(false);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="vkx-recent">
        <div className="vkx-recent__empty">
          No projects found.<br />
          Add projects in the Vukixxx desktop app under "Moj Profil".
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {projects.map((p) => {
        const isExpanded = expandedId === p.id;
        return (
          <div key={p.id} className="vkx-recent__item" style={{ cursor: 'pointer' }}>
            <div
              onClick={() => setExpandedId(isExpanded ? null : p.id)}
              style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1d1d1f' }}>{p.name}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 500, padding: '1px 6px', borderRadius: 8,
                    color: STATUS_COLORS[p.status] || '#86868b',
                    background: `${STATUS_COLORS[p.status] || '#86868b'}18`,
                    textTransform: 'uppercase', letterSpacing: '0.3px',
                  }}>{p.status}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 500, padding: '1px 6px', borderRadius: 8,
                    color: PRIORITY_COLORS[p.priority] || '#86868b',
                    background: `${PRIORITY_COLORS[p.priority] || '#86868b'}18`,
                    textTransform: 'uppercase', letterSpacing: '0.3px',
                  }}>{p.priority}</span>
                </div>
              </div>
              <span style={{ fontSize: 11, color: '#86868b', lineHeight: 1.4 }}>{p.goal}</span>
              {p.nextStep && (
                <span style={{ fontSize: 11, color: '#1d1d1f' }}>
                  <span style={{ color: '#86868b' }}>Next: </span>{p.nextStep}
                </span>
              )}
            </div>

            {isExpanded && (
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', marginTop: 8, paddingTop: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#86868b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Quick Claude Log
                </div>
                <input
                  style={{
                    width: '100%', padding: '6px 8px', border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 6, fontSize: 11, fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                  placeholder="What did Claude do?"
                  value={logSummary}
                  onChange={(e) => setLogSummary(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <select
                    style={{
                      padding: '4px 6px', border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: 6, fontSize: 10, fontFamily: 'inherit',
                    }}
                    value={logOutcome}
                    onChange={(e) => setLogOutcome(e.target.value as ClaudeLogEntry['outcome'])}
                  >
                    <option value="success">Success</option>
                    <option value="partial">Partial</option>
                    <option value="blocked">Blocked</option>
                    <option value="info">Info</option>
                  </select>
                  <button
                    className="vkx-btn vkx-btn--primary"
                    style={{ fontSize: 10, padding: '4px 10px', flex: 1 }}
                    disabled={!logSummary.trim() || saving}
                    onClick={() => handleSaveLog(p.id)}
                  >
                    {saving ? '...' : 'Save Log'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
