import React from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './MarkdownPreview.module.css';

interface MarkdownPreviewProps {
  content: string;
  containerRef?: React.RefObject<HTMLDivElement>;
  label?: string;
  actions?: React.ReactNode;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, containerRef, label, actions }) => {
  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewHeader}>
        <span className={styles.previewLabel}>{label}</span>
        {actions}
      </div>
      <div ref={containerRef} className={styles.previewContent}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}; 