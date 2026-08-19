import { PublicUser } from './user';
import { Message } from './message';

export interface Conversation {
  id: number;
  type: 'private' | 'group';
  participants: PublicUser[];
  latest_message?: Message | null;
  created_at: string;
  updated_at: string;
}
