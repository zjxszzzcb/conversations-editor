import React, { useState, useEffect, useCallback } from 'react';
import Split from 'react-split';
import { ChatList } from './components/ChatList';
import { Editor } from './components/Editor';
import { MarkdownPreview } from './components/MarkdownPreview';
import { Controls } from './components/Controls';
import { Conversation, Message } from './types';
import { fileService } from './services/fileService';
import styles from './App.module.css';
import debounce from 'lodash/debounce';
import { RoleSelector } from './components/RoleSelector';
import { MessagePanel } from './components/MessagePanel';
import { FileTree } from './components/FileTree';

export const App: React.FC = () => {
  const [currentFile, setCurrentFile] = useState<string>('');
  const [conversation, setConversation] = useState<Conversation>({ messages: [] });
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'chat' | 'files'>('files');
  const [currentDirectory, setCurrentDirectory] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderProgress, setReorderProgress] = useState(0);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const currentConv = await fileService.getCurrentConversation();
        if (currentConv) {
          setCurrentFile(currentConv.path);
          setConversation(currentConv.content);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (selectedMessage) {
      setEditContent(selectedMessage.content);
    } else {
      setEditContent('');
    }
  }, [selectedMessage]);

  const handleEditContentChange = (newContent: string) => {
    console.log('Edit content changed:', newContent);
    console.log('Selected message before update:', selectedMessage);
    console.log('Current conversation before update:', conversation);
    
    setEditContent(newContent);
    
    if (selectedMessage) {
      // 创建新的消息对象
      const updatedMessage = {
        role: selectedMessage.role,
        content: newContent
      };
      
      // 创建新的消息数组
      const updatedMessages = conversation.messages.map((msg, index) => {
        if (msg === selectedMessage) {
          console.log(`Updating message at index ${index}`);
          return updatedMessage;
        }
        return msg;
      });
      
      console.log('Updated messages:', updatedMessages);
      
      // 更新会话
      setConversation({ messages: updatedMessages });
      // 更新选中的消息
      setSelectedMessage(updatedMessage);
      setHasUnsavedChanges(true);
      
      console.log('Selected message after update:', updatedMessage);
      console.log('Current conversation after update:', { messages: updatedMessages });
    }
  };

  const handleSave = async () => {
    if (!currentFile) return;
    
    try {
      setIsLoading(true);
      console.log('Saving conversation:', conversation); // 调试日志
      await fileService.saveConversation(currentFile, conversation);
      setHasUnsavedChanges(false);
    } catch (error) {
      handleError(error, 'Failed to save conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAndSaveChanges = async (): Promise<boolean> => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Save before continuing?')) {
        await handleSave();
      }
      setHasUnsavedChanges(false);
    }
    return true;
  };

  const setConversationAndSelectFirst = (conv: { path: string; content: Conversation }) => {
    setCurrentFile(conv.path);
    setConversation(conv.content || { messages: [] });
    
    // 自动选择第一条消息
    if (conv.content.messages.length > 0) {
      const firstMessage = conv.content.messages[0];
      setSelectedMessage(firstMessage);
      setEditContent(firstMessage.content);
    } else {
      setSelectedMessage(null);
      setEditContent('');
    }
  };

  const handleNext = async () => {
    if (!(await checkAndSaveChanges())) return;

    try {
      const nextConv = await fileService.getNextConversation();
      if (nextConv) {
        setConversationAndSelectFirst(nextConv);
      }
    } catch (error) {
      console.error('Failed to load next conversation:', error);
    }
  };

  const handlePrevious = async () => {
    if (!(await checkAndSaveChanges())) return;

    try {
      const prevConv = await fileService.getPreviousConversation();
      if (prevConv) {
        setConversationAndSelectFirst(prevConv);
      }
    } catch (error) {
      console.error('Failed to load previous conversation:', error);
    }
  };

  const handleNewFile = async () => {
    try {
      setIsLoading(true);
      const currentDirectory = fileService.getCurrentDirectory();
      if (!currentDirectory) {
        handleError(new Error('No directory selected'), 'Failed to create new file');
        return;
      }

      const newPath = await fileService.addConversation({ messages: [] });
      
      // 需要重新获取所有对话，因为文件列表已经在 fileService 中更新
      const newConversation = await fileService.getCurrentConversation();
      
      setCurrentFile(newConversation.path);
      setConversation(newConversation.content);
      setSelectedMessage(null);
      setEditContent('');
    } catch (error) {
      handleError(error, 'Failed to create new file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMessage = () => {
    if (!currentFile) return;
    setShowRoleSelector(true);
  };

  const handleRoleSelect = (role: 'system' | 'user' | 'assistant') => {
    const newMessage: Message = {
      role,
      content: ''
    };
    
    const updatedMessages = [...conversation.messages, newMessage];
    setConversation({ messages: updatedMessages });
    setSelectedMessage(newMessage);
    setShowRoleSelector(false);
  };

  const handleDelete = async () => {
    if (!currentFile) return;
    
    if (!window.confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      setIsLoading(true);
      await fileService.deleteConversation(currentFile);
      
      // 获取删除后的当前对话（如果有的话）
      const nextConv = await fileService.getCurrentConversation();
      
      if (nextConv && nextConv.path) {
        setCurrentFile(nextConv.path);
        setConversation(nextConv.content);
      } else {
        // 如果没有更多文件了，重置状态
        setCurrentFile('');
        setConversation({ messages: [] });
      }
      
      setSelectedMessage(null);
      setEditContent('');
      setHasUnsavedChanges(false);
    } catch (error) {
      handleError(error, 'Failed to delete conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDirectory = async (path: string) => {
    if (path) {
      try {
        setIsLoading(true);
        console.log('Setting directory:', path);
        await fileService.setDirectory(path);
        setCurrentDirectory(path);
        const currentConv = await fileService.getCurrentConversation();
        
        if (currentConv && currentConv.path) {
          setCurrentFile(currentConv.path);
          setConversation(currentConv.content);
          
          // 如果有对话节点，自动选择第一个节点
          if (currentConv.content.messages.length > 0) {
            const firstMessage = currentConv.content.messages[0];
            setSelectedMessage(firstMessage);
            setEditContent(firstMessage.content);
          } else {
            setSelectedMessage(null);
            setEditContent('');
          }
        } else {
          // 如果没有对话，重置所有状态
          setCurrentFile('');
          setConversation({ messages: [] });
          setSelectedMessage(null);
          setEditContent('');
        }
      } catch (error) {
        handleError(error, 'Failed to set directory');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleError = (error: any, message: string) => {
    console.error(message, error);
    setError(`${message}: ${error.message}`);
    setTimeout(() => setError(null), 3000); // 3秒后清除错误
  };

  const handleMessageDelete = (messageToDelete: Message) => {
    // 如果删除的是当前选中的消息，清除选中状态
    if (messageToDelete === selectedMessage) {
      setSelectedMessage(null);
      setEditContent('');
    }
    
    // 从消息列表中移除消息
    const updatedMessages = conversation.messages.filter(msg => msg !== messageToDelete);
    setConversation({ messages: updatedMessages });
    setHasUnsavedChanges(true);
  };

  const handleRenameFiles = async () => {
    if (isReordering) return;
    
    try {
      setIsReordering(true);
      setReorderProgress(0);
      
      // 启动进度条动画
      const progressInterval = setInterval(() => {
        setReorderProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      await fileService.renameFiles();
      
      // 完成进度条
      setReorderProgress(100);
      
      // 重新加载当前对话以更新文件路径
      const currentConv = await fileService.getCurrentConversation();
      if (currentConv) {
        setCurrentFile(currentConv.path);
        setConversation(currentConv.content);
      }

      // 延迟重置状态
      setTimeout(() => {
        setIsReordering(false);
        setReorderProgress(0);
      }, 500);
    } catch (error) {
      handleError(error, 'Failed to rename files');
      setIsReordering(false);
      setReorderProgress(0);
    }
  };

  const getNextMessage = () => {
    if (!selectedMessage || !conversation.messages) return '';
    
    // 找到当前消息在数组中的索引
    const currentIndex = conversation.messages.findIndex(msg => msg === selectedMessage);
    
    // 如果找到当前消息且不是最后一条，返回下一条消息的内容
    if (currentIndex !== -1 && currentIndex < conversation.messages.length - 1) {
      return conversation.messages[currentIndex + 1].content;
    }
    
    return '';
  };

  const handleNextMessageChange = (newContent: string) => {
    if (!selectedMessage || !conversation.messages) return;
    
    // 找到当前消息在数组中的索引
    const currentIndex = conversation.messages.findIndex(msg => msg === selectedMessage);
    
    // 如果找到当前消息且不是最后一条，更新下一条消息
    if (currentIndex !== -1 && currentIndex < conversation.messages.length - 1) {
      const updatedMessages = [...conversation.messages];
      updatedMessages[currentIndex + 1] = {
        ...updatedMessages[currentIndex + 1],
        content: newContent
      };
      
      setConversation({ messages: updatedMessages });
      setHasUnsavedChanges(true);
    }
  };

  const handleMessagesReorder = (newMessages: Message[]) => {
    setConversation({ messages: newMessages });
    setHasUnsavedChanges(true);
  };

  return (
    <div className={styles.container}>
      <Split
        direction="horizontal"
        sizes={[20, 80]}
        minSize={[200, 400]}
        gutterSize={4}
        className={styles.split}
      >
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <button
              className={`${styles.modeButton} ${sidebarMode === 'chat' ? styles.active : ''}`}
              onClick={() => setSidebarMode('chat')}
              title="Show Conversations"
            >
              Chat
            </button>
            <button
              className={`${styles.modeButton} ${sidebarMode === 'files' ? styles.active : ''}`}
              onClick={() => setSidebarMode('files')}
              title="Show Files"
            >
              Files
            </button>
          </div>
          {sidebarMode === 'files' ? (
            <FileTree
              onSelectDirectory={path => {
                handleSelectDirectory(path);
                setSidebarMode('chat');
              }}
              onCreateDirectory={async (parentPath, name) => {
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
              }}
              onDeleteDirectory={async (path) => {
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
              }}
              currentDirectory={currentDirectory || undefined}
              defaultExpanded={['workspace']}
            />
          ) : (
            <ChatList 
              messages={conversation?.messages || []}
              selectedMessage={selectedMessage}
              onMessageSelect={setSelectedMessage}
              onMessageDelete={handleMessageDelete}
              currentFile={currentFile}
              onAddMessage={handleAddMessage}
              fileIndex={fileService.getCurrentIndex()}
              totalFiles={fileService.getTotalFiles()}
              onMessagesReorder={handleMessagesReorder}
            />
          )}
        </div>
        <div className={styles.main}>
          <div className={styles.controls}>
            <div className={styles.controlButtons}>
              <div className={styles.leftButtons}>
                <button 
                  onClick={handleRenameFiles}
                  className={`${styles.button} ${isReordering ? styles.processing : ''}`}
                  title="Rename files to sequence (1.json, 2.json, ...)"
                  disabled={isReordering}
                >
                  {isReordering && (
                    <div 
                      className={styles.progressBar} 
                      style={{ width: `${reorderProgress}%` }} 
                    />
                  )}
                  <span className={styles.buttonContent}>
                    {isReordering ? 'Reordering...' : 'Reorder'}
                  </span>
                </button>
              </div>
              <div className={styles.navigationButtons}>
                <button onClick={handlePrevious} className={styles.button}>
                  ← Previous
                </button>
                <button onClick={handleNext} className={styles.button}>
                  Next →
                </button>
              </div>
              <div className={styles.actionButtons}>
                <button 
                  onClick={handleNewFile} 
                  className={`${styles.button} ${styles.primary}`}
                >
                  New File
                </button>
                <button 
                  onClick={handleSave} 
                  className={`${styles.button} ${styles.primary} ${hasUnsavedChanges ? styles.hasChanges : ''}`}
                  title="Save all changes to file"
                >
                  Save All
                </button>
                <button onClick={handleDelete} className={`${styles.button} ${styles.danger}`}>
                  Delete
                </button>
              </div>
            </div>
          </div>
          
          <Split
            direction="horizontal"
            sizes={[50, 50]}
            minSize={[200, 200]}
            gutterSize={4}
            className={styles.contentSplit}
          >
            <MessagePanel
              value={editContent}
              onChange={handleEditContentChange}
              disabled={!selectedMessage || conversation.messages.length === 0}
            />
            <MessagePanel
              value={editContent}
              nextMessage={getNextMessage()}
              onChange={handleNextMessageChange}
              isPreview={true}
              disabled={!selectedMessage || (
                conversation.messages.findIndex(msg => msg === selectedMessage) === conversation.messages.length - 1
              )}
            />
          </Split>
        </div>
      </Split>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
      
      {isLoading && (
        <div className={styles.loading}>
          Loading...
        </div>
      )}

      {showRoleSelector && (
        <RoleSelector
          onSelect={handleRoleSelect}
          onCancel={() => setShowRoleSelector(false)}
        />
      )}
    </div>
  );
};