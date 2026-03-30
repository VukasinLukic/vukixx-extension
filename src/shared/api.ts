import type { SavePromptResponse, HealthResponse, Project, UserProfile, ClaudeLogEntry } from './types';

export class VukixxAPI {
  constructor(private baseUrl: string) {}

  async savePrompt(data: {
    text: string;
    source: string;
    url: string;
    timestamp: string;
    projectId?: string;
  }): Promise<SavePromptResponse> {
    const res = await fetch(`${this.baseUrl}/api/prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async getRecent(limit = 10): Promise<SavePromptResponse[]> {
    const res = await fetch(`${this.baseUrl}/api/prompts?limit=${limit}`);
    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  async checkHealth(): Promise<HealthResponse> {
    const res = await fetch(`${this.baseUrl}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }
    return res.json();
  }

  // ── Digital Twin ──

  async getProjects(status?: string): Promise<Project[]> {
    const qs = status ? `?status=${status}` : '';
    const res = await fetch(`${this.baseUrl}/api/projects${qs}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  async getProfile(): Promise<UserProfile | null> {
    const res = await fetch(`${this.baseUrl}/api/profile`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  async saveClaudeLog(data: {
    projectId: string;
    summary: string;
    outcome: ClaudeLogEntry['outcome'];
  }): Promise<{ success: boolean; logId?: string }> {
    const res = await fetch(`${this.baseUrl}/api/claude-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }
}
