const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

// Make sure these route files exist in your 'routes' folder
const authRoutes = require("./routes/auth");
const meetingRoutes = require("./routes/meetings");

const app = express();
const server = http.createServer(app);

// Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: "*", // For development. In production, restrict to your frontend URL
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);

app.get("/", (req, res) => {
  res.send("Chalfal API is running.");
});

// -------------------- SOCKET.IO SIGNALING & TRANSLATION --------------------
// roomCode -> { socketId: { name, muted, videoOff } }
const rooms = {};

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // 1. Join Room
  socket.on("join-room", ({ roomCode, name }) => {
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.name = name;

    if (!rooms[roomCode]) rooms[roomCode] = {};
    rooms[roomCode][socket.id] = { name, muted: false, videoOff: false };

    const otherUsers = Object.entries(rooms[roomCode])
      .filter(([id]) => id !== socket.id)
      .map(([id, info]) => ({ socketId: id, ...info }));

    socket.emit("all-users", otherUsers);

    socket.to(roomCode).emit("user-joined", { socketId: socket.id, name });
  });

  // 2. WebRTC Signaling
  socket.on("sending-signal", ({ userToSignal, callerId, signal, name }) => {
    io.to(userToSignal).emit("user-signal", { signal, callerId, name });
  });

  socket.on("returning-signal", ({ callerId, signal }) => {
    io.to(callerId).emit("receiving-returned-signal", { signal, id: socket.id });
  });

  // 3. Chat Messages
  socket.on("chat-message", ({ roomCode, message, name }) => {
    io.to(roomCode).emit("chat-message", {
      message,
      name,
      socketId: socket.id,
      time: new Date().toISOString(),
    });
  });

  // 4. Mute / Video Toggles
  socket.on("toggle-mute", ({ roomCode, muted }) => {
    if (rooms[roomCode] && rooms[roomCode][socket.id]) {
      rooms[roomCode][socket.id].muted = muted;
    }
    socket.to(roomCode).emit("user-toggle-mute", { socketId: socket.id, muted });
  });

  socket.on("toggle-video", ({ roomCode, videoOff }) => {
    if (rooms[roomCode] && rooms[roomCode][socket.id]) {
      rooms[roomCode][socket.id].videoOff = videoOff;
    }
    socket.to(roomCode).emit("user-toggle-video", { socketId: socket.id, videoOff });
  });

  // 5. Screen Sharing
  socket.on("screen-share-started", ({ roomCode }) => {
    socket.to(roomCode).emit("user-screen-share-started", { socketId: socket.id });
  });

  socket.on("screen-share-stopped", ({ roomCode }) => {
    socket.to(roomCode).emit("user-screen-share-stopped", { socketId: socket.id });
  });

  // 6. LIVE TRANSLATION / SUBTITLES
  
  // --- NEW: Handle Interim (no-delay) Speech Text ---
  socket.on("send-interim-subtitle", ({ roomCode, text, name }) => {
    // Broadcast the transcribed interim text to everyone ELSE in the room with no delay
    socket.to(roomCode).emit("receive-interim-subtitle", {
      socketId: socket.id,
      text,
      name
    });
  });

  // Handle Final (to be translated) Speech Text
  socket.on("send-subtitle", ({ roomCode, text, sourceLang, name }) => {
    // Broadcast the final transcribed text to everyone ELSE in the room
    // The receiver will handle the translation to their own language.
    socket.to(roomCode).emit("receive-subtitle", {
      socketId: socket.id,
      text,
      sourceLang,
      name
    });
  });

  // 7. Disconnect
  socket.on("disconnect", () => {
    const roomCode = socket.data.roomCode;
    if (roomCode && rooms[roomCode]) {
      delete rooms[roomCode][socket.id];
      socket.to(roomCode).emit("user-left", { socketId: socket.id });
      if (Object.keys(rooms[roomCode]).length === 0) {
        delete rooms[roomCode];
      }
    }
    console.log("Socket disconnected:", socket.id);
  });
});

// Using Port 5001 to avoid conflicts
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Chalfal server running on port ${PORT}`);
});