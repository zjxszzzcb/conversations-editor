import React from 'react';
import styles from './Controls.module.css';
import { FileTree } from '../FileTree';

interface ControlsProps {
  onSave: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onNewFile: () => void;
  onDelete: () => void;
  onSelectDirectory: (path: string) => void;
  hasUnsavedChanges: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  onSave,
  onNext,
  onPrevious,
  onNewFile,
  onDelete,
  onSelectDirectory,
  hasUnsavedChanges
}) => {
  const handleCreateDirectory = async (parentPath: string, name: string) => {
    try {
      const newPath = `${parentPath}/${name}`;
      const response = await fetch('/api/directory/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: newPath }),
      });

      if (!response.ok) {
        throw new Error('Failed to create directory');
      }
    } catch (error) {
      console.error('Failed to create directory:', error);
    }
  };

  const handleDeleteDirectory = async (path: string) => {
    try {
      const response = await fetch('/api/directory', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete directory');
      }
    } catch (error) {
      console.error('Failed to delete directory:', error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftGroup}>
        <FileTree
          onSelectDirectory={onSelectDirectory}
          onCreateDirectory={handleCreateDirectory}
          onDeleteDirectory={handleDeleteDirectory}
        />
      </div>
      
      <div className={styles.centerGroup}>
        <button onClick={onPrevious} className={styles.button}>
          ← Previous
        </button>
        <button onClick={onNext} className={styles.button}>
          Next →
        </button>
      </div>
      
      <div className={styles.rightGroup}>
        <button 
          onClick={onNewFile} 
          className={`${styles.button} ${styles.primary}`}
        >
          New File
        </button>
        <button 
          onClick={onSave} 
          className={`${styles.button} ${styles.primary} ${hasUnsavedChanges ? styles.hasChanges : ''}`}
          title="Save all changes to file"
        >
          Save All {hasUnsavedChanges ? '*' : ''}
        </button>
        <button onClick={onDelete} className={`${styles.button} ${styles.danger}`}>
          Delete
        </button>
      </div>
    </div>
  );
}; 