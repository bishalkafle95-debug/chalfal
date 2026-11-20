const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { readData, writeData } = require("../utils/db");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

function generateRoomCode() {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const part = () => Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${part()}-${part()}-${part()}`;
}

router.post("/create", authMiddleware, (req, res) => {
  const { title } = req.body;
  const meetings = readData("meetings");

  const newMeeting = {
    id: uuidv4(),
    roomCode: generateRoomCode(),
    title: title || "Untitled Meeting",
    hostId: req.user.id,
    hostEmail: req.user.email,
    createdAt: new Date().toISOString(),
  };

  meetings.push(newMeeting);
  writeData("meetings", meetings);

  res.status(201).json({ message: "Meeting created.", meeting: newMeeting });
});

router.get("/mine", authMiddleware, (req, res) => {
  const meetings = readData("meetings");
  const mine = meetings.filter((m) => m.hostId === req.user.id);
  res.json({ meetings: mine });
});

router.get("/:roomCode", (req, res) => {
  const meetings = readData("meetings");
  const meeting = meetings.find((m) => m.roomCode === req.params.roomCode);

  if (!meeting) {
    return res.status(404).json({ message: "Meeting room not found." });
  }

  res.json({ meeting });
});

module.exports = router;
