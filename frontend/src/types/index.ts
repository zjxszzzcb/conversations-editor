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
  onDelete?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (fromIndex: number, toIndex: number) => void;
  index: number;
} 