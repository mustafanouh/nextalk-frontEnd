import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { env } from '@/config/env';
import { TOKEN_STORAGE_KEY } from './axios';

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

let echoInstance: Echo<'reverb'> | null = null;

function bearerToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return localStorage.getItem(TOKEN_STORAGE_KEY) ?? '';
}

function syncAuthHeader(echo: Echo<'reverb'>): void {
  const headers = (
    echo.connector as {
      options?: {
        auth?: {
          headers?: Record<string, string>;
        };
      };
    }
  ).options?.auth?.headers;

  if (headers) {
    headers.Authorization = `Bearer ${bearerToken()}`;
  }
}

export function getEcho(): Echo<'reverb'> {
  if (typeof window !== 'undefined') {
    window.Pusher = Pusher;
  }

  /*
   * Reuse existing Echo instance.
   */
  if (echoInstance) {
    syncAuthHeader(echoInstance);

    return echoInstance;
  }

  console.log('[Echo] Creating new Echo instance');

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
        Authorization: `Bearer ${bearerToken()}`,
        Accept: 'application/json',
      },
    },
  });

  /*
   * Diagnostics for Pusher/Reverb.
   */
  if (typeof window !== 'undefined') {
    const connector = echoInstance.connector as {
      pusher?: {
        connection?: {
          bind?: (
            event: string,
            callback: (...args: unknown[]) => void
          ) => void;
        };
      };
    };

    const connection = connector.pusher?.connection;

    connection?.bind?.('connecting', () => {
      console.log('[Echo] WebSocket connecting...');
    });

    connection?.bind?.('connected', () => {
      console.log('[Echo] WebSocket connected');
    });

    connection?.bind?.('disconnected', () => {
      console.warn('[Echo] WebSocket disconnected');
    });

    connection?.bind?.('error', (error) => {
      console.error(
        '[Echo] WebSocket error:',
        error
      );
    });

    connection?.bind?.('state_change', (states) => {
      console.log(
        '[Echo] WebSocket state changed:',
        states
      );
    });
  }

  return echoInstance;
}

export function disconnectEcho(): void {
  if (!echoInstance) {
    return;
  }

  console.log('[Echo] Disconnecting');

  echoInstance.disconnect();

  echoInstance = null;
}