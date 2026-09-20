export type MessageType = 'text' | 'image' | 'file';

export interface Attachment {
  id: number;
  message_id: number;
  original_name: string;
  mime_type: string;
  size: number;
  url: string; // temporary signed URL, resolved server-side
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  type: MessageType;
  body: string | null;
  attachments: Attachment[];
  created_at: string;
  // Present only on optimistic (not-yet-confirmed) messages — see useSendMessage
  status?: 'sending' | 'failed';
  sender?: {
    id: number;
    username: string;
    name: string;
    avatar_thumb_url: string | null;
  };
}
