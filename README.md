# Facelogger - Secure Passwordless Facial Authentication Hub

Facelogger (FaceSec) is a modern web application demonstrating secure, passwordless facial biometric authentication combined with a password-based fallback system. The application uses client-side face recognition models and a secure FastAPI backend to verify identities without storing raw image files.

---

## 🚀 Key Features

* **Biometric Authentication**: Passwordless login and registration using facial descriptors.
* **In-Browser Machine Learning**: Face detection and recognition are performed entirely in the browser using `face-api.js` (running SSD MobileNet V1, Face Landmarks, and Face Recognition models). No camera streams or images are sent to the backend.
* **Secure Storage**: Only 128-dimensional floating-point face descriptors (embeddings) are saved in the database.
* **Hybrid Authentication**: Password login fallback for accounts with failed face matches or accounts registered without biometrics.
* **Premium Theme**: Modern user interface featuring dynamic glow spheres, custom glassmorphic panels, and seamless transitions between Dark and Light modes.
* **Secure Sessions**: Starlette-based signed cookie sessions for user session tracking.

---

## 🛠️ Architecture

* **Frontend**: React, Vite, Vanilla CSS.
  * `src/App.jsx`: State management, authentication orchestration, theme toggling, and page layouts.
  * `src/components/WebcamView.jsx`: HTML5 canvas rendering, camera frame scanning, and face-api.js integration.
  * `src/components/AuthForm.jsx`: Elegant login/registration forms and visual feedbacks.
  * `src/components/Dashboard.jsx`: Confirmed user state display and logout controls.
* **Backend**: Python, FastAPI, SQLite, Pydantic.
  * `backend/main.py`: REST endpoints for registration, verification, sessions, and biometric logic.
  * `backend/database.py`: SQLite connection wrapper, password hashing, and user queries.
* **Database**: SQLite3 (`backend/data/face_sec.db`).

---

## ⚙️ Prerequisites

* **Node.js**: v18+ (for frontend Vite build tools)
* **Python**: v3.10+ (for backend FastAPI server)
* **Webcam**: A functional webcam is required for biometric scan actions.

---

## 💻 Setup & Installation

Follow these steps to run the project locally on your machine.

### 1. Clone & Prepare Directory
If you have cloned the repository, navigate to the folder:
```bash
cd Face-Sec
```

### 2. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   * **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     ..\venv\Scripts\Activate.ps1
     ```
   * **macOS/Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### 3. Frontend Setup
1. Open a separate terminal at the project root (`Face-Sec`).
2. Install the frontend dependencies:
   ```bash
   npm install
   ```

---

## 🏁 Running the Application

To run both servers in parallel:

### 1. Start the Backend Server
From the `backend` folder (ensure virtual environment is active):
```bash
uvicorn main:app --port 8000
```
* The API runs locally at `http://127.0.0.1:8000`

### 2. Start the Frontend Server
From the root folder (`Face-Sec`):
```bash
npm run dev
```
* The React application runs locally at `http://localhost:3001`
* Vite automatically proxies any `/api` routes to the backend on `http://127.0.0.1:8000`.

---

## 🧹 Database Maintenance

If you need to reset the SQLite database (e.g., clear all registered users to start fresh):

1. Navigate to the root directory.
2. Run the database reset script:
   ```bash
   python backend/scripts/clear_db.py
   ```

---

## 🤖 AI Agent Integration

This project includes a [skills.md](skills.md) file in the root directory. This file enables AI agents (such as Antigravity, GitHub Copilot, Claude, Cursor, or ChatGPT) to understand the project structure and execute the launch (`run`) and reset (`reset users`) commands automatically on request.
