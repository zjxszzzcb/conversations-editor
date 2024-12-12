import React from 'react';
import { Message } from '../../types';
import { ChatBubble } from './ChatBubble';
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
}

export const ChatList: React.FC<ChatListProps> = ({
  messages,
  selectedMessage,
  onMessageSelect,
  onMessageDelete,
  currentFile,
  onAddMessage,
  fileIndex,
  totalFiles
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Conversation</h2>
        {currentFile && (
          <>
            <div className={styles.filename}>
              {currentFile.split('\\').pop()}
            </div>
            {fileIndex !== undefined && totalFiles !== undefined && (
              <div className={styles.fileIndex}>
                File {fileIndex + 1} of {totalFiles}
              </div>
            )}
          </>
        )}
      </div>
      <div className={styles.list}>
        {messages.map((message, index) => (
          <ChatBubble
            key={`${currentFile}-${index}`}
            message={message}
            isSelected={message === selectedMessage}
            onClick={() => onMessageSelect(message)}
            onDelete={() => onMessageDelete(message)}
          />
        ))}
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