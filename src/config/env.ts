function required(name: string, value: string | undefined): string {
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? '';
}

export const env = {
  apiUrl: required('NEXT_PUBLIC_API_URL', process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:8000/api',
  reverb: {
    host: required('NEXT_PUBLIC_REVERB_HOST', process.env.NEXT_PUBLIC_REVERB_HOST) || 'localhost',
    port: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
    scheme: (process.env.NEXT_PUBLIC_REVERB_SCHEME as 'http' | 'https') || 'http',
    appKey: required('NEXT_PUBLIC_REVERB_APP_KEY', process.env.NEXT_PUBLIC_REVERB_APP_KEY),
  },
  stunUrl: process.env.NEXT_PUBLIC_STUN_URL || 'stun:stun.l.google.com:19302',
  turnUrl: process.env.NEXT_PUBLIC_TURN_URL || '',
  turnUsername: process.env.NEXT_PUBLIC_TURN_USERNAME || '',
  turnCredential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || '',
} as const;

// NOTE: nothing here is a secret — Sanctum's token is a bearer token scoped
// to the logged-in user (stored in the auth store / localStorage, not env),
// and Reverb's app key is meant to be public (it's the Pusher-protocol
// "app id" clients use to connect, not a server secret).
