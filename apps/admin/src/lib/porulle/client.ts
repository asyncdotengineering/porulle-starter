import 'server-only';
import { createClient } from '@porulle/sdk';
import type { paths } from './generated/api-types';

export const PORULLE_API_URL = process.env.PORULLE_API_URL ?? 'http://localhost:4000';
export const PORULLE_ADMIN_API_KEY = process.env.PORULLE_ADMIN_API_KEY;

// Server-only admin client. All catalog/order writes are authorized by the
// admin-scoped API key (never exposed to the browser). As of porulle 0.7.0 the
// CSRF guard skips api-key requests, so bodyless server-to-server writes no
// longer need an Origin header (porulle#34).
export const porulle = createClient<paths>({
  baseUrl: PORULLE_API_URL,
  ...(PORULLE_ADMIN_API_KEY ? { auth: { type: 'api_key' as const, key: PORULLE_ADMIN_API_KEY } } : {})
});
