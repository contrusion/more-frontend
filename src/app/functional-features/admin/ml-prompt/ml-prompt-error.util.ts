import { HttpErrorResponse } from '@angular/common/http';

interface ApiErrorBody {
  message?: string;
  details?: Record<string, unknown>;
}

/** Turns a backend error response into readable lines for inline display. */
export function extractErrorMessages(error: unknown, fallback: string): string[] {
  const body = (error as HttpErrorResponse | undefined)?.error as ApiErrorBody | string | null | undefined;
  if (!body || typeof body === 'string') {
    return [body || fallback];
  }

  const lines: string[] = [];
  if (body.message) {
    lines.push(body.message);
  }
  if (body.details && typeof body.details === 'object') {
    for (const value of Object.values(body.details)) {
      if (typeof value === 'string' && value !== body.message) {
        lines.push(value);
      } else if (value && typeof value === 'object') {
        for (const nested of Object.values(value as Record<string, unknown>)) {
          if (typeof nested === 'string') {
            lines.push(nested);
          }
        }
      }
    }
  }
  return lines.length > 0 ? lines : [fallback];
}
