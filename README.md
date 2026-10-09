# AI Code Reviewer Pro 🚀

> An intelligent, web-based code reviewer and DSA mentor powered by Google Gemini 3.8 Flash, FastAPI, React 19, and Monaco Editor.

[![CI Pipeline](https://github.com/w-krrishgp/Mini-Project/actions/workflows/ci.yml/badge.svg)](https://github.com/w-krrishgp/Mini-Project/actions/workflows/ci.yml)
![Gemini](https://img.shields.io/badge/Gemini-3.8--Flash-blue?logo=google)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)
![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react)
![Monaco Editor](https://img.shields.io/badge/Editor-Monaco-blueviolet)

---

## 🌟 Key Features

* **Multi-Language Monaco Editor**: Full IDE experience supporting **C++, Python, Java, JavaScript, TypeScript, and C** with syntax highlighting, bracket matching, and auto-formatting.
* **Preloaded Buggy DSA Samples**: Test cases for common algorithmic traps (integer overflow in binary search, off-by-one errors, quadratic $O(N^2)$ bottlenecks).
* **Gemini 3.8 Flash Code Analysis**:
  * Code quality score ($0-100$).
  * Algorithmic Time & Space complexity ($O(N)$, $O(\log N)$, etc.) plus optimal target complexity.
  * Filterable issue cards with severity, line numbers, and actionable suggestions.
  * Comprehensive refactored and fixed code snippets.
  * Strengths and interview takeaways.
* **Interactive Monaco Diff Viewer**: Side-by-side or inline visual diff comparing the original code against the AI-optimized solution with one-click **"Apply AI Fix"**.
* **Zero-Crash Local Demo Mode**: Built-in DSA heuristic analyzer when exploring without an API key.
* **Client & Server Key Configuration**: Configure `GEMINI_API_KEY` via `backend/.env` or directly through the UI settings modal.

---

## 🏗️ Architecture

```
miniproject/
├── backend/
│   ├── main.py              # FastAPI endpoints (/api/review, /api/health, /api/languages)
│   ├── requirements.txt     # Python dependencies (fastapi, google-genai, etc.)
│   └── .env.example         # Environment template for GEMINI_API_KEY
├── frontend/
│   ├── src/
│   │   ├── api/             # API client (reviewService.js)
│   │   ├── components/      # CodeEditor, DiffViewer, Header, ReviewResults, SidePanel
│   │   ├── constants/       # Supported languages, starters, and buggy DSA snippets
│   │   ├── App.jsx          # Root application state & layout
│   │   └── App.css          # Modern dark/light theme styling
│   ├── package.json
│   └── vite.config.js
└── .gitignore               # Ignores .venv, node_modules, .env, and dist
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
* **Node.js** (v18+ recommended)
* **Python** (v3.10+ recommended)
* Optional: [Google Gemini API Key](https://aistudio.google.com/app/apikey)

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Set your Gemini API Key
cp .env.example .env
# Edit .env and set: GEMINI_API_KEY=your_key_here

# Start the FastAPI server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
* Backend API runs at: `http://localhost:8000`
* Interactive API Docs: `http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
* Web application runs at: `http://localhost:5173`

---

## 🛠️ Testing Code Reviews

1. Open `http://localhost:5173`.
2. Click **"Load Buggy DSA Sample"** in the top navigation.
3. Click **"Review My Code"** to trigger the Gemini review.
4. Switch to **"Test Cases"** to view AI-generated boundary, edge, and scale test suites.
5. Switch to **"AI Mentor"** to chat 1-on-1 about your code, ask questions, or request optimizations.
6. Switch to **"Diff View"** to inspect side-by-side modifications.
7. Click **"Apply AI Fix"** to merge the fix into the editor.

---

## 🌐 1-Click Free Cloud Deployment (Render)

Deploy both the React frontend and FastAPI backend together on **Render.com** under a single free HTTPS URL:

### Method A: Using Render Blueprint (Automatic)
1. Sign in to [Render.com](https://dashboard.render.com).
2. Click **New +** > **Blueprint**.
3. Connect your GitHub repository: `https://github.com/w-krrishgp/Mini-Project`.
4. Render detects [`render.yaml`](./render.yaml) automatically.
5. In the prompt for `GEMINI_API_KEY`, enter your Google Gemini API key.
6. Click **Apply**. Render will build and deploy your live web application!

### Method B: Manual Web Service
1. On Render, click **New +** > **Web Service**.
2. Select your repository `w-krrishgp/Mini-Project`.
3. Choose **Docker** as the Runtime.
4. In **Environment Variables**, add:
   * `GEMINI_API_KEY` = `your_gemini_api_key_here`
   * `PORT` = `8000`
5. Click **Create Web Service**. Your app is live at `https://<your-service-name>.onrender.com`!

---

## 🤝 Contributing

1. Fork or clone the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

