import { PlannerItemResult, PlannerSummary } from './types';

export function chunkPlannerItems<T>(items: T[], size: number): T[][] {
  const safeSize = Math.max(Math.floor(size), 1);
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += safeSize) {
    chunks.push(items.slice(i, i + safeSize));
  }
  return chunks;
}

export function summarizePlannerItems(items: PlannerItemResult[]): PlannerSummary {
  const summary: PlannerSummary = {
    totalSeen: items.length,
    totalCreated: 0,
    totalUpdated: 0,
    totalLinkedExisting: 0,
    totalSkipped: 0,
    totalConflicts: 0,
    totalErrors: 0
  };

  for (const item of items) {
    switch (item.action) {
      case 'create':
        summary.totalCreated++;
        break;
      case 'update':
        summary.totalUpdated++;
        break;
      case 'link_existing':
        summary.totalLinkedExisting++;
        break;
      case 'skip':
        summary.totalSkipped++;
        break;
      case 'conflict':
        summary.totalConflicts++;
        break;
      case 'error':
        summary.totalErrors++;
        break;
    }
  }

  return summary;
}
