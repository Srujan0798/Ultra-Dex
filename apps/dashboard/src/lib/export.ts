export interface CsvRow {
  [key: string]: string | number | boolean | null | undefined;
}

function escapeCsvValue(value: CsvRow[string]): string {
  const normalized = value == null ? '' : String(value);
  if (normalized.includes(',') || normalized.includes('"') || normalized.includes('\n')) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

export function toCsv(rows: CsvRow[]): string {
  if (rows.length === 0) return '';
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const lines = rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(','));
  return [headers.join(','), ...lines].join('\n');
}

export function downloadText(filename: string, content: string, mimeType = 'text/plain'): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function exportCsv(filename: string, rows: CsvRow[]): void {
  const csv = toCsv(rows);
  downloadText(filename, csv, 'text/csv;charset=utf-8');
}

export function createShareLink(
  path: string,
  params: Record<string, string | number | boolean>
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    query.set(key, String(value));
  }
  return `${window.location.origin}${path}?${query.toString()}`;
}
