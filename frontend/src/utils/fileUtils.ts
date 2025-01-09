export const formatFileName = (filePath: string): string => {
  // 获取文件名（不含路径）
  const fileName = filePath.split('/').pop() || '';
  
  // 移除 .json 扩展名
  const nameWithoutExt = fileName.replace('.json', '');
  
  // 如果文件名长度大于8，则进行截断
  if (nameWithoutExt.length > 8) {
    return `${nameWithoutExt.slice(0, 4)}***${nameWithoutExt.slice(-4)}`;
  }
  
  return nameWithoutExt;
};

export const formatDirectoryName = (name: string, fileCount: number): string => {
  return `[${fileCount}]  ${name}`;
}; 