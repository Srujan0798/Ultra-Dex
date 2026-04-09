import path from 'path';
import { fileURLToPath } from 'url';

export function resolveDashboardDistPath(): string {
  const platformDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(platformDir, '../../apps/dashboard/dist');
}
