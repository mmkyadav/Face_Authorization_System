# AI Agent Project Skills & Orchestration Guide

This file defines project-specific operations, directory layouts, and execution workflows for AI coding assistants (e.g., Antigravity, GitHub Copilot, Claude, Cursor, ChatGPT).

---

## 1. Directory Layout & Architecture

- **`E:\Face-Sec`**: Root folder containing the React Web Application (Vite/React dev structure).
  - **`E:\Face-Sec\src`**: React source files (`App.jsx` handles state, `components/` contains UI and camera logic).
  - **`E:\Face-Sec\backend`**: Python FastAPI backend containing database connections and biometric validation.
    - **`E:\Face-Sec\backend\scripts`**: Scripts for database maintenance.

---

## 2. Command Trigger: `run`

When the user says **"run"** or asks to start the development servers, execute the following commands in separate background processes:

### Terminal 1: Backend Server
- **Directory**: `E:\Face-Sec\backend`
- **Command**: `..\venv\Scripts\uvicorn.exe main:app --port 8000`
- **Purpose**: Serves the FastAPI backend on `http://127.0.0.1:8000` (database connections, registration and biometric login matching).

### Terminal 2: Frontend Dev Server
- **Directory**: `E:\Face-Sec`
- **Command**: `npm run dev`
- **Purpose**: Boots the Vite development server on `http://localhost:3001` (hot-reloading client app, proxies API requests to backend).

---

## 3. Command Trigger: `reset users`

When the user says **"reset users"** or asks to clear the database:

- **Directory**: `E:\Face-Sec`
- **Command**: `python backend/scripts/clear_db.py`
- **Purpose**: Executes the SQLite reset script to delete all rows from the `users` table, allowing a clean slate for biometric test registrations.

---

## 4. Operational Notes for AI Agents

1. **Local Dev Setup**: The frontend runs on `http://localhost:3001` and communicates with the backend on `http://127.0.0.1:8000` via Vite's configured dev proxy.
2. **Biometrics**: Uses Vlad Mandic's `face-api.js` CDN package loaded in `index.html` to run model weights (`SSD MobileNet V1`, `Face Landmarks`, and `Face Recognition`) directly in the user's viewport.
