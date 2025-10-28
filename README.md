# Digital Notice Board (Vite + React + Node + SQLite)

## Run (Windows)

- Open two terminals in this folder.

### Backend
```
cd backend
npm install
npm run dev
```
API: http://localhost:4000

### Frontend
```
cd frontend
npm install
npm run dev
```
App: http://localhost:5173

## Features
- Register/Login (JWT)
- Add Notice, Show Notices, Repost, Delete
- UI matches the provided screenshots (gradient auth, sidebar dashboard)
- SQLite database file `backend/data.db` (auto-created)

## Config
- JWT secret: env `JWT_SECRET` (optional). Create `.env` in backend to override.
