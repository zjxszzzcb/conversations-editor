import React from 'react';
import { ChatBubbleProps } from '../../types';
import styles from './ChatBubble.module.css';

export const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  message, 
  isSelected, 
  onClick,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  index
}) => {
  const preview = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.currentTarget.classList.add(styles.dragging);
    onDragStart?.();
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove(styles.dragging);
    onDragEnd?.();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDragOver?.(e);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    onDrop?.(fromIndex, index);
  };
  
  return (
    <div 
      className={`${styles.bubble} ${isSelected ? styles.selected : ''} ${styles[message.role]}`}
      onClick={onClick}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className={`${styles.role} ${styles[message.role]}`}>
        <div className={styles.roleIcon} />
        <span className={styles.roleName}>{message.role}</span>
        {onDelete && (
          <button
            className={styles.deleteButton}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            ×
          </button>
        )}
      </div>
      <div className={styles.preview}>{preview}</div>
    </div>
  );
}; 