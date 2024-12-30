import traceback

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import uuid
from typing import List, Dict, Any

app = FastAPI()

# 配置工作目录
WORKSPACE_DIR = "workspace"
if not os.path.exists(WORKSPACE_DIR):
    os.makedirs(WORKSPACE_DIR)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源，因为我们在Docker环境中
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DirectoryRequest(BaseModel):
    path: str

class FileRequest(BaseModel):
    path: str
    content: Dict[str, Any] = None

class NewFileRequest(BaseModel):
    directory: str
    content: Dict[str, Any]
    current_file: str | None

class CreateDirectoryRequest(BaseModel):
    path: str

class RenameFilesRequest(BaseModel):
    directory: str
    files: List[str]  # 按顺序排列的文件路径列表

@app.get("/api/workspace")
async def get_workspace():
    return {"path": os.getcwd()}

@app.post("/api/directory")
async def set_directory(request: DirectoryRequest):
    """仅返回目录下的所有合法JSON文件路径"""
    try:
        path = request.path
        print(f"[SET_DIRECTORY] Request path: {path}")
        
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail=f"Directory not found: {path}")
        
        files = []
        for filename in os.listdir(path):
            if filename.endswith('.json'):
                file_path = os.path.join(path, filename)
                try:
                    # 验证文件是否可读取且为JSON格式
                    # with open(file_path, 'r', encoding='utf-8') as f:
                    #     json.load(f)
                    files.append(file_path)
                except Exception as e:
                    print(f"[SET_DIRECTORY] Skipping invalid file {file_path}: {str(e)}")
                    continue
        print(f"[SET_DIRECTORY] Found {len(files)} valid files")

        def sort_value(file_path: str):
            try:
                return int(os.path.basename(file_path.split('.')[0]))
            except:
                traceback.print_exc()
                return 1e9
        try:
            files.sort(key=sort_value)
        except Exception:
            traceback.print_exc()

        return {"files": files}

    except Exception as e:
        print(f"[SET_DIRECTORY] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/file")
async def get_file(path: str):
    print(f"[GET_FILE] Request path: {path}")
    try:
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="File not found")
        
        with open(path, 'r', encoding='utf-8') as f:
            content = json.load(f)

        print(f"[GET_FILE] Success: file loaded")
        return content
    except Exception as e:
        print(f"[GET_FILE] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/file")
async def save_file(request: FileRequest):
    print(f"[SAVE_FILE] Request path: {request.path}")
    try:
        with open(request.path, 'w', encoding='utf-8') as f:
            json.dump(request.content, f, ensure_ascii=False, indent=2)
        print(f"[SAVE_FILE] Success: file saved")
        return {"status": "success"}
    except Exception as e:
        print(f"[SAVE_FILE] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/file")
async def delete_file(request: FileRequest):
    print(f"[DELETE_FILE] Request path: {request.path}")
    try:
        if os.path.exists(request.path):
            os.remove(request.path)
            print(f"[DELETE_FILE] Success: file deleted")
            return {"status": "success"}
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        print(f"[DELETE_FILE] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/file/new")
async def create_file(request: NewFileRequest):
    """仅负责创建文件，不处理文件顺序"""
    try:
        directory = request.directory
        if not os.path.exists(directory):
            os.makedirs(directory)
        
        filename = f"{uuid.uuid4().hex}.json"
        filepath = os.path.join(directory, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump({"messages": [
                {
                    "role": "user",
                    "content": ""
                },
                {
                    "role": "assistant",
                    "content": ""
                }
            ]}, f, ensure_ascii=False, indent=2)
        
        print(f"[CREATE_FILE] Created file: {filepath}")
        return {"path": filepath}
    except Exception as e:
        print(f"[CREATE_FILE] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/directories")
async def get_directories():
    print("[GET_DIRECTORIES] Request received")
    base_path = WORKSPACE_DIR
    try:
        directories = []
        root_files = [f for f in os.listdir(base_path) if f.endswith('.json')]
        directories.append({
            "name": "root",
            "path": os.path.abspath(base_path),
            "hasFiles": bool(root_files),
            "fileCount": len(root_files)
        })
        
        for root, dirs, _ in os.walk(base_path):
            for dir_name in dirs:
                full_path = os.path.join(root, dir_name)
                json_files = [f for f in os.listdir(full_path) if f.endswith('.json')]
                relative_path = os.path.relpath(full_path, base_path)
                directories.append({
                    "name": relative_path,
                    "path": os.path.abspath(full_path),
                    "hasFiles": bool(json_files),
                    "fileCount": len(json_files)
                })
        print(f"[GET_DIRECTORIES] Success: found {len(directories)} directories")
        return {"directories": directories}
    except Exception as e:
        print(f"[GET_DIRECTORIES] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/directory/create")
async def create_directory(request: CreateDirectoryRequest):
    print(f"[CREATE_DIRECTORY] Request path: {request.path}")
    try:
        if not os.path.abspath(request.path).startswith(os.path.abspath(WORKSPACE_DIR)):
            raise HTTPException(status_code=400, detail="Path must be under workspace directory")
        
        if os.path.exists(request.path):
            raise HTTPException(status_code=400, detail="Directory already exists")
        
        os.makedirs(request.path)
        print(f"[CREATE_DIRECTORY] Success: directory created at {request.path}")
        return {"status": "success", "path": request.path}
    except Exception as e:
        print(f"[CREATE_DIRECTORY] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/files/rename")
async def rename_files(request: RenameFilesRequest):
    """按顺序将文件重命名为数字序列"""
    try:
        directory = request.directory
        old_files = request.files
        result_files = []

        # 验证目录路径
        if not os.path.exists(directory):
            raise HTTPException(status_code=404, detail="Directory not found")

        # 为防止冲突，先用临时名称
        temp_names = []
        for i, old_path in enumerate(old_files):
            if not os.path.exists(old_path):
                raise HTTPException(status_code=404, detail=f"File not found: {old_path}")
            
            temp_name = f"temp_{i}_{uuid.uuid4().hex}.json"
            temp_path = os.path.join(directory, temp_name)
            os.rename(old_path, temp_path)
            temp_names.append(temp_path)

        # 然后重命名为最终名称
        for i, temp_path in enumerate(temp_names, 1):
            final_name = f"{i}.json"
            final_path = os.path.join(directory, final_name)
            os.rename(temp_path, final_path)
            result_files.append(final_path)

        print(f"[RENAME_FILES] Successfully renamed {len(result_files)} files")
        return {"files": result_files}
    except Exception as e:
        print(f"[RENAME_FILES] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
  