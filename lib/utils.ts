import slugifyLib from 'slugify';

export function slugify(text: string): string {
  return slugifyLib(text, { lower: true, strict: true, locale: 'pt' });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

export function parseJSON(str: string | null | undefined, fallback: unknown = null): unknown {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}
