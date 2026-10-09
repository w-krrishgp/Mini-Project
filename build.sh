#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "📦 Building Frontend (Vite + React)..."
cd frontend
npm install
npm run build
cd ..

echo "🐍 Installing Backend Python Dependencies..."
cd backend
pip install -r requirements.txt
cd ..

echo "✅ Build completed successfully!"
