import { db } from './firebase-config.js';
import { FieldValue } from 'firebase-admin/firestore';

const COLLECTION = 'prompts';

export interface PromptRecord {
  id: string;
  text: string;
  title: string;
  category: string;
  tags: string[];
  source: string;
  sourceUrl: string;
  classified: boolean;
  confidence: number;
  created: string;
}

/**
 * Save prompt to Firestore WITHOUT AI classification.
 * Desktop app will classify when it sees classified: false.
 */
export async function savePrompt(
  id: string,
  text: string,
  source: string,
  sourceUrl: string,
  timestamp: string,
  projectId: string | null = null
): Promise<PromptRecord> {
  const record: PromptRecord = {
    id,
    text,
    title: '',           // Empty - desktop app will generate
    category: 'other',   // Default - desktop app will classify
    tags: [],            // Empty - desktop app will generate
    source,
    sourceUrl,
    classified: false,   // 🚩 CRITICAL: tells desktop app to classify
    confidence: 0,
    created: timestamp,
  };

  const firestoreData: Record<string, unknown> = {
    text: record.text,
    title: record.title,
    category: record.category,
    tags: record.tags,
    source: record.source,
    sourceUrl: record.sourceUrl,
    classified: record.classified,
    confidence: record.confidence,
    created: new Date(timestamp),
    updated: FieldValue.serverTimestamp(),
  };

  if (projectId) {
    firestoreData.projectId = projectId;
  }

  await db.collection(COLLECTION).doc(id).set(firestoreData);

  return record;
}

export async function getRecentPrompts(limit = 10): Promise<PromptRecord[]> {
  const snapshot = await db
    .collection(COLLECTION)
    .orderBy('created', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      text: data.text,
      title: data.title || '',
      category: data.category || 'other',
      tags: data.tags ?? [],
      source: data.source,
      sourceUrl: data.sourceUrl,
      classified: data.classified ?? false,
      confidence: data.confidence ?? 0,
      created: data.created?.toDate?.()?.toISOString?.() ?? data.created,
    };
  });
}

// ── Digital Twin: Projects ──

export interface ProjectRecord {
  id: string;
  name: string;
  goal: string;
  status: string;
  nextStep: string;
  priority: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export async function getActiveProjects(): Promise<ProjectRecord[]> {
  const snapshot = await db
    .collection('projects')
    .where('status', '==', 'active')
    .orderBy('updatedAt', 'desc')
    .limit(20)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      goal: data.goal || '',
      status: data.status || 'active',
      nextStep: data.nextStep || '',
      priority: data.priority || 'medium',
      tags: data.tags ?? [],
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? '',
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? data.updatedAt ?? '',
    };
  });
}

export async function getAllProjects(): Promise<ProjectRecord[]> {
  const snapshot = await db
    .collection('projects')
    .orderBy('updatedAt', 'desc')
    .limit(50)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      goal: data.goal || '',
      status: data.status || 'active',
      nextStep: data.nextStep || '',
      priority: data.priority || 'medium',
      tags: data.tags ?? [],
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? '',
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? data.updatedAt ?? '',
    };
  });
}

// ── Digital Twin: Profile ──

export interface ProfileRecord {
  name: string;
  role: string;
  bio: string;
  communicationStyle: string;
  preferredLanguage: string;
  preferredStack: string[];
  currentFocus: string;
  updatedAt: string;
}

export async function getProfile(): Promise<ProfileRecord | null> {
  const doc = await db.collection('digitalTwin').doc('profile').get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    name: data.name || '',
    role: data.role || '',
    bio: data.bio || '',
    communicationStyle: data.communicationStyle || 'direct',
    preferredLanguage: data.preferredLanguage || 'sr',
    preferredStack: data.preferredStack ?? [],
    currentFocus: data.currentFocus || '',
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? data.updatedAt ?? '',
  };
}

// ── Digital Twin: Claude Log ──

export interface ClaudeLogRecord {
  id: string;
  projectId: string;
  summary: string;
  outcome: string;
  createdAt: string;
}

export async function saveClaudeLog(
  id: string,
  projectId: string,
  summary: string,
  outcome: string,
): Promise<ClaudeLogRecord> {
  const record: ClaudeLogRecord = {
    id,
    projectId,
    summary,
    outcome,
    createdAt: new Date().toISOString(),
  };

  await db.collection('claudeLogs').doc(id).set({
    ...record,
    created: new Date(),
    updated: FieldValue.serverTimestamp(),
  });

  return record;
}

export async function getPromptById(id: string): Promise<PromptRecord | null> {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;

  const data = doc.data()!;
  return {
    id: doc.id,
    text: data.text,
    title: data.title || '',
    category: data.category || 'other',
    tags: data.tags ?? [],
    source: data.source,
    sourceUrl: data.sourceUrl,
    classified: data.classified ?? false,
    confidence: data.confidence ?? 0,
    created: data.created?.toDate?.()?.toISOString?.() ?? data.created,
  };
}

// ── Task Queue ──

export interface TaskRecord {
  id: string;
  projectId: string;
  task: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'done' | 'error';
  result: string | null;
  createdAt: string;
  completedAt: string | null;
  createdBy: 'user' | 'claude';
}

export async function saveTask(task: TaskRecord): Promise<TaskRecord> {
  await db.collection('tasks').doc(task.id).set({
    ...task,
    _serverTimestamp: FieldValue.serverTimestamp(),
  });
  return task;
}

export async function updateProjectFields(
  projectId: string,
  fields: Partial<{ nextStep: string; status: string; notes: string; priority: string }>
): Promise<void> {
  await db.collection('projects').doc(projectId).update({
    ...fields,
    updatedAt: new Date().toISOString(),
    _webhookUpdatedAt: FieldValue.serverTimestamp(),
  });
}
