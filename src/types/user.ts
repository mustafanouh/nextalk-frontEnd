export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

// Trimmed shape returned by /users/search and /users/{username}
export type PublicUser = Pick<User, 'id' | 'username' | 'name' | 'avatar'>;
