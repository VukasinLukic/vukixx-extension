import type { SavePromptResponse, HealthResponse } from './types';

export class VukixxAPI {
  constructor(private baseUrl: string) {}

  async savePrompt(data: {
    text: string;
    source: string;
    url: string;
    timestamp: string;
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
}
