import React, { useState } from 'react';
import { Message } from '../../types';
import { ChatBubble } from './ChatBubble';
import { formatFileName } from '../../utils/fileUtils';
import styles from './ChatList.module.css';

interface ChatListProps {
  messages: Message[];
  selectedMessage: Message | null;
  onMessageSelect: (message: Message) => void;
  onMessageDelete: (message: Message) => void;
  currentFile: string;
  onAddMessage: () => void;
  fileIndex?: number;
  totalFiles?: number;
  onMessagesReorder?: (messages: Message[]) => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  messages,
  selectedMessage,
  onMessageSelect,
  onMessageDelete,
  currentFile,
  onAddMessage,
  fileIndex,
  totalFiles,
  onMessagesReorder
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midPoint = rect.top + rect.height / 2;
    
    if (e.clientY < midPoint) {
      setDragOverIndex(index);
    } else {
      setDragOverIndex(index + 1);
    }
  };

  const handleDrop = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newMessages = [...messages];
    const [movedMessage] = newMessages.splice(fromIndex, 1);
    newMessages.splice(toIndex, 0, movedMessage);
    onMessagesReorder?.(newMessages);
    setDragOverIndex(null);
  };

  const handleListDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragOverIndex === null) {
      setDragOverIndex(messages.length);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Conversation</h2>
        {currentFile && (
          <>
            <div className={styles.filename}>
              {formatFileName(currentFile)}
            </div>
            {fileIndex !== undefined && totalFiles !== undefined && (
              <div className={styles.fileIndex}>
                File {fileIndex + 1} of {totalFiles}
              </div>
            )}
          </>
        )}
      </div>
      <div 
        className={`${styles.list} ${isDragging ? styles.dragging : ''}`}
        onDragOver={handleListDragOver}
      >
        {messages.map((message, index) => (
          <div key={`${currentFile}-${index}`} className={styles.bubbleWrapper}>
            {dragOverIndex === index && (
              <div className={`${styles.dropZone} ${styles.active}`} />
            )}
            <ChatBubble
              message={message}
              isSelected={message === selectedMessage}
              onClick={() => onMessageSelect(message)}
              onDelete={() => onMessageDelete(message)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={handleDrop}
              index={index}
            />
          </div>
        ))}
        {dragOverIndex === messages.length && (
          <div className={`${styles.dropZone} ${styles.active}`} />
        )}
        {currentFile && (
          <button 
            onClick={onAddMessage}
            className={styles.addButton}
          >
            + Add Message
          </button>
        )}
      </div>
    </div>
  );
}; 