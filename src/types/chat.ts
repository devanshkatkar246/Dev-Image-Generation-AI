export type Role = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: Role;
  content?: string;
  image?: string;
  originalImage?: string;
  prompt_used?: string;
  timestamp: number;
  isError?: boolean;
  aspectRatio?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messages: ChatMessage[];
}
