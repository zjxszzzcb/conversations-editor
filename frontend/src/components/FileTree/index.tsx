import React, { useState, useEffect } from 'react';
import styles from './FileTree.module.css';
import { formatDirectoryName } from '../../utils/fileUtils';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  fileCount?: number;
}

interface FileTreeProps {
  onSelectDirectory: (path: string) => void;
  onCreateDirectory: (parentPath: string, name: string) => void;
  onDeleteDirectory: (path: string) => void;
  currentDirectory?: string;
  defaultExpanded?: string[];
}

export const FileTree: React.FC<FileTreeProps> = ({
  onSelectDirectory,
  onCreateDirectory,
  onDeleteDirectory,
  currentDirectory,
  defaultExpanded = [],
}) => {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(defaultExpanded));
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    path: string;
    isRoot: boolean;
  } | null>(null);

  useEffect(() => {
    loadFileTree();
  }, []);

  useEffect(() => {
    if (currentDirectory) {
      const pathParts = currentDirectory.split('/');
      const paths = new Set<string>();
      let currentPath = 'workspace';
      paths.add(currentPath);
      
      pathParts.forEach(part => {
        if (part && part !== 'workspace') {
          currentPath = `${currentPath}/${part}`;
          paths.add(currentPath);
        }
      });
      
      setExpandedPaths(paths);
      setSelectedPath(currentDirectory);
    }
  }, [currentDirectory]);

  useEffect(() => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      defaultExpanded.forEach(path => next.add(path));
      return next;
    });
  }, [defaultExpanded]);

  useEffect(() => {
    // 添加点击其他地方关闭菜单的处理
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const loadFileTree = async () => {
    try {
      const response = await fetch('/api/directories');
      const data = await response.json();
      const rootNode: FileNode = {
        name: 'workspace',
        path: 'workspace',
        type: 'directory',
        children: []
      };
      
      data.directories.forEach((dir: any) => {
        const parts = dir.name.split('/');
        let currentNode = rootNode;
        
        parts.forEach((part: string, index: number) => {
          if (part === 'root') return;
          
          const path = parts.slice(0, index + 1).join('/');
          let node = currentNode.children?.find(n => n.name === part);
          
          if (!node) {
            node = {
              name: part,
              path: `workspace/${path}`,
              type: 'directory',
              children: [],
              fileCount: index === parts.length - 1 ? dir.fileCount : 0
            };
            currentNode.children?.push(node);
          }
          currentNode = node;
        });
      });
      
      setTree([rootNode]);
    } catch (error) {
      console.error('Failed to load file tree:', error);
    }
  };

  const toggleExpand = (path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, path: string, isRoot: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      path,
      isRoot
    });
  };

  const handleCreateDirectory = async (parentPath: string) => {
    const name = prompt('Enter new directory name:');
    if (!name) return;
    
    await onCreateDirectory(parentPath, name);
    setContextMenu(null);
    loadFileTree();
  };

  const handleDeleteDirectory = async (path: string) => {
    if (!confirm(`Are you sure you want to delete the directory "${path.split('/').pop()}" and all its contents?`)) return;
    
    await onDeleteDirectory(path);
    setContextMenu(null);
    loadFileTree();
  };

  const handleSelect = (path: string) => {
    setSelectedPath(path);
    onSelectDirectory(path);
  };

  const renderNode = (node: FileNode, level: number = 0) => {
    const isExpanded = expandedPaths.has(node.path);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedPath === node.path;
    const isCurrent = currentDirectory === node.path;
    const isRoot = node.path === 'workspace';

    return (
      <div key={node.path} className={styles.node} style={{ paddingLeft: `${level * 8}px` }}>
        <div 
          className={`${styles.nodeContent} ${isSelected ? styles.selected : ''} ${isCurrent ? styles.current : ''}`}
          onContextMenu={(e) => handleContextMenu(e, node.path, isRoot)}
        >
          <span 
            className={styles.expandIcon}
            onClick={() => hasChildren && toggleExpand(node.path)}
          >
            {hasChildren && (isExpanded ? '▼' : '▶')}
          </span>
          <span 
            className={styles.nodeName}
            onClick={() => handleSelect(node.path)}
          >
            {node.fileCount !== undefined ? formatDirectoryName(node.name, node.fileCount) : node.name}
          </span>
        </div>
        {isExpanded && node.children && (
          <div className={styles.children}>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.fileTree}>
      {tree.map(node => renderNode(node))}
      {contextMenu && (
        <div 
          className={styles.contextMenu}
          style={{ 
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y
          }}
        >
          <button onClick={() => handleCreateDirectory(contextMenu.path)}>
            New Directory
          </button>
          {!contextMenu.isRoot && (
            <button onClick={() => handleDeleteDirectory(contextMenu.path)}>
              Delete Directory
            </button>
          )}
        </div>
      )}
    </div>
  );
}; 