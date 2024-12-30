export interface Message {
  role: 'system' | 'user' | 'assistant' | 'negative';
  content: string;
}

export interface Conversation {
  messages: Message[];
}

export interface ChatBubbleProps {
  message: Message;
  isSelected?: boolean;
  onClick?: () => void;
} 