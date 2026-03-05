import fs from 'fs/promises';
import path from 'path';
import type { ClassificationResult } from './classifier';

const PROMPTS_DIR = process.env.PROMPTS_DIR || path.join(process.cwd(), 'prompts');

export interface PromptRecord {
  id: string;
  text: string;
  title: string;
  category: string;
  tags: string[];
  source: string;
  sourceUrl: string;
  created: string;
}

export async function ensurePromptsDir(): Promise<void> {
  await fs.mkdir(PROMPTS_DIR, { recursive: true });
}

export async function savePromptAsMarkdown(
  id: string,
  text: string,
  source: string,
  sourceUrl: string,
  timestamp: string,
  classification: ClassificationResult
): Promise<PromptRecord> {
  await ensurePromptsDir();

  const record: PromptRecord = {
    id,
    text,
    title: classification.title,
    category: classification.category,
    tags: classification.tags,
    source,
    sourceUrl,
    created: timestamp,
  };

  const frontmatter = [
    '---',
    `id: ${record.id}`,
    `label: "${record.title.replace(/"/g, '\\"')}"`,
    `category: ${record.category}`,
    `tags: [${record.tags.join(', ')}]`,
    `created: ${record.created}`,
    `updated: ${record.created}`,
    `source: ${record.source}`,
    `sourceUrl: ${record.sourceUrl}`,
    '---',
    '',
    record.text,
  ].join('\n');

  const safeTitle = record.title
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 50);

  const filename = `${safeTitle}-${id.substring(id.length - 6)}.md`;
  const filepath = path.join(PROMPTS_DIR, filename);

  await fs.writeFile(filepath, frontmatter, 'utf-8');

  return record;
}

export async function getRecentPrompts(limit = 10): Promise<PromptRecord[]> {
  await ensurePromptsDir();

  const files = await fs.readdir(PROMPTS_DIR);
  const mdFiles = files.filter((f) => f.endsWith('.md')).sort().reverse();

  const records: PromptRecord[] = [];
  for (const file of mdFiles.slice(0, limit)) {
    try {
      const content = await fs.readFile(path.join(PROMPTS_DIR, file), 'utf-8');
      const record = parseFrontmatter(content);
      if (record) records.push(record);
    } catch {
      // Skip unreadable files
    }
  }

  return records;
}

function parseFrontmatter(content: string): PromptRecord | null {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const meta = match[1];
  const text = match[2].trim();

  const get = (key: string): string => {
    const m = meta.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    return m ? m[1].replace(/^["']|["']$/g, '') : '';
  };

  const tagsMatch = meta.match(/^tags:\s*\[(.+)\]$/m);
  const tags = tagsMatch ? tagsMatch[1].split(',').map((t) => t.trim()) : [];

  return {
    id: get('id'),
    text,
    title: get('label'),
    category: get('category'),
    tags,
    source: get('source'),
    sourceUrl: get('sourceUrl'),
    created: get('created'),
  };
}
