import { toJpeg, toPng, toSvg } from 'html-to-image';

export type ExportFormat = 'png' | 'svg' | 'jpeg';

export async function exportDiagram(
  element: HTMLElement,
  format: ExportFormat = 'png',
  filename = 'architecture-diagram'
): Promise<void> {
  let dataUrl: string;
  const options = {
    backgroundColor: '#0f0f0f',
    pixelRatio: 2, // high-res
    filter: (node: HTMLElement) => {
      // Exclude React Flow controls and minimap from export
      if (node.classList) {
        return (
          !node.classList.contains('react-flow__controls') &&
          !node.classList.contains('react-flow__minimap') &&
          !node.classList.contains('react-flow__panel')
        );
      }
      return true;
    },
  };

  switch (format) {
    case 'svg':
      dataUrl = await toSvg(element, options);
      break;
    case 'jpeg':
      dataUrl = await toJpeg(element, { ...options, quality: 0.95 });
      break;
    case 'png':
    default:
      dataUrl = await toPng(element, options);
  }

  const link = document.createElement('a');
  link.download = `${filename}.${format}`;
  link.href = dataUrl;
  link.click();
}

import { loadSessions, loadSessionExtras, saveSessions, saveSessionExtras, type SessionExtra } from './storage';
import type { ArchSession } from './store';

export async function exportWorkEnvironment() {
  const sessions = await loadSessions();
  const allData: { sessions: ArchSession[], extras: Record<string, SessionExtra> } = { sessions, extras: {} };
  
  for (const s of sessions) {
    const extra = await loadSessionExtras(s.id);
    if (extra) {
      allData.extras[s.id] = extra;
    }
  }

  const jsonStr = JSON.stringify(allData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `arch-viz-environment-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
}

export async function importWorkEnvironment(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (data.sessions && Array.isArray(data.sessions)) {
          const currentSessions = await loadSessions();
          // merge sessions (preventing duplicates by id)
          const merged = [...currentSessions];
          for (const s of data.sessions) {
            if (!merged.find(m => m.id === s.id)) {
              merged.push(s);
            }
          }
          await saveSessions(merged);
          
          if (data.extras) {
            for (const [id, extra] of Object.entries(data.extras)) {
              await saveSessionExtras(id, extra as SessionExtra);
            }
          }
          resolve();
        } else {
          reject(new Error("Invalid format"));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}
