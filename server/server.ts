import express from 'express';
import cors from 'cors';
import { savePrompt, getRecentPrompts, getPromptById, getAllProjects, getActiveProjects, getProfile, saveClaudeLog, saveTask, updateProjectFields, type TaskRecord } from './storage.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3777');

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ── Health check ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// ── Save prompt (NO AI classification - desktop app handles it) ──
app.post('/api/prompts', async (req, res) => {
  try {
    const { text, source, url, timestamp, projectId } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ success: false, error: 'Missing or invalid "text" field' });
      return;
    }

    // Generate ID
    const id = `${source || 'manual'}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Save to Firestore WITHOUT classification
    // Desktop app will classify when it sees classified: false
    const record = await savePrompt(
      id,
      text,
      source || 'manual',
      url || '',
      timestamp || new Date().toISOString(),
      projectId || null
    );

    res.json({
      success: true,
      promptId: record.id,
      title: record.title,
      category: record.category,
      tags: record.tags,
      classified: record.classified,
    });
  } catch (err) {
    console.error('Error saving prompt:', err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
});

// ── Get recent prompts ──
app.get('/api/prompts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const prompts = await getRecentPrompts(limit);
    res.json(prompts);
  } catch (err) {
    console.error('Error getting prompts:', err);
    res.status(500).json({ error: 'Failed to get prompts' });
  }
});

// ── Get single prompt ──
app.get('/api/prompts/:id', async (req, res) => {
  try {
    const prompt = await getPromptById(req.params.id);
    if (!prompt) {
      res.status(404).json({ error: 'Prompt not found' });
      return;
    }
    res.json(prompt);
  } catch (err) {
    console.error('Error getting prompt:', err);
    res.status(500).json({ error: 'Failed to get prompt' });
  }
});

// ── Digital Twin: Get projects ──
app.get('/api/projects', async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const projects = status === 'active'
      ? await getActiveProjects()
      : await getAllProjects();
    res.json(projects);
  } catch (err) {
    console.error('Error getting projects:', err);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

// ── Digital Twin: Get profile ──
app.get('/api/profile', async (_req, res) => {
  try {
    const profile = await getProfile();
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json(profile);
  } catch (err) {
    console.error('Error getting profile:', err);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// ── Digital Twin: Save Claude log entry ──
app.post('/api/claude-log', async (req, res) => {
  try {
    const { projectId, summary, outcome } = req.body;

    if (!projectId || !summary) {
      res.status(400).json({ success: false, error: 'Missing projectId or summary' });
      return;
    }

    const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const record = await saveClaudeLog(id, projectId, summary, outcome || 'info');

    res.json({ success: true, logId: record.id });
  } catch (err) {
    console.error('Error saving claude log:', err);
    res.status(500).json({ success: false, error: 'Failed to save log entry' });
  }
});

// ── MCP Webhook — fallback delegate for MCP tool side-effects ──
app.post('/api/mcp-webhook', async (req, res) => {
  try {
    const { type, payload } = req.body as {
      type: 'log' | 'task' | 'project_update';
      payload: Record<string, unknown>;
    };

    if (!type || !payload) {
      res.status(400).json({ success: false, error: 'Missing type or payload' });
      return;
    }

    if (type === 'log') {
      const { projectId, summary, outcome } = payload as { projectId: string; summary: string; outcome?: string };
      if (!projectId || !summary) {
        res.status(400).json({ success: false, error: 'Missing projectId or summary' });
        return;
      }
      const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const record = await saveClaudeLog(id, projectId, summary, outcome ?? 'info');
      res.json({ success: true, type, id: record.id });

    } else if (type === 'task') {
      const task = payload as unknown as TaskRecord;
      if (!task.id || !task.projectId) {
        res.status(400).json({ success: false, error: 'Missing task id or projectId' });
        return;
      }
      await saveTask(task);
      res.json({ success: true, type, taskId: task.id });

    } else if (type === 'project_update') {
      const { projectId, fields } = payload as {
        projectId: string;
        fields: { nextStep?: string; status?: string; notes?: string; priority?: string };
      };
      if (!projectId || !fields) {
        res.status(400).json({ success: false, error: 'Missing projectId or fields' });
        return;
      }
      await updateProjectFields(projectId, fields);
      res.json({ success: true, type });

    } else {
      res.status(400).json({ success: false, error: `Unknown webhook type: ${type}` });
    }
  } catch (err) {
    console.error('Error in mcp-webhook:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Internal error' });
  }
});

// ── Healthz (UptimeRobot ping to prevent Render free tier sleep) ──
app.get('/healthz', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'vukixx-server'
  });
});

// ── Start server ──
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Vukixxx API Server running on http://0.0.0.0:${PORT}`);
  console.log(`  Mode: Capture only (no AI classification)`);
  console.log(`  Storage: Firebase Firestore`);
  console.log(`  Desktop app will classify prompts with classified: false\n`);
});
