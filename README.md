# Development Setup

## Option 1: Running Locally

### Run backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

### Run frontend

```bash
cd frontend
npm install 
npm run dev
```

## Option 2: Using Docker Compose

```bash
# Start the services
# By default, workspace directory will be created in ./workspace
docker-compose up -d
```

### Set directory

```bash
# To specify a custom workspace directory:
WORKSPACE_DIR=/path/to/your/workspace docker-compose up -d
```

### Failed to access Docker Hub?

Run the following commands, try again.
```bash
# downlaod image archive
wget https://github.com/zjxszzzcb/conversations-editor/releases/download/v1.0.0/backend.tar.gz
wget https://github.com/zjxszzzcb/conversations-editor/releases/download/v1.0.0/frontend.tar.gz

# extract
gunzip backend.tar.gz
gunzip frontend.tar.gz

# load image
docker load < backend.tar
docker load < frontend.tar
```

The services will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

The workspace directory will be mounted to the container for data persistence. If it doesn't exist, it will be created automatically.
