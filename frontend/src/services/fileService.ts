import { Conversation, Message } from '../types';

export class FileService {
  private currentDirectory: string | null = null;
  private files: string[] = [];
  private currentIndex: number = -1;

  async setDirectory(path: string): Promise<void> {
    try {
      const response = await fetch('/api/directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      
      if (!response.ok) throw new Error('Failed to set directory');
      
      const { files } = await response.json();
      this.currentDirectory = path;
      this.files = this.sortFiles(files);
      this.currentIndex = this.files.length > 0 ? 0 : -1;
    } catch (error) {
      console.error('Error setting directory:', error);
      throw error;
    }
  }

  private sortFiles(files: string[]): string[] {
    // 前端处理文件排序逻辑
    return [...files].sort((a, b) => {
      const aName = this.getBaseName(a);
      const bName = this.getBaseName(b);
      return aName.localeCompare(bName);
    });
  }

  private getBaseName(path: string): string {
    return path.split('/').pop()?.split('.')[0] || '';
  }

  async addConversation(content: { messages: Message[] }): Promise<string> {
    if (!this.currentDirectory) throw new Error('No directory selected');

    try {
      const response = await fetch('/api/file/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directory: this.currentDirectory,
          content: content,
          current_file: this.files[this.currentIndex] || null
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create file');
      
      const { path } = await response.json();
      
      // 在前端处理文件插入位置
      this.files.splice(this.currentIndex + 1, 0, path);
      this.currentIndex++;
      
      return path;
    } catch (error) {
      console.error('Error creating file:', error);
      throw error;
    }
  }

  async getCurrentConversation(): Promise<{ path: string; content: Conversation }> {
    if (this.currentIndex < 0 || !this.files[this.currentIndex]) {
      return { path: '', content: { messages: [] } };
    }

    const path = this.files[this.currentIndex];
    const content = await this.loadConversation(path);
    return { path, content };
  }

  async getNextConversation(): Promise<{ path: string; content: Conversation }> {
    if (this.currentIndex < this.files.length - 1) {
      this.currentIndex++;
      return this.getCurrentConversation();
    }
    return this.getCurrentConversation();
  }

  async getPreviousConversation(): Promise<{ path: string; content: Conversation }> {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.getCurrentConversation();
    }
    return this.getCurrentConversation();
  }

  async loadConversation(filePath: string): Promise<Conversation> {
    try {
      const response = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
      if (!response.ok) throw new Error('Failed to load conversation');
      return await response.json();
    } catch (error) {
      console.error('Error loading conversation:', error);
      throw error;
    }
  }

  async saveConversation(filePath: string, conversation: Conversation): Promise<void> {
    try {
      const response = await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content: conversation }),
      });
      
      if (!response.ok) throw new Error('Failed to save conversation');
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw error;
    }
  }

  async deleteConversation(filePath: string): Promise<void> {
    try {
      const response = await fetch('/api/file', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath }),
      });
      
      if (!response.ok) throw new Error('Failed to delete conversation');
      
      // 从文件列表中移除文件
      const fileIndex = this.files.indexOf(filePath);
      if (fileIndex !== -1) {
        this.files.splice(fileIndex, 1);
        // 更新当前索引，确保它指向有效的文件
        if (this.files.length === 0) {
          this.currentIndex = -1;
        } else {
          this.currentIndex = Math.min(fileIndex, this.files.length - 1);
        }
      }

      // 如果当前目录存在，重新获取目录文件列表以保持同步
      if (this.currentDirectory) {
        await this.refreshDirectory();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  // 添加新方法用于刷新目录
  private async refreshDirectory(): Promise<void> {
    try {
      const response = await fetch('/api/directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: this.currentDirectory }),
      });
      
      if (!response.ok) throw new Error('Failed to refresh directory');
      
      const { files } = await response.json();
      this.files = this.sortFiles(files);
      
      // 如果当前没有文件，重置索引
      if (this.files.length === 0) {
        this.currentIndex = -1;
      } else {
        // 确保当前索引不超出范围
        this.currentIndex = Math.min(this.currentIndex, this.files.length - 1);
      }
    } catch (error) {
      console.error('Error refreshing directory:', error);
      throw error;
    }
  }

  getCurrentDirectory(): string | null {
    return this.currentDirectory;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getTotalFiles(): number {
    return this.files.length;
  }

  getFiles(): string[] {
    return [...this.files]; // 返回副本以防止外部修改
  }

  async renameFiles(): Promise<void> {
    if (!this.currentDirectory || this.files.length === 0) {
      throw new Error('No directory selected or no files to rename');
    }

    try {
      const response = await fetch('/api/files/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directory: this.currentDirectory,
          files: this.files
        }),
      });

      if (!response.ok) throw new Error('Failed to rename files');

      const { files } = await response.json();
      this.files = this.sortFiles(files);
      
      // 更新当前索引对应的文件路径
      if (this.currentIndex >= 0) {
        this.currentIndex = Math.min(this.currentIndex, this.files.length - 1);
      }
    } catch (error) {
      console.error('Error renaming files:', error);
      throw error;
    }
  }
}

export const fileService = new FileService(); 