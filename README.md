# 🤖 AI Interview Platform

A full-stack AI-powered interview platform built with React, Node.js, Express, MongoDB, and Google Gemini AI.

## 🚀 Features
- **AI-Generated Questions** — Gemini AI creates tailored questions per role & difficulty
- **Real-time Evaluation** — AI scores each answer (0–10) with instant feedback
- **Timer per Question** — 2-minute countdown with voice warning indicators
- **Voice Input** — Browser speech recognition for hands-free answering
- **Detailed Reports** — Grade, strengths, improvements, and question breakdown
- **Rich Dashboard** — Stats, history, and quick-start shortcuts
- **JWT Authentication** — Secure login/register with bcrypt password hashing

## 🛠️ Tech Stack
| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS v3 |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| AI | Google Gemini 1.5 Flash |
| Auth | JWT + bcryptjs |
| Real-time | Socket.io |

## 📁 Folder Structure
```
ai-interview/
├── client/         # React Frontend (Vite + Tailwind)
└── server/         # Node.js Backend (Express + MongoDB)
```

## ⚡ Setup & Run

### Prerequisites
- Node.js v18+
- MongoDB running locally (or MongoDB Atlas)
- Google Gemini API Key

### 1. Install Dependencies
```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 2. Configure Environment
Edit `server/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-interview
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Start Development Servers
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### 4. Open App
Visit: http://localhost:5173

## 🗄️ MongoDB Compass
Connect with: `mongodb://localhost:27017`
Database: `ai-interview`
Collections: `users`, `interviews`, `reports`
