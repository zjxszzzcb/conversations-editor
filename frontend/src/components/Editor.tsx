import React, { useState } from 'react';
import styles from './Editor.module.css';

interface EditorProps {
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  label?: string;
  actions?: React.ReactNode;
}

export const Editor: React.FC<EditorProps> = ({ value, onChange, disabled, textareaRef, label, actions }) => {
  const lines = value.split('\n');
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault(); // 阻止默认的 Tab 行为
      
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      // 获取选中文本的起始行和结束行
      const startLineStart = value.lastIndexOf('\n', start - 1) + 1;
      const endLineEnd = value.indexOf('\n', end);
      const selectedText = value.substring(startLineStart, endLineEnd === -1 ? value.length : endLineEnd);
      const lines = selectedText.split('\n');
      
      // 记住原始选区
      const originalStart = start;
      const originalEnd = end;
      
      if (e.shiftKey) {
        // 取消缩进：移除每行开头的空格（不限于4个空格）
        const modifiedLines = lines.map(line => {
          // 计算行首空格数量
          const leadingSpaces = line.match(/^[ ]*/)[0].length;
          if (leadingSpaces > 0) {
            // 移除最多4个空格
            const spacesToRemove = Math.min(4, leadingSpaces);
            return line.substring(spacesToRemove);
          }
          return line;
        });
        
        const newValue = value.substring(0, startLineStart) +
                        modifiedLines.join('\n') +
                        value.substring(endLineEnd === -1 ? value.length : endLineEnd);
        
        onChange(newValue);
        
        // 计算每行实际移除的空格数
        const removedSpaces = lines.reduce((total, line, index) => {
          const leadingSpaces = line.match(/^[ ]*/)[0].length;
          const spacesRemoved = Math.min(4, leadingSpaces);
          return total + spacesRemoved;
        }, 0);
        
        // 使用 requestAnimationFrame 确保在下一帧设置选区
        requestAnimationFrame(() => {
          textarea.focus(); // 确保 textarea 保持焦点
          const newStart = Math.max(startLineStart, originalStart - (startLineStart === originalStart ? 0 : Math.min(4, lines[0].match(/^[ ]*/)[0].length)));
          const newEnd = originalEnd - removedSpaces;
          textarea.setSelectionRange(newStart, newEnd);
        });
      } else {
        // 添加缩进：在每行开头添加4个空格
        const modifiedLines = lines.map(line => '    ' + line);
        
        const newValue = value.substring(0, startLineStart) +
                        modifiedLines.join('\n') +
                        value.substring(endLineEnd === -1 ? value.length : endLineEnd);
        
        onChange(newValue);
        
        // 调整选区位置并保持选中状态
        requestAnimationFrame(() => {
          textarea.focus(); // 确保 textarea 保持焦点
          const newStart = originalStart + (startLineStart === originalStart ? 4 : 0);
          const newEnd = originalEnd + (lines.length * 4);
          textarea.setSelectionRange(newStart, newEnd);
        });
      }
    }
  };
  
  return (
    <div className={styles.editorContainer}>
      <div className={styles.editorHeader}>
        <span className={styles.editorLabel}>{label}</span>
        {actions}
      </div>
      <div className={styles.editorContent}>
        <div className={styles.lineNumbers}>
          {lines.map((_, i) => (
            <div key={i} className={styles.lineNumber}>
              {i + 1}
            </div>
          ))}
          {/* 确保至少显示一行行号 */}
          {lines.length === 0 && <div className={styles.lineNumber}>1</div>}
        </div>
        <textarea
          className={styles.editor}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={disabled ? "No message selected" : "Enter your message here..."}
          spellCheck={false}
          onKeyDown={handleKeyDown}
          ref={textareaRef}
        />
      </div>
    </div>
  );
}; 