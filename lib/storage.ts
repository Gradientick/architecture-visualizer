import { get, set } from 'idb-keyval';
import type { ArchSession } from './store';
import type { FileTreeNode } from './analyzer';

const SESSIONS_KEY = 'arch-viz-sessions';
const EXTRAS_KEY_PREFIX = 'arch-viz-extras-';

export interface SessionExtra {
  fileTree?: FileTreeNode;
}

/**
 * Load all saved sessions from IndexedDB
 */
export async function loadSessions(): Promise<ArchSession[]> {
  try {
    const data = await get<ArchSession[]>(SESSIONS_KEY);
    return data || [];
  } catch (err) {
    console.error('Failed to load sessions from idb:', err);
    return [];
  }
}

/**
 * Save all sessions to IndexedDB
 */
export async function saveSessions(sessions: ArchSession[]): Promise<void> {
  try {
    await set(SESSIONS_KEY, sessions);
  } catch (err) {
    console.error('Failed to save sessions to idb:', err);
  }
}

/**
 * Load extras (like file tree) for a specific session
 */
export async function loadSessionExtras(sessionId: string): Promise<SessionExtra | null> {
  try {
    const data = await get<SessionExtra>(`${EXTRAS_KEY_PREFIX}${sessionId}`);
    return data || null;
  } catch (err) {
    console.error(`Failed to load extras for session ${sessionId}:`, err);
    return null;
  }
}

/**
 * Save extras for a specific session
 */
export async function saveSessionExtras(sessionId: string, extras: SessionExtra): Promise<void> {
  try {
    await set(`${EXTRAS_KEY_PREFIX}${sessionId}`, extras);
  } catch (err) {
    console.error(`Failed to save extras for session ${sessionId}:`, err);
  }
}
