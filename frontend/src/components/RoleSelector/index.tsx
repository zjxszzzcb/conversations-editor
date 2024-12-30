import React from 'react';
import styles from './RoleSelector.module.css';

interface RoleSelectorProps {
  onSelect: (role: 'system' | 'user' | 'assistant' | 'negative') => void;
  onCancel: () => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ onSelect, onCancel }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <h3>Select Message Role</h3>
        <div className={styles.buttons}>
          <button 
            className={`${styles.button} ${styles.system}`}
            onClick={() => onSelect('system')}
          >
            System
          </button>
          <button 
            className={`${styles.button} ${styles.user}`}
            onClick={() => onSelect('user')}
          >
            User
          </button>
          <button 
            className={`${styles.button} ${styles.assistant}`}
            onClick={() => onSelect('assistant')}
          >
            Assistant
          </button>
          <button 
            className={`${styles.button} ${styles.negative}`}
            onClick={() => onSelect('negative')}
          >
            Negative
          </button>
        </div>
        <button className={styles.cancelButton} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}; 