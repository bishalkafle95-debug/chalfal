import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import { useAuth } from "../context/AuthContext.jsx";

const SOCKET_URL = "http://localhost:5001";

const peerConfig = {
  initiator: false,
  trickle: false,
  config: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  },
};

const SUPPORTED_LANGUAGES = [
  { code: "en-US", name: "English" },
  { code: "ne-NP", name: "Nepali" },
  { code: "hi-IN", name: "Hindi" },
  { code: "es-ES", name: "Spanish" },
  { code: "fr-FR", name: "French" },
];

// --- Icons ---
const MicOnIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>;
const MicOffIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>;
const CamOnIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>;
const CamOffIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" /><line x1="1" y1="1" x2="23" y2="23" /></svg>;
const ScreenIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><path d="M8 21h8M12 17v4" /></svg>;
const ChatIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
const EndIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
const TranslateIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 8l6 6" /><path d="M4 14l6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="M22 22l-5-10-5 10" /><path d="M14 18h6" /></svg>;

const translationCache = new Map();

function Meeting() {
  const { roomCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- Pre-Join Lobby State ---
  const [hasJoined, setHasJoined] = useState(false);

  // --- Meeting State ---
  const [peers, setPeers] = useState([]);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // --- Local AI Translation State ---
  const [myLanguage, setMyLanguage] = useState("en-US");
  const [subtitles, setSubtitles] = useState({});
  const [interimTranslatedSubtitles, setInterimTranslatedSubtitles] = useState({});
  const [modelStatus, setModelStatus] = useState("ready");
  const [modelProgress, setModelProgress] = useState(0);

  // --- Refs ---
  const socketRef = useRef();
  const userVideoRef = useRef();
  const streamRef = useRef();
  const screenStreamRef = useRef();
  const peersRef = useRef([]);
  const chatEndRef = useRef();
  const recognitionRef = useRef(null);
  const workerRef = useRef(null);

  const myLanguageRef = useRef(myLanguage);
  const mutedRef = useRef(muted);
  const lastInterimEmitRef = useRef(0);
  const latestSeqRef = useRef({});
  const subtitleTimersRef = useRef({});

  useEffect(() => { myLanguageRef.current = myLanguage; }, [myLanguage]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const userName = user?.fullName || "Guest";

  // ==========================================
  // 1. Initialize Local Offline Translation Worker
  // ==========================================
  useEffect(() => {
    if (!hasJoined) return;

    let worker;
    try {
      worker = new Worker(new URL("../workers/translatorWorker.js", import.meta.url), {
        type: "module",
      });
      workerRef.current = worker;
      worker.postMessage({ type: "init" });

      worker.onmessage = (event) => {
        const { status, progress, seq, socketId, sourceLang, targetLang, originalText, isInterim, translatedText } = event.data;

        if (status === "loading") {
          setModelStatus("loading");
          if (typeof progress === "number") setModelProgress(progress);
          return;
        }
        if (status === "ready") {
          setModelStatus("ready");
          return;
        }
        if (status === "error") {
          setModelStatus("error");
          return;
        }
        if (status === "complete") {
          setModelStatus("ready");
          const cacheKey = `${sourceLang}:${targetLang}:${originalText.trim().toLowerCase()}`;
          if (translationCache.size > 500) translationCache.clear();
          translationCache.set(cacheKey, translatedText);

          if (isInterim && latestSeqRef.current[socketId] !== seq) return;

          if (isInterim) {
            setInterimTranslatedSubtitles((prev) => ({ ...prev, [socketId]: translatedText }));
          } else {
            setInterimTranslatedSubtitles((prev) => ({ ...prev, [socketId]: "" }));
            setSubtitles((prev) => ({ ...prev, [socketId]: translatedText }));

            if (subtitleTimersRef.current[socketId]) {
              clearTimeout(subtitleTimersRef.current[socketId]);
            }
            subtitleTimersRef.current[socketId] = setTimeout(() => {
              setSubtitles((prev) => ({ ...prev, [socketId]: "" }));
            }, 6000);
          }
        }
      };

      worker.onerror = (err) => {
        console.error("Translation worker failed to load:", err);
        setModelStatus("error");
      };
    } catch (err) {
      console.error("Worker init error:", err);
      setModelStatus("error");
    }

    return () => {
      if (worker) worker.terminate();
      workerRef.current = null;
    };
  }, [hasJoined]);

  const requestLocalTranslation = useCallback((socketId, text, sourceLang, isInterim) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    const targetLang = myLanguageRef.current;
    const seq = (latestSeqRef.current[socketId] || 0) + 1;
    latestSeqRef.current[socketId] = seq;

    if (sourceLang === targetLang) {
      if (isInterim) {
        setInterimTranslatedSubtitles((prev) => ({ ...prev, [socketId]: cleanText }));
      } else {
        setInterimTranslatedSubtitles((prev) => ({ ...prev, [socketId]: "" }));
        setSubtitles((prev) => ({ ...prev, [socketId]: cleanText }));
        if (subtitleTimersRef.current[socketId]) clearTimeout(subtitleTimersRef.current[socketId]);
        subtitleTimersRef.current[socketId] = setTimeout(() => {
          setSubtitles((prev) => ({ ...prev, [socketId]: "" }));
        }, 6000);
      }
      return;
    }

    const cacheKey = `${sourceLang}:${targetLang}:${cleanText.toLowerCase()}`;
    if (translationCache.has(cacheKey)) {
      const cached = translationCache.get(cacheKey);
      if (isInterim) {
        setInterimTranslatedSubtitles((prev) => ({ ...prev, [socketId]: cached }));
      } else {
        setInterimTranslatedSubtitles((prev) => ({ ...prev, [socketId]: "" }));
        setSubtitles((prev) => ({ ...prev, [socketId]: cached }));
        if (subtitleTimersRef.current[socketId]) clearTimeout(subtitleTimersRef.current[socketId]);
        subtitleTimersRef.current[socketId] = setTimeout(() => {
          setSubtitles((prev) => ({ ...prev, [socketId]: "" }));
        }, 6000);
      }
      return;
    }

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "translate",
        seq,
        socketId,
        text: cleanText,
        sourceLang,
        targetLang,
        isInterim,
      });
    }
  }, []);

  const requestTranslationRef = useRef(requestLocalTranslation);
  useEffect(() => {
    requestTranslationRef.current = requestLocalTranslation;
  }, [requestLocalTranslation]);

  // ==========================================
  // 2. Speech Recognition
  // ==========================================
  useEffect(() => {
    if (!hasJoined) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let isStopping = false;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = myLanguage;

    recognition.onresult = (event) => {
      if (mutedRef.current || !socketRef.current) return;

      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const now = Date.now();
      if (interimTranscript.trim().length > 0 && now - lastInterimEmitRef.current >= 450) {
        lastInterimEmitRef.current = now;
        socketRef.current.emit("send-interim-subtitle", {
          roomCode,
          text: interimTranscript.trim(),
          sourceLang: myLanguage,
          name: userName,
        });
      }

      if (finalTranscript.trim().length > 0) {
        socketRef.current.emit("send-subtitle", {
          roomCode,
          text: finalTranscript.trim(),
          sourceLang: myLanguage,
          name: userName,
        });
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.error("Speech recognition error", event.error);
      }
    };

    recognition.onend = () => {
      if (!isStopping && !mutedRef.current) {
        try {
          recognition.start();
        } catch (_) {}
      }
    };

    recognitionRef.current = recognition;
    if (!muted) {
      try {
        recognition.start();
      } catch (_) {}
    }

    return () => {
      isStopping = true;
      try {
        recognition.stop();
      } catch (_) {}
    };
  }, [hasJoined, myLanguage, muted, roomCode, userName]);

  // ==========================================
  // 3. Core WebRTC & Socket Connection
  // ==========================================
  useEffect(() => {
    if (!hasJoined) return;

    let isMounted = true;
    let activeStream = null;
    let activeSocket = null;

    const attachRemoteStream = (peerId, remoteStream) => {
      peersRef.current = peersRef.current.map((p) =>
        p.peerId === peerId ? { ...p, stream: remoteStream } : p
      );
      setPeers([...peersRef.current]);
    };

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        activeStream = stream;
        streamRef.current = stream;

        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
          userVideoRef.current.play().catch(() => {});
        }

        const socket = io(SOCKET_URL);
        activeSocket = socket;
        socketRef.current = socket;

        socket.emit("join-room", { roomCode, name: userName });

        socket.on("all-users", (users) => {
          peersRef.current.forEach((p) => p.peer.destroy());
          peersRef.current = [];

          users.forEach((u) => {
            const peer = new Peer({ ...peerConfig, initiator: true, stream });
            peer.on("signal", (signal) => {
              socket.emit("sending-signal", {
                userToSignal: u.socketId,
                callerId: socket.id,
                signal,
                name: userName,
              });
            });
            peer.on("stream", (remoteStream) => {
              attachRemoteStream(u.socketId, remoteStream);
            });
            peer.on("error", (err) => console.error("Peer error:", err));

            peersRef.current.push({
              peerId: u.socketId,
              peer,
              stream: null,
              name: u.name,
              muted: u.muted,
              videoOff: u.videoOff,
            });
          });
          setPeers([...peersRef.current]);
        });

        socket.on("user-signal", ({ signal, callerId, name }) => {
          const existing = peersRef.current.find((p) => p.peerId === callerId);
          if (existing) {
            existing.peer.signal(signal);
            return;
          }

          const peer = new Peer({ ...peerConfig, initiator: false, stream });
          peer.on("signal", (retSignal) => {
            socket.emit("returning-signal", { signal: retSignal, callerId });
          });
          peer.on("stream", (remoteStream) => {
            attachRemoteStream(callerId, remoteStream);
          });
          peer.on("error", (err) => console.error("Peer error:", err));
          peer.signal(signal);

          peersRef.current.push({
            peerId: callerId,
            peer,
            stream: null,
            name,
            muted: false,
            videoOff: false,
          });
          setPeers([...peersRef.current]);
        });

        socket.on("receiving-returned-signal", ({ id, signal }) => {
          const item = peersRef.current.find((p) => p.peerId === id);
          if (item) item.peer.signal(signal);
        });

        socket.on("user-left", ({ socketId }) => {
          const item = peersRef.current.find((p) => p.peerId === socketId);
          if (item) item.peer.destroy();
          peersRef.current = peersRef.current.filter((p) => p.peerId !== socketId);
          setPeers([...peersRef.current]);
        });

        socket.on("chat-message", (msg) => {
          setMessages((prev) => [...prev, msg]);
        });

        socket.on("user-toggle-mute", ({ socketId, muted: m }) => {
          peersRef.current = peersRef.current.map((p) =>
            p.peerId === socketId ? { ...p, muted: m } : p
          );
          setPeers([...peersRef.current]);
        });

        socket.on("user-toggle-video", ({ socketId, videoOff: v }) => {
          peersRef.current = peersRef.current.map((p) =>
            p.peerId === socketId ? { ...p, videoOff: v } : p
          );
          setPeers([...peersRef.current]);
        });

        socket.on("receive-interim-subtitle", ({ socketId, text, sourceLang }) => {
          requestTranslationRef.current(socketId, text, sourceLang, true);
        });

        socket.on("receive-subtitle", ({ socketId, text, sourceLang }) => {
          requestTranslationRef.current(socketId, text, sourceLang, false);
        });
      })
      .catch((err) => {
        if (isMounted) {
          alert("Could not access camera/microphone: " + err.message);
        }
      });

    return () => {
      isMounted = false;
      if (activeStream) activeStream.getTracks().forEach((t) => t.stop());
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
      if (activeSocket) activeSocket.disconnect();
      peersRef.current.forEach((p) => p.peer.destroy());
      peersRef.current = [];
      setPeers([]);
    };
  }, [hasJoined, roomCode, userName]);

  useEffect(() => {
    if (hasJoined) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, hasJoined]);

  const toggleMute = () => {
    const stream = streamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) audioTrack.enabled = muted;
    setMuted(!muted);
    socketRef.current?.emit("toggle-mute", { roomCode, muted: !muted });
  };

  const toggleVideo = () => {
    const stream = streamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) videoTrack.enabled = videoOff;
    setVideoOff(!videoOff);
    socketRef.current?.emit("toggle-video", { roomCode, videoOff: !videoOff });
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        peersRef.current.forEach(({ peer }) => {
          const sender = peer._pc?.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(screenTrack);
        });

        if (userVideoRef.current) userVideoRef.current.srcObject = screenStream;
        setScreenSharing(true);

        screenTrack.onended = () => stopScreenShare();
      } catch (err) {
        console.error("Screen share error:", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    const camTrack = streamRef.current?.getVideoTracks()[0];
    if (camTrack) {
      peersRef.current.forEach(({ peer }) => {
        const sender = peer._pc?.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(camTrack);
      });
    }
    if (userVideoRef.current && streamRef.current) {
      userVideoRef.current.srcObject = streamRef.current;
    }
    setScreenSharing(false);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socketRef.current?.emit("chat-message", { roomCode, message: chatInput, name: userName });
    setChatInput("");
  };

  const handleEndCall = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
    if (socketRef.current) socketRef.current.disconnect();
    navigate("/dashboard");
  };

  const handleLobbyJoin = (e) => {
    e.preventDefault();
    setHasJoined(true);
  };

  // ==========================================
  // PRE-JOIN LOBBY UI
  // ==========================================
  if (!hasJoined) {
    return (
      <div className="page-wrapper dark-theme" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`
          :root { --bg-light: #0b192c; --accent: #e63946; --text-main: #fff; --text-muted: #bbb; --primary-dark: #f8f9fa; }
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
          .page-wrapper { min-height: 100vh; background-color: var(--bg-light); display: flex; flex-direction: column; color: var(--text-main); }
          .lobby-card { background: #1a1a1a; padding: 3rem; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #333; width: 100%; max-width: 480px; text-align: center; }
          .lobby-logo { display: inline-flex; justify-content: center; color: var(--accent); margin-bottom: 1rem; }
          .lobby-title { font-size: 2rem; color: #fff; margin-bottom: 0.5rem; font-weight: 800; }
          .lobby-sub { color: var(--text-muted); font-size: 1rem; margin-bottom: 2.5rem; }
          .form-group { text-align: left; margin-bottom: 2rem; }
          .form-group label { display: block; margin-bottom: 10px; color: #fff; font-size: 0.95rem; font-weight: 600; }
          .lobby-select { width: 100%; padding: 14px 16px; background: #0b192c; border: 2px solid #333; border-radius: 8px; font-size: 1rem; color: #fff; outline: none; cursor: pointer; transition: border-color 0.2s; }
          .lobby-select:focus { border-color: var(--accent); }
          .btn-join { width: 100%; padding: 16px; background: var(--accent); color: #fff; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
          .btn-join:hover { background: #c1121f; transform: translateY(-2px); }
        `}</style>
        <div className="lobby-card">
          <div className="lobby-logo"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg></div>
          <h1 className="lobby-title">Ready to join?</h1>
          <p className="lobby-sub">You are about to enter room: <strong style={{ color: "#ffb703", fontFamily: "monospace" }}>{roomCode}</strong></p>
          <form onSubmit={handleLobbyJoin}>
            <div className="form-group">
              <label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}><TranslateIcon /> Select your compulsory language</div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "normal" }}>Runs offline via local AI model (no external API).</span>
              </label>
              <select className="lobby-select" required value={myLanguage} onChange={(e) => setMyLanguage(e.target.value)}>
                {SUPPORTED_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-join">Join Meeting</button>
          </form>
          <div style={{ marginTop: "20px" }}><Link to="/dashboard" style={{ color: "var(--text-muted)", fontSize: "0.9rem", textDecoration: "none" }}>← Cancel and return to dashboard</Link></div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ACTIVE MEETING UI
  // ==========================================
  return (
    <div className="page-wrapper meet-wrapper dark-theme">
      <style>{`
        :root { 
          --bg-light: #0b192c; 
          --accent: #e63946; 
          --text-main: #fff; 
          --text-muted: #bbb; 
          --accent-light: rgba(230, 57, 70, 0.2); 
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .page-wrapper { min-height: 100vh; background-color: var(--bg-light); display: flex; flex-direction: column; color: var(--text-main); }
        .meet-topbar { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 5%; background: #1a1a1a; border-bottom: 1px solid #333; position: sticky; top: 0; z-index: 100; flex-wrap: wrap; gap: 10px; }
        .logo { display: flex; align-items: center; text-decoration: none; color: #fff; font-weight: bold; font-size: 1.1rem; }
        .logo-icon { margin-right: 8px; color: var(--accent); display: flex; }
        .room-code { background: var(--accent-light); color: var(--accent); padding: 6px 12px; border-radius: 50px; font-size: 0.9rem; border: none; font-weight: 700; cursor: pointer; }
        .meet-body { flex: 1; display: flex; overflow: hidden; }
        .video-grid { flex: 1; display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1rem; padding: 1rem; overflow-y: auto; background: #000; align-content: start; }
        .video-tile { position: relative; background: #1a1a1a; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5); aspect-ratio: 16/9; border: 2px solid #333; }
        .video-tile video { width: 100%; height: 100%; object-fit: cover; display: block; }
        .video-tile.video-off { background: url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=300&q=80') center/cover; }
        .v-label { position: absolute; bottom: 10px; left: 10px; background: rgba(0,0,0,0.7); color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; }
        .v-muted { position: absolute; top: 10px; right: 10px; background: var(--accent); color: #fff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; }
        
        /* High-Visibility Subtitles */
        .v-subtitle { position: absolute; bottom: 45px; left: 5%; right: 5%; text-align: center; pointer-events: none; z-index: 5; transition: opacity 0.15s ease; }
        .v-subtitle span { background: rgba(0,0,0,0.9); color: #ffb703; padding: 6px 16px; border-radius: 8px; font-size: 1.1rem; font-weight: 900; text-shadow: 2px 2px 2px #000; border: 2px solid rgba(255,183,3,0.3); display: inline-block; }
        .v-subtitle.interim span { color: #ddd; background: rgba(0,0,0,0.65); font-weight: 700; border: 1px solid #666; font-size: 1rem; }

        .chat-panel { width: 380px; background: #111; border-left: 1px solid #333; display: flex; flex-direction: column; transition: all 0.3s; overflow: hidden; }
        .chat-panel.hidden { width: 0; opacity: 0; border-left: none; }
        .chat-panel-header { padding: 1.25rem; border-bottom: 1px solid #333; color: #fff; font-weight: 700; font-size: 1.1rem; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; background: #1a1a1a; }
        .chat-msg { color: #fff; font-size: 0.95rem; line-height: 1.5; }
        .cm-name { font-weight: 700; color: #ffb703; margin-right: 8px; }
        .cm-time { display: block; color: #bbb; font-size: 0.8rem; margin-top: 2px; }
        .chat-input-row { padding: 1rem; border-top: 1px solid #333; display: flex; gap: 10px; background: #111; }
        .chat-input-row input { flex: 1; padding: 12px 16px; border: 1px solid #444; border-radius: 8px; background: #222; color: #fff; }
        .chat-input-row button { padding: 0 20px; background: var(--accent); color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .meet-toolbar { display: flex; justify-content: center; gap: 15px; padding: 1rem; background: #1a1a1a; border-top: 1px solid #333; position: sticky; bottom: 0; }
        .tb-btn { width: 52px; height: 52px; background: #333; color: #fff; border: 2px solid transparent; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s ease; }
        .tb-btn:hover { background: #444; transform: translateY(-2px); }
        .tb-btn.active { background: #444; }
        .tb-btn.off { background: var(--accent-light); color: var(--accent); border-color: var(--accent); }
        .tb-btn.end { background: var(--accent); color: #fff; }
        @media (max-width: 900px) { .meet-body { flex-direction: column; } .chat-panel { width: 100%; height: 300px; border-left: none; border-top: 1px solid #333; } .chat-panel.hidden { height: 0; width: 100%; } }
      `}</style>
      <div className="meet-topbar">
        <Link to="/dashboard" className="logo">
          <div className="logo-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg></div>
          Chalfal
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#333", padding: "6px 16px", borderRadius: "50px" }}>
          <TranslateIcon />
          <span style={{ fontSize: "0.85rem", color: "#fff", fontWeight: "bold" }}>
            {SUPPORTED_LANGUAGES.find((l) => l.code === myLanguage)?.name}
          </span>
          <span style={{
            fontSize: "0.75rem",
            padding: "2px 8px",
            borderRadius: "20px",
            background: modelStatus === "ready" ? "rgba(46, 204, 113, 0.2)" : "rgba(255, 183, 3, 0.2)",
            color: modelStatus === "ready" ? "#2ecc71" : "#ffb703",
            fontWeight: 600,
          }}>
            {modelStatus === "ready"
              ? "Local AI Ready"
              : modelStatus === "loading"
              ? `Loading Model ${modelProgress}%`
              : "Worker Error"}
          </span>
        </div>
        <button className="room-code" onClick={() => navigator.clipboard.writeText(roomCode)} title="Click to copy">
          Room Code: <span style={{ fontFamily: "monospace", marginLeft: "5px" }}>{roomCode}</span>
        </button>
      </div>
      <div className="meet-body">
        <div className="video-grid">
          <div className={`video-tile self-tile${videoOff && !screenSharing ? " video-off" : ""}`}>
            <video ref={userVideoRef} autoPlay playsInline muted />
            <span className="v-label">{userName} (You)</span>
            {muted && <span className="v-muted"><MicOffIcon /></span>}
          </div>

          {peers.map((p) => (
            <PeerVideo
              key={p.peerId}
              peer={p.peer}
              stream={p.stream}
              name={p.name}
              muted={p.muted}
              videoOff={p.videoOff}
              finalSubtitleText={subtitles[p.peerId]}
              interimSubtitleText={interimTranslatedSubtitles[p.peerId]}
            />
          ))}
        </div>
        <div className={`chat-panel${chatOpen ? "" : " hidden"}`}>
          <div className="chat-panel-header">In-Call Messages</div>
          <div className="chat-messages">
            {messages.length === 0 && <div style={{ color: "#7a7a80", fontSize: "0.85rem", textAlign: "center", marginTop: "1rem" }}>No messages yet.</div>}
            {messages.map((m, i) => (
              <div className="chat-msg" key={i}><span className="cm-name">{m.name}</span>{m.message}<span className="cm-time">{new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form className="chat-input-row" onSubmit={sendMessage}>
            <input type="text" placeholder="Type a message..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
      <div className="meet-toolbar">
        <button className={`tb-btn${muted ? " off" : " active"}`} onClick={toggleMute}>{muted ? <MicOffIcon /> : <MicOnIcon />}</button>
        <button className={`tb-btn${videoOff ? " off" : " active"}`} onClick={toggleVideo}>{videoOff ? <CamOffIcon /> : <CamOnIcon />}</button>
        <button className={`tb-btn${screenSharing ? " off" : " active"}`} onClick={toggleScreenShare} title="Share Screen"><ScreenIcon /></button>
        <button className={`tb-btn${chatOpen ? " active" : ""}`} onClick={() => setChatOpen(!chatOpen)}><ChatIcon /></button>
        <button className="tb-btn end" onClick={handleEndCall}><EndIcon /></button>
      </div>
    </div>
  );
}

function PeerVideo({ peer, stream, name, muted, videoOff, finalSubtitleText, interimSubtitleText }) {
  const ref = useRef();

  useEffect(() => {
    const activeRemoteStream = stream || peer?._remoteStreams?.[0];
    if (ref.current && activeRemoteStream) {
      ref.current.srcObject = activeRemoteStream;
      ref.current.play().catch(() => {});
    }
  }, [peer, stream]);

  return (
    <div className={`video-tile${videoOff ? " video-off" : ""}`}>
      <video ref={ref} autoPlay playsInline />
      <span className="v-label">{name}</span>
      {muted && <span className="v-muted"><MicOffIcon /></span>}

      {finalSubtitleText && (
        <div className="v-subtitle">
          <span>{finalSubtitleText}</span>
        </div>
      )}

      {interimSubtitleText && !finalSubtitleText && (
        <div className="v-subtitle interim">
          <span>{interimSubtitleText}</span>
        </div>
      )}
    </div>
  );
}

export default Meeting;