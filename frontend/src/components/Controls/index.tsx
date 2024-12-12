import React, { useState, useEffect } from 'react';
import styles from './Controls.module.css';

interface Directory {
  name: string;
  path: string;
  hasFiles: boolean;
  fileCount: number;
}

interface NewMessage {
  role: 'system' | 'assistant' | 'user';
  content: string;
}

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
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [selectedPath, setSelectedPath] = useState('');
  const [showNewDirDialog, setShowNewDirDialog] = useState(false);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [newDirName, setNewDirName] = useState('');
  const [newMessages, setNewMessages] = useState<NewMessage[]>([
    { role: 'user', content: '' }
  ]);

  useEffect(() => {
    loadDirectories();
  }, []);

  const loadDirectories = async () => {
    try {
      const response = await fetch('/api/directories');
      const data = await response.json();
      setDirectories(data.directories);
    } catch (error) {
      console.error('Failed to load directories:', error);
    }
  };

  const handleDirectoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const path = event.target.value;
    setSelectedPath(path);
    if (path) {
      onSelectDirectory(path);
    }
  };

  const handleCreateDirectory = async () => {
    if (!newDirName) return;

    try {
      const newPath = `workspace/${newDirName}`;
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

      await loadDirectories();
      setShowNewDirDialog(false);
      setNewDirName('');
    } catch (error) {
      console.error('Failed to create directory:', error);
    }
  };

  const handleAddMessage = () => {
    setNewMessages([...newMessages, { role: 'assistant', content: '' }]);
  };

  const handleRemoveMessage = (index: number) => {
    setNewMessages(newMessages.filter((_, i) => i !== index));
  };

  const handleMessageChange = (index: number, field: keyof NewMessage, value: string) => {
    const updated = newMessages.map((msg, i) => 
      i === index ? { ...msg, [field]: value } : msg
    );
    setNewMessages(updated);
  };

  const handleCreateMessages = (mode: 'new' | 'append') => {
    if (newMessages.some(msg => !msg.content)) {
      alert('Please fill in all message contents');
      return;
    }
    if (!selectedPath) {
      alert('Please select a directory first');
      return;
    }
    onAdd(newMessages, mode);
    setShowNewMessageDialog(false);
    setNewMessages([{ role: 'user', content: '' }]);
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftGroup}>
        <select 
          value={selectedPath}
          onChange={handleDirectoryChange}
          className={styles.select}
        >
          <option value="">Select Directory</option>
          {directories.map((dir) => (
            <option 
              key={dir.path} 
              value={dir.path}
              className={dir.hasFiles ? styles.hasFiles : styles.empty}
            >
              {dir.name} ({dir.fileCount} files)
            </option>
          ))}
        </select>
        <button 
          onClick={() => setShowNewDirDialog(true)} 
          className={styles.button}
        >
          New Directory
        </button>
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

      {showNewDirDialog && (
        <div className={styles.dialog}>
          <div className={styles.dialogContent}>
            <h3>Create New Directory</h3>
            <input
              type="text"
              value={newDirName}
              onChange={(e) => setNewDirName(e.target.value)}
              placeholder="Enter directory name"
              className={styles.input}
            />
            <div className={styles.dialogButtons}>
              <button 
                onClick={handleCreateDirectory}
                className={`${styles.button} ${styles.primary}`}
              >
                Create
              </button>
              <button 
                onClick={() => {
                  setShowNewDirDialog(false);
                  setNewDirName('');
                }}
                className={styles.button}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewMessageDialog && (
        <div className={styles.dialog}>
          <div className={`${styles.dialogContent} ${styles.messageDialog}`}>
            <h3>Create New Messages</h3>
            {newMessages.map((msg, index) => (
              <div key={index} className={styles.messageInput}>
                <select
                  value={msg.role}
                  onChange={(e) => handleMessageChange(index, 'role', e.target.value as NewMessage['role'])}
                  className={styles.select}
                >
                  <option value="system">System</option>
                  <option value="user">User</option>
                  <option value="assistant">Assistant</option>
                </select>
                <textarea
                  value={msg.content}
                  onChange={(e) => handleMessageChange(index, 'content', e.target.value)}
                  placeholder="Enter message content"
                  className={styles.textarea}
                />
                <button
                  onClick={() => handleRemoveMessage(index)}
                  className={`${styles.button} ${styles.danger}`}
                  disabled={newMessages.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <div className={styles.messageActions}>
              <button
                onClick={handleAddMessage}
                className={styles.button}
              >
                Add Message
              </button>
            </div>
            <div className={styles.dialogButtons}>
              <button 
                onClick={() => handleCreateMessages('new')}
                className={`${styles.button} ${styles.primary}`}
              >
                New File
              </button>
              <button 
                onClick={() => handleCreateMessages('append')}
                className={`${styles.button} ${styles.primary}`}
                disabled={!selectedPath}
              >
                Append
              </button>
              <button 
                onClick={() => {
                  setShowNewMessageDialog(false);
                  setNewMessages([{ role: 'user', content: '' }]);
                }}
                className={styles.button}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 