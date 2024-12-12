import React, { useState, useRef, useEffect } from 'react';
import { Editor } from './Editor';
import { MarkdownPreview } from './MarkdownPreview';
import { EyeIcon, PencilIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import styles from './MessagePanel.module.css';

interface MessagePanelProps {
  value: string;
  onChange?: (value: string) => void;
  nextMessage?: string;
  disabled?: boolean;
  isPreview?: boolean;
}

export const MessagePanel: React.FC<MessagePanelProps> = ({
  value,
  onChange,
  nextMessage,
  disabled,
  isPreview = false
}) => {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);
  
  // 如果是预览面板，默认显示预览模式
  useEffect(() => {
    if (isPreview) {
      setMode('preview');
    }
  }, [isPreview]);
  
  const handleModeToggle = () => {
    if (mode === 'edit' && editorRef.current) {
      // 计算编辑器的滚动百分比
      const editor = editorRef.current;
      const scrollPercentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
      scrollPositionRef.current = scrollPercentage;
      console.log('Saving editor scroll percentage:', scrollPercentage);
    } else if (mode === 'preview' && previewRef.current) {
      // 计算预览的滚动百分比
      const preview = previewRef.current;
      const scrollPercentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
      scrollPositionRef.current = scrollPercentage;
      console.log('Saving preview scroll percentage:', scrollPercentage);
    }
    setMode(mode === 'edit' ? 'preview' : 'edit');
  };
  
  // 在模式切换后恢复滚动位置
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mode === 'edit' && editorRef.current) {
        const editor = editorRef.current;
        const scrollPosition = scrollPositionRef.current * (editor.scrollHeight - editor.clientHeight);
        console.log('Restoring editor scroll position from percentage:', scrollPositionRef.current);
        editor.scrollTop = scrollPosition;
      } else if (mode === 'preview' && previewRef.current) {
        const preview = previewRef.current;
        const scrollPosition = scrollPositionRef.current * (preview.scrollHeight - preview.clientHeight);
        console.log('Restoring preview scroll position from percentage:', scrollPositionRef.current);
        preview.scrollTop = scrollPosition;
      }
    }, 50); // 给一点额外时间让内容渲染完成
    
    return () => clearTimeout(timer);
  }, [mode]);
  
  const handleCopy = () => {
    const textToCopy = isPreview ? nextMessage || '' : value;
    navigator.clipboard.writeText(textToCopy);
  };

  const content = isPreview ? nextMessage || '' : value;
  const isEditable = !disabled && (!isPreview || (isPreview && onChange));
  
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {mode === 'edit' ? (
          <Editor
            value={content}
            onChange={onChange}
            disabled={!isEditable}
            textareaRef={editorRef}
            label={isPreview ? 'Next Message' : 'Current Message'}
            actions={(
              <div className={styles.actions}>
                <button
                  className={styles.iconButton}
                  onClick={handleModeToggle}
                  disabled={disabled}
                  title="Toggle Preview"
                >
                  <EyeIcon className={styles.icon} />
                </button>
                <button
                  className={styles.iconButton}
                  onClick={handleCopy}
                  disabled={disabled}
                  title="Copy Content"
                >
                  <ClipboardIcon className={styles.icon} />
                </button>
              </div>
            )}
          />
        ) : (
          <MarkdownPreview 
            content={content} 
            containerRef={previewRef}
            label={isPreview ? 'Next Message' : 'Current Message'}
            actions={(
              <div className={styles.actions}>
                <button
                  className={styles.iconButton}
                  onClick={handleModeToggle}
                  disabled={disabled}
                  title="Edit"
                >
                  <PencilIcon className={styles.icon} />
                </button>
                <button
                  className={styles.iconButton}
                  onClick={handleCopy}
                  disabled={disabled}
                  title="Copy Content"
                >
                  <ClipboardIcon className={styles.icon} />
                </button>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}; 