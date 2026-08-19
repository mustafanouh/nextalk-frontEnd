import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { env } from '@/config/env';
import { TOKEN_STORAGE_KEY } from './axios';

// Pusher must be attached to window for laravel-echo's pusher broadcaster
// to pick it up.
declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

let echoInstance: Echo<'reverb'> | null = null;

/**
 * Lazily create a single Echo connection. Call this only after the user is
 * authenticated (it authorizes private/presence channels via Sanctum).
 * Re-calling after logout (echo=null) creates a fresh connection with the
 * new user's token.
 */
export function getEcho(): Echo<'reverb'> {
  if (echoInstance) return echoInstance;

  if (typeof window !== 'undefined') {
    window.Pusher = Pusher;
  }

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: env.reverb.appKey,
    wsHost: env.reverb.host,
    wsPort: env.reverb.port,
    wssPort: env.reverb.port,
    forceTLS: env.reverb.scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${env.apiUrl}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : ''}`,
        Accept: 'application/json',
      },
    },
  });

  return echoInstance;
}

/**
 * Tear down the connection entirely — call on logout so the next login
 * authenticates fresh private/presence channels under the new token.
 */
export function disconnectEcho(): void {
  echoInstance?.disconnect();
  echoInstance = null;
}
