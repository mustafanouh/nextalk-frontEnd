export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string | null;
  // Backed by Spatie Media Library on the backend now (see backend update
  // plan #6) — avatar_url is the original, avatar_thumb_url a 256x256 crop.
  // No raw `avatar` field exists anymore; use avatar_thumb_url for small
  // UI (list rows, sidebar) and avatar_url for larger contexts (profile).
  avatar_url: string | null;
  avatar_thumb_url: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

// Trimmed shape returned by /users/search and /users/{username}
export type PublicUser = Pick<User, 'id' | 'username' | 'name' | 'avatar_url' | 'avatar_thumb_url'>;
