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

```bash
# To specify a custom workspace directory:
WORKSPACE_DIR=/path/to/your/workspace docker-compose up -d
```

The services will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

The workspace directory will be mounted to the container for data persistence. If it doesn't exist, it will be created automatically.
