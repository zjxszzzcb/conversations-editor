import React from 'react';
import { ChatBubbleProps } from '../../types';
import styles from './ChatBubble.module.css';

export const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  message, 
  isSelected, 
  onClick,
  onDelete 
}) => {
  const preview = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
  
  return (
    <div 
      className={`${styles.bubble} ${isSelected ? styles.selected : ''} ${styles[message.role]}`}
      onClick={onClick}
    >
      <div className={`${styles.role} ${styles[message.role]}`}>
        <div className={styles.roleIcon} />
        <span className={styles.roleName}>{message.role}</span>
        {onDelete && (
          <button
            className={styles.deleteButton}
            onClick={(e) => {
              e.stopPropagation();  // 防止触发气泡的点击事件
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