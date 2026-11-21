# Chalfal छलफल — Nepali Online Conferencing Platform

A full-stack video conferencing web app built with **React (Vite)** on the frontend
and **Node.js + Express + Socket.IO** on the backend. All data (users & meetings)
is stored in simple **JSON files** inside `server/data/` — no external database needed.

## Features
- Home page with Login / Signup buttons
- Login & Signup pages (JWT-based auth, passwords hashed with bcrypt)
- Dashboard: start a new meeting or join with a room code, view your past meetings
- Real-time video conferencing (WebRTC via simple-peer + Socket.IO signaling)
- Screen sharing
- In-meeting text chat
- Mute/unmute microphone, turn camera on/off
- Consistent design system (teal/green theme, Fjalla One + Inter fonts) across all pages

## Folder Structure
```
chalfal/
├── server/                 # Node.js/Express backend
│   ├── data/
│   │   ├── users.json      # stores registered users
│   │   └── meetings.json   # stores created meetings
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── meetings.js
│   ├── utils/
│   │   └── db.js
│   ├── server.js           # Express + Socket.IO server
│   ├── package.json
│   └── .env.example
└── client/                 # React (Vite) frontend
    ├── public/
    ├── src/
    │   ├── components/
    │   │   └── ProtectedRoute.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── Dashboard.jsx
    │   │   └── Meeting.jsx
    │   ├── styles/
    │   │   └── global.css
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## How to Run

### 1. Backend (server)
```bash
cd chalfal/server
npm install
npm run dev        # or: npm start
```
The backend runs on **http://localhost:5000**. It automatically reads/writes
`data/users.json` and `data/meetings.json`.

### 2. Frontend (client)
Open a new terminal:
```bash
cd chalfal/client
npm install
npm run dev
```
The frontend runs on **https://chalfal-iota.vercel.app/dashboard** and talks to the backend at
.

### 3. Using the app
1. Open https://chalfal-iota.vercel.app/dashboard — you'll see the Chalfal home page.
2. Click **Get started** to sign up, or **Sign in** if you already have an account.
3. From the **Dashboard**, click **Start meeting** to create a new room, or enter
   a room code under **Join a meeting**.
4. Inside a meeting you can mute/unmute, turn your camera on/off, share your
   screen, open the chat panel, and end the call.
5. To test multi-participant meetings, open the same room code in a second
   browser tab/window (or another device on the same network) and allow
   camera/microphone access.

## Notes for your Final Year Project report
- Data persistence: `server/data/users.json` and `server/data/meetings.json`
  act as a lightweight flat-file database (no MySQL/MongoDB required).
- Real-time media: uses WebRTC peer-to-peer connections; Socket.IO is only
  used for **signaling** (exchanging connection info) and chat/mute-state
  broadcast — actual video/audio streams go directly between browsers.
- Passwords are hashed with bcrypt before being saved to `users.json`; never
  store plain-text passwords.
- JWT tokens (7-day expiry) are used to protect the Dashboard and Meeting
  routes on both frontend (`ProtectedRoute`) and backend (`authMiddleware`).
- For deployment beyond localhost, you would need to configure HTTPS (WebRTC
  camera/mic access requires a secure context) and update `SOCKET_URL` /
  `API_BASE` in the client to point to your deployed backend URL.
