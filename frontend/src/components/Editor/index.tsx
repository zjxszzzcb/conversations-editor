import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import styles from './Editor.module.css';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ value, onChange }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Editor</h3>
      </div>
      <CodeMirror
        value={value}
        height="100%"
        extensions={[markdown(), EditorView.lineWrapping]}
        onChange={onChange}
        theme="light"
        className={styles.editor}
      />
    </div>
  );
}; 