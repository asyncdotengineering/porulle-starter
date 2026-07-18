import 'server-only';
import { PORULLE_API_URL, PORULLE_ADMIN_API_KEY } from './client';

// Multipart upload can't go through openapi-fetch, so we post the FormData
// directly with the admin API key (which bypasses CSRF as of porulle 0.7.0).
export async function uploadImage(file: File): Promise<{ error?: string; url?: string }> {
  const form = new FormData();
  form.append('file', file);
  form.append('alt', file.name);

  const res = await fetch(`${PORULLE_API_URL}/api/media/upload`, {
    method: 'POST',
    headers: {
      ...(PORULLE_ADMIN_API_KEY ? { 'x-api-key': PORULLE_ADMIN_API_KEY } : {})
    },
    body: form
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    return { error: body?.error?.message ?? `Upload failed (${res.status}).` };
  }
  const body = (await res.json()) as { data?: { url?: string } };
  const url = body.data?.url;
  return url ? { url } : { error: 'Upload returned no URL.' };
}
