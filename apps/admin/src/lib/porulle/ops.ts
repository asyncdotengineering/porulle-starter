import 'server-only';
import { porulle } from './client';

export interface FailedJob {
  attempts: number;
  createdAt: string;
  error: string;
  id: string;
  name: string;
}

export interface CompensationFailure {
  createdAt: string;
  error: string;
  id: string;
  operation: string;
}

type ApiResult = { data?: unknown; error?: unknown };

function str(v: unknown, fallback = ''): string {
  return v == null ? fallback : String(v);
}

export async function listFailedJobs(): Promise<FailedJob[]> {
  const res = (await porulle.GET('/api/admin/jobs/failed', {} as never)) as ApiResult;
  const rows = ((res.data as { data?: Array<Record<string, unknown>> })?.data ?? []) as Array<
    Record<string, unknown>
  >;
  return rows.map((r) => ({
    id: str(r.id),
    name: str(r.name ?? r.type ?? r.jobType, 'job'),
    error: str(r.error ?? r.lastError ?? r.failureReason, '—'),
    attempts: Number(r.attempts ?? r.attemptCount ?? 0),
    createdAt: str(r.failedAt ?? r.updatedAt ?? r.createdAt)
  }));
}

export async function listCompensationFailures(): Promise<CompensationFailure[]> {
  const res = (await porulle.GET('/api/admin/compensation-failures', {} as never)) as ApiResult;
  const rows = ((res.data as { data?: Array<Record<string, unknown>> })?.data ?? []) as Array<
    Record<string, unknown>
  >;
  return rows.map((r) => ({
    id: str(r.id),
    operation: str(r.operation ?? r.sagaName ?? r.step, 'operation'),
    error: str(r.error ?? r.reason, '—'),
    createdAt: str(r.createdAt ?? r.failedAt)
  }));
}

export async function retryJob(id: string): Promise<{ error?: string }> {
  const res = (await porulle.POST('/api/admin/jobs/{id}/retry', {
    params: { path: { id } }
  } as never)) as { error?: { error?: { message?: string } } };
  if (res.error) return { error: res.error.error?.message ?? 'Failed to retry job.' };
  return {};
}

export async function resolveCompensation(id: string): Promise<{ error?: string }> {
  const res = (await porulle.POST('/api/admin/compensation-failures/{id}/resolve', {
    params: { path: { id } }
  } as never)) as { error?: { error?: { message?: string } } };
  if (res.error) return { error: res.error.error?.message ?? 'Failed to resolve.' };
  return {};
}
