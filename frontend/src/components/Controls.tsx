import React, { useEffect, useState } from 'react';
import styles from './Controls.module.css';

interface ControlsProps {
  onSave: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onNewFile: () => void;
  onDelete: () => void;
  onSelectDirectory: (path: string) => void;
  hasUnsavedChanges: boolean;
  onRenameFiles: () => void;
}

interface Directory {
  name: string;
  path: string;
  hasFiles: boolean;
  fileCount: number;
}

export const Controls: React.FC<ControlsProps> = ({
  onSave,
  onNext,
  onPrevious,
  onNewFile,
  onDelete,
  onSelectDirectory,
  hasUnsavedChanges,
  onRenameFiles
}) => {
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameProgress, setRenameProgress] = useState(0);

  // 获取目录列表
  useEffect(() => {
    const fetchDirectories = async () => {
      try {
        const response = await fetch('/api/directories');
        if (!response.ok) throw new Error('Failed to fetch directories');
        const data = await response.json();
        setDirectories(data.directories);
      } catch (error) {
        console.error('Error fetching directories:', error);
      }
    };

    fetchDirectories();
  }, []);

  // 创建新目录
  const handleCreateDirectory = async () => {
    const dirName = prompt('Enter directory name:');
    if (!dirName) return;

    try {
      const response = await fetch('/api/directory/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: `workspace/${dirName}` }),
      });

      if (!response.ok) throw new Error('Failed to create directory');
      
      // 刷新目录列表
      const refreshResponse = await fetch('/api/directories');
      if (!refreshResponse.ok) throw new Error('Failed to refresh directories');
      const data = await refreshResponse.json();
      setDirectories(data.directories);
    } catch (error) {
      console.error('Error creating directory:', error);
    }
  };

  const handleRenameClick = async () => {
    try {
      setIsRenaming(true);
      setRenameProgress(0);
      
      // 模拟进度增加
      const progressInterval = setInterval(() => {
        setRenameProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // 执行重命名
      await onRenameFiles();
      
      // 完成后设置为 100%
      clearInterval(progressInterval);
      setRenameProgress(100);
      
      // 短暂延迟后重置状态
      setTimeout(() => {
        setIsRenaming(false);
        setRenameProgress(0);
      }, 500);
    } catch (error) {
      setIsRenaming(false);
      setRenameProgress(0);
      console.error('Rename failed:', error);
    }
  };

  return (
    <div className={styles.controls}>
      {/* 目录管理分组 */}
      <div className={styles.directoryGroup}>
        <select 
          className={styles.directorySelect}
          value={selectedPath}
          onChange={(e) => {
            setSelectedPath(e.target.value);
            onSelectDirectory(e.target.value);
          }}
        >
          <option value="">Select Directory</option>
          {directories.map((dir) => (
            <option key={dir.path} value={dir.path}>
              {dir.name}
            </option>
          ))}
        </select>

        <button 
          className={`${styles.button} ${styles.newButton}`}
          onClick={handleCreateDirectory}
        >
          New Dir
        </button>

        {isRenaming ? (
          <div className={styles.renameProgress}>
            <div 
              className={styles.progressBar}
              style={{ width: `${renameProgress}%` }}
            />
            <span className={styles.progressText}>
              {renameProgress === 100 ? 'Done!' : 'Renaming...'}
            </span>
          </div>
        ) : (
          <button 
            className={`${styles.button} ${styles.newButton}`}
            onClick={handleRenameClick}
            title="Rename files to sequence (1.json, 2.json, ...)"
          >
            Reorder
          </button>
        )}
      </div>

      {/* 导航分组 */}
      <div className={styles.navigationGroup}>
        <div className={styles.navigationButtons}>
          <button 
            className={styles.button}
            onClick={onPrevious}
            title="Previous file"
          >
            <svg 
              className={styles.navIcon}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button 
            className={styles.button}
            onClick={onNext}
            title="Next file"
          >
            <svg 
              className={styles.navIcon}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* 文件操作分组 */}
      <div className={styles.actionGroup}>
        <button 
          className={`${styles.button} ${styles.newButton}`}
          onClick={onNewFile}
        >
          New File
        </button>
        <button 
          className={`${styles.button} ${styles.saveButton} ${hasUnsavedChanges ? styles.hasChanges : ''}`}
          onClick={onSave}
        >
          Save{hasUnsavedChanges ? '*' : ''}
        </button>
        <button 
          className={`${styles.button} ${styles.deleteButton}`}
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
};
