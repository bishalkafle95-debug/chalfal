import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { io } from "socket.io-client";
import Peer from "simple-peer";
import { useAuth } from "../context/AuthContext.jsx";

const SOCKET_URL = "https://chalfal.onrender.com";

const BASE_PEER_CONFIG = {
  trickle: true,
  config: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  },
};

const MEDIA_CONSTRAINTS = {
  video: {
    width: { ideal: 640, max: 1280 },
    height: { ideal: 360, max: 720 },
    frameRate: { ideal: 24, max: 30 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
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
const MicOnIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);
const MicOffIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);
const CamOnIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);
const CamOffIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const ScreenIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);
const ChatIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const EndIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const TranslateIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 8l6 6" />
    <path d="M4 14l6-6 2-3" />
    <path d="M2 5h12" />
    <path d="M7 2h1" />
    <path d="M22 22l-5-10-5 10" />
    <path d="M14 18h6" />
  </svg>
);

const translationCache = new Map();
const getBaseLang = (code = "") => code.toLowerCase().split("-")[0];

const QUESTION_STARTERS = {
  en: /^(what|where|when|why|who|whom|whose|which|how|is|are|am|was|were|do|does|did|can|could|will|would|shall|should|have|has|had)\b/i,
  ne: /^(के|कहाँ|कहिले|किन|को|कस्तो|कति|कसरी|कुन)/,
  hi: /^(क्या|कहाँ|कब|क्यों|कौन|कैसा|कैसी|कैसे|कितना|कितने|किस)/,
  es: /^(qué|dónde|cuándo|por qué|quién|cómo|cuál|cuánto)/i,
  fr: /^(que|quoi|où|quand|pourquoi|qui|comment|quel|quelle|est-ce)/i,
};

function punctuateForTranslation(text, sourceLang) {
  let clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const base = getBaseLang(sourceLang);
  const isDevanagari = base === "ne" || base === "hi";
  if (!isDevanagari) clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  if (!/[.?!।]$/.test(clean)) {
    const qRegex = QUESTION_STARTERS[base];
    clean += qRegex && qRegex.test(clean) ? "?" : isDevanagari ? "।" : ".";
  }
  return clean;
}

const MEETING_STYLES = `
  :root {
    --bg-light: #0b192c;
    --accent: #e63946;
    --text-main: #fff;
    --text-muted: #bbb;
    --accent-light: rgba(230, 57, 70, 0.2);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  .page-wrapper { min-height: 100vh; background-color: var(--bg-light); display: flex; flex-direction: column; color: var(--text-main); }

  .lobby-card { background: #1a1a1a; padding: 3rem; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #333; width: 100%; max-width: 480px; text-align: center; }
  .lobby-logo { display: inline-flex; justify-content: center; color: var(--accent); margin-bottom: 1rem; }
  .lobby-title { font-size: 2rem; color: #fff; margin-bottom: 0.5rem; font-weight: 800; }
  .lobby-sub { color: var(--text-muted); font-size: 1rem; margin-bottom: 1.75rem; }
  .lobby-status-bar { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 1.5rem; font-size: 0.8rem; }
  .status-pill { flex: 1; padding: 7px 10px; border-radius: 8px; background: #111; border: 1px solid #333; color: #ccc; font-weight: 600; }
  .status-pill.ok { border-color: rgba(46,204,113,0.4); color: #2ecc71; }
  .status-pill.warn { border-color: rgba(255,183,3,0.4); color: #ffb703; }
  .status-pill.err { border-color: rgba(230,57,70,0.5); color: #ff6b6b; }
  .form-group { text-align: left; margin-bottom: 2rem; }
  .form-group label { display: block; margin-bottom: 10px; color: #fff; font-size: 0.95rem; font-weight: 600; }
  .lobby-select { width: 100%; padding: 14px 16px; background: #0b192c; border: 2px solid #333; border-radius: 8px; font-size: 1rem; color: #fff; outline: none; cursor: pointer; transition: border-color 0.2s; }
  .lobby-select:focus { border-color: var(--accent); }
  .btn-join { width: 100%; padding: 16px; background: var(--accent); color: #fff; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: background 0.2s, transform 0.2s; }
  .btn-join:hover { background: #c1121f; transform: translateY(-2px); }

  .meet-topbar { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 5%; background: #1a1a1a; border-bottom: 1px solid #333; position: sticky; top: 0; z-index: 100; flex-wrap: wrap; gap: 10px; }
  .logo { display: flex; align-items: center; text-decoration: none; color: #fff; font-weight: bold; font-size: 1.1rem; }
  .logo-icon { margin-right: 8px; color: var(--accent); display: flex; }
  .room-code { background: var(--accent-light); color: var(--accent); padding: 6px 12px; border-radius: 50px; font-size: 0.9rem; border: none; font-weight: 700; cursor: pointer; }
  .meet-body { flex: 1; display: flex; overflow: hidden; }
  .video-grid { flex: 1; display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; padding: 1rem; overflow-y: auto; background: #000; align-content: start; }
  .video-tile { position: relative; background: #1a1a1a; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.5); aspect-ratio: 16/9; border: 2px solid #333; contain: layout style paint; }
  .video-tile video { width: 100%; height: 100%; object-fit: cover; display: block; }
  .video-tile.video-off { background: linear-gradient(135deg, #1b263b, #0d1b2a); }
  .video-tile.video-off video { opacity: 0; }
  .v-label { position: absolute; bottom: 10px; left: 10px; background: rgba(0,0,0,0.72); color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; }
  .v-muted { position: absolute; top: 10px; right: 10px; background: var(--accent); color: #fff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; }

  .v-subtitle { position: absolute; bottom: 45px; left: 5%; right: 5%; text-align: center; pointer-events: none; z-index: 5; }
  .v-subtitle span { background: rgba(0,0,0,0.88); color: #ffb703; padding: 7px 16px; border-radius: 8px; font-size: 1.05rem; font-weight: 800; text-shadow: 1px 1px 2px #000; border: 1px solid rgba(255,183,3,0.35); display: inline-block; max-width: 100%; line-height: 1.35; }
  .v-subtitle-orig { font-size: 0.78rem; color: #cfcfcf; font-weight: 400; margin-top: 3px; text-shadow: none; }
  .v-subtitle.interim span { color: #e5e5e5; background: rgba(0,0,0,0.65); font-weight: 600; border: 1px solid #666; font-size: 0.95rem; }

  .chat-panel { width: 360px; background: #111; border-left: 1px solid #333; display: flex; flex-direction: column; transition: width 0.25s ease, opacity 0.25s ease; overflow: hidden; }
  .chat-panel.hidden { width: 0; opacity: 0; border-left: none; pointer-events: none; }
  .chat-panel-header { padding: 1.1rem; border-bottom: 1px solid #333; color: #fff; font-weight: 700; font-size: 1.05rem; }
  .chat-messages { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.85rem; background: #1a1a1a; }
  .chat-msg { color: #fff; font-size: 0.95rem; line-height: 1.45; }
  .cm-name { font-weight: 700; color: #ffb703; margin-right: 8px; }
  .cm-time { display: block; color: #999; font-size: 0.78rem; margin-top: 2px; }
  .chat-input-row { padding: 0.9rem; border-top: 1px solid #333; display: flex; gap: 10px; background: #111; }
  .chat-input-row input { flex: 1; padding: 11px 14px; border: 1px solid #444; border-radius: 8px; background: #222; color: #fff; outline: none; }
  .chat-input-row button { padding: 0 18px; background: var(--accent); color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }

  .meet-toolbar { display: flex; justify-content: center; gap: 15px; padding: 0.9rem; background: #1a1a1a; border-top: 1px solid #333; position: sticky; bottom: 0; }
  .tb-btn { width: 52px; height: 52px; background: #333; color: #fff; border: 2px solid transparent; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s, transform 0.2s; }
  .tb-btn:hover { background: #444; transform: translateY(-2px); }
  .tb-btn.active { background: #444; }
  .tb-btn.off { background: var(--accent-light); color: var(--accent); border-color: var(--accent); }
  .tb-btn.end { background: var(--accent); color: #fff; }
  @media (max-width: 900px) { .meet-body { flex-direction: column; } .chat-panel { width: 100%; height: 280px; border-left: none; border-top: 1px solid #333; } .chat-panel.hidden { height: 0; width: 100%; } }
`;

function Meeting() {
  const { roomCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- UI State ---
  const [hasJoined, setHasJoined] = useState(false);
  const [serverStatus, setServerStatus] = useState("waking");
  const [peers, setPeers] = useState([]);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [copiedCode, setCopiedCode] = useState(false);

  // --- Local AI Translation State ---
  const [myLanguage, setMyLanguage] = useState("en-US");
  const [subtitles, setSubtitles] = useState({});
  const [interimSubtitles, setInterimSubtitles] = useState({});
  const [myLiveCaption, setMyLiveCaption] = useState("");
  const [modelStatus, setModelStatus] = useState("ready"); // loading | ready | error
  const [modelProgress, setModelProgress] = useState(0);
  const [activeEngine, setActiveEngine] = useState("Local AI Ready");
  const [modelError, setModelError] = useState("");

  // --- Refs ---
  const socketRef = useRef(null);
  const userVideoRef = useRef(null);
  const streamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef([]);
  const recognitionRef = useRef(null);
  const workerRef = useRef(null);

  // Tier 1 native on-device translator instances cache: "src->tgt" => Translator | false
  const nativeTranslatorsRef = useRef(new Map());

  // Tier 2/3 worker single-flight queue refs
  const workerReadyRef = useRef(false);
  const workerBusyRef = useRef(false);
  const pendingJobsRef = useRef(new Map());

  const myLanguageRef = useRef(myLanguage);
  const mutedRef = useRef(muted);
  const lastInterimEmitRef = useRef(0);
  const latestSeqRef = useRef({});
  const subtitleTimersRef = useRef({});
  const interimTimersRef = useRef({});
  const selfCaptionTimerRef = useRef(null);

  useEffect(() => { myLanguageRef.current = myLanguage; }, [myLanguage]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const userName = user?.fullName || "Guest";

  const showFinalSubtitle = useCallback((socketId, translated, original) => {
    if (interimTimersRef.current[socketId]) {
      clearTimeout(interimTimersRef.current[socketId]);
    }
    setInterimSubtitles((prev) => (prev[socketId] ? { ...prev, [socketId]: "" } : prev));
    setSubtitles((prev) => ({
      ...prev,
      [socketId]: { translated, original },
    }));

    if (subtitleTimersRef.current[socketId]) {
      clearTimeout(subtitleTimersRef.current[socketId]);
    }
    subtitleTimersRef.current[socketId] = setTimeout(() => {
      setSubtitles((prev) => ({ ...prev, [socketId]: null }));
    }, 7000);
  }, []);

  const showInterimSubtitle = useCallback((socketId, text) => {
    setInterimSubtitles((prev) => ({ ...prev, [socketId]: text }));
    if (interimTimersRef.current[socketId]) {
      clearTimeout(interimTimersRef.current[socketId]);
    }
    interimTimersRef.current[socketId] = setTimeout(() => {
      setInterimSubtitles((prev) => ({ ...prev, [socketId]: "" }));
    }, 4000);
  }, []);

  const pumpWorkerQueue = useCallback(() => {
    if (!workerRef.current || !workerReadyRef.current || workerBusyRef.current) return;
    if (pendingJobsRef.current.size === 0) return;

    const [nextKey, job] = pendingJobsRef.current.entries().next().value;
    pendingJobsRef.current.delete(nextKey);

    workerBusyRef.current = true;
    workerRef.current.postMessage({ type: "translate", ...job });
  }, []);

  // Tier 1: Try Chrome/Edge built-in on-device Translator API (offline, instant, highest accuracy)
  const tryNativeOnDeviceTranslate = useCallback(async (text, sourceLang, targetLang) => {
    if (typeof window === "undefined" || !("Translator" in window)) return null;

    const src = getBaseLang(sourceLang);
    const tgt = getBaseLang(targetLang);
    const key = `${src}->${tgt}`;

    try {
      let instance = nativeTranslatorsRef.current.get(key);
      if (instance === false) return null;

      if (!instance) {
        const availability = await window.Translator.availability({
          sourceLanguage: src,
          targetLanguage: tgt,
        });
        if (!availability || availability === "unavailable") {
          nativeTranslatorsRef.current.set(key, false);
          return null;
        }
        instance = await window.Translator.create({
          sourceLanguage: src,
          targetLanguage: tgt,
        });
        nativeTranslatorsRef.current.set(key, instance);
      }

      const prepared = punctuateForTranslation(text, sourceLang);
      const result = await instance.translate(prepared);
      return result ? result.trim() : null;
    } catch {
      nativeTranslatorsRef.current.set(key, false);
      return null;
    }
  }, []);

  // ==========================================
  // 0. Pre-warm Render Backend immediately in Lobby
  // ==========================================
  useEffect(() => {
    let active = true;
    fetch(SOCKET_URL, { mode: "no-cors", cache: "no-store" })
      .then(() => {
        if (active) setServerStatus((s) => (s === "connected" ? s : "ready"));
      })
      .catch(() => {
        if (active) setServerStatus((s) => (s === "connected" ? s : "ready"));
      });
    return () => { active = false; };
  }, []);

  // ==========================================
  // 1. Initialize Local Offline Translation Worker
  // ==========================================
  useEffect(() => {
    let worker;
    workerReadyRef.current = false;
    workerBusyRef.current = false;

    try {
      worker = new Worker(
        new URL("../workers/translatorWorker.js", import.meta.url),
        { type: "module" }
      );
      workerRef.current = worker;
      worker.postMessage({ type: "init", preferredLang: myLanguageRef.current });

      worker.onmessage = (event) => {
        const {
          status,
          progress,
          model,
          engine,
          error,
          socketId,
          sourceLang,
          targetLang,
          originalText,
          translatedText,
        } = event.data || {};

        if (status === "loading") {
          setModelStatus("loading");
          if (typeof progress === "number") setModelProgress(Math.round(progress));
          if (model) setActiveEngine(`Loading ${model}`);
          return;
        }

        if (status === "ready") {
          workerReadyRef.current = true;
          workerBusyRef.current = false;
          setModelStatus("ready");
          setModelProgress(100);
          setActiveEngine("Local AI Ready");
          pumpWorkerQueue();
          return;
        }

        if (status === "error") {
          workerBusyRef.current = false;
          console.error("Translator worker error:", error);

          if (!workerReadyRef.current) {
            setModelStatus("error");
            setModelError(error || "Model failed to load");
          } else if (socketId && originalText) {
            showFinalSubtitle(socketId, originalText, originalText);
            pumpWorkerQueue();
          }
          return;
        }

        if (status === "complete") {
          workerBusyRef.current = false;
          workerReadyRef.current = true;
          setModelStatus("ready");
          if (engine) setActiveEngine(engine);

          const cacheKey = `${getBaseLang(sourceLang)}:${getBaseLang(targetLang)}:${originalText.trim().toLowerCase()}`;
          if (translationCache.size > 500) translationCache.clear();
          translationCache.set(cacheKey, translatedText);

          showFinalSubtitle(socketId, translatedText, originalText);
          pumpWorkerQueue();
        }
      };

      worker.onerror = (err) => {
        console.error("Worker crashed:", err.message || err);
        workerReadyRef.current = false;
        workerBusyRef.current = false;
        setModelStatus("error");
        setModelError(err.message || "Worker script failed to load");
      };
    } catch (err) {
      console.error("Worker init error:", err);
      setModelStatus("error");
      setModelError(err.message);
    }

    return () => {
      if (worker) worker.terminate();
      workerRef.current = null;
      workerReadyRef.current = false;
      workerBusyRef.current = false;
      pendingJobsRef.current.clear();
      Object.values(subtitleTimersRef.current).forEach(clearTimeout);
      Object.values(interimTimersRef.current).forEach(clearTimeout);
      if (selfCaptionTimerRef.current) clearTimeout(selfCaptionTimerRef.current);
    };
  }, [pumpWorkerQueue, showFinalSubtitle]);

  const requestLocalTranslation = useCallback(async (socketId, text, sourceLang, isInterim) => {
    const cleanText = (text || "").trim();
    if (!cleanText) return;

    const targetLang = myLanguageRef.current;
    const seq = (latestSeqRef.current[socketId] || 0) + 1;
    latestSeqRef.current[socketId] = seq;

    // 1. Interim fragments: show live raw preview without running heavy inference
    if (isInterim) {
      showInterimSubtitle(socketId, cleanText);
      return;
    }

    // 2. Same base language -> instant display
    if (getBaseLang(sourceLang) === getBaseLang(targetLang)) {
      showFinalSubtitle(socketId, cleanText, cleanText);
      return;
    }

    // 3. Cache hit -> instant display
    const cacheKey = `${getBaseLang(sourceLang)}:${getBaseLang(targetLang)}:${cleanText.toLowerCase()}`;
    if (translationCache.has(cacheKey)) {
      showFinalSubtitle(socketId, translationCache.get(cacheKey), cleanText);
      return;
    }

    // 4. Tier 1: Try native browser on-device Translator API first
    const nativeResult = await tryNativeOnDeviceTranslate(cleanText, sourceLang, targetLang);
    if (nativeResult) {
      if (translationCache.size > 500) translationCache.clear();
      translationCache.set(cacheKey, nativeResult);
      setModelStatus("ready");
      setActiveEngine("On-Device AI");
      showFinalSubtitle(socketId, nativeResult, cleanText);
      return;
    }

    // 5. Fallback if worker is unavailable
    if (!workerRef.current || !workerReadyRef.current) {
      showFinalSubtitle(socketId, cleanText, cleanText);
      return;
    }

    // 6. Tier 2/3: Queue into Opus-MT / NLLB worker
    showInterimSubtitle(socketId, `${cleanText} ...`);
    pendingJobsRef.current.set(socketId, {
      seq,
      socketId,
      text: cleanText,
      sourceLang,
      targetLang,
    });
    pumpWorkerQueue();
  }, [pumpWorkerQueue, showFinalSubtitle, showInterimSubtitle, tryNativeOnDeviceTranslate]);

  const requestTranslationRef = useRef(requestLocalTranslation);
  useEffect(() => {
    requestTranslationRef.current = requestLocalTranslation;
  }, [requestLocalTranslation]);

  // Pre-warm Tier 1 native packs on Join click (uses valid user gesture)
  const handleLobbyJoin = (e) => {
    e.preventDefault();
    const myBase = getBaseLang(myLanguage);
    if ("Translator" in window) {
      const commonSource = myBase === "en" ? "hi" : "en";
      tryNativeOnDeviceTranslate("hello", commonSource, myLanguage).catch(() => {});
    }
    if (myBase === "ne" && workerRef.current) {
      workerRef.current.postMessage({ type: "init", preferredLang: myLanguage });
    }
    setHasJoined(true);
  };

  // ==========================================
  // 2. Speech Recognition
  // ==========================================
  useEffect(() => {
    if (!hasJoined) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Web Speech API is not supported in this browser.");
      return;
    }

    let isStopping = false;
    let fatalError = false;
    let restartTimer = null;

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
      const trimmedInterim = interimTranscript.trim();
      const trimmedFinal = finalTranscript.trim();

      if (trimmedInterim && now - lastInterimEmitRef.current >= 900) {
        lastInterimEmitRef.current = now;
        setMyLiveCaption(trimmedInterim);
        socketRef.current.emit("send-interim-subtitle", {
          roomCode,
          text: trimmedInterim,
          sourceLang: myLanguage,
          name: userName,
        });
      }

      if (trimmedFinal) {
        setMyLiveCaption(trimmedFinal);
        if (selfCaptionTimerRef.current) clearTimeout(selfCaptionTimerRef.current);
        selfCaptionTimerRef.current = setTimeout(() => setMyLiveCaption(""), 4500);

        socketRef.current.emit("send-subtitle", {
          roomCode,
          text: trimmedFinal,
          sourceLang: myLanguage,
          name: userName,
        });
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        fatalError = true;
        console.error("Speech recognition permission denied:", event.error);
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        console.warn("Speech recognition error:", event.error);
      }
    };

    recognition.onend = () => {
      if (!isStopping && !fatalError && !mutedRef.current) {
        restartTimer = setTimeout(() => {
          if (!isStopping && !mutedRef.current) {
            try { recognition.start(); } catch (_) {}
          }
        }, 400);
      }
    };

    recognitionRef.current = recognition;
    if (!mutedRef.current) {
      try { recognition.start(); } catch (_) {}
    }

    return () => {
      isStopping = true;
      if (restartTimer) clearTimeout(restartTimer);
      try { recognition.stop(); } catch (_) {}
      recognitionRef.current = null;
    };
  }, [hasJoined, myLanguage, roomCode, userName]);

  useEffect(() => {
    const rec = recognitionRef.current;
    if (!rec || !hasJoined) return;
    if (muted) {
      setMyLiveCaption("");
      try { rec.stop(); } catch (_) {}
    } else {
      try { rec.start(); } catch (_) {}
    }
  }, [muted, hasJoined]);

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
      .getUserMedia(MEDIA_CONSTRAINTS)
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

        const socket = io(SOCKET_URL, {
          transports: ["websocket", "polling"],
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
        });
        activeSocket = socket;
        socketRef.current = socket;

        socket.on("connect", () => {
          setServerStatus("connected");
          socket.emit("join-room", { roomCode, name: userName });
        });

        socket.on("disconnect", () => {
          setServerStatus("waking");
        });

        socket.on("all-users", (users) => {
          peersRef.current.forEach((p) => {
            if (!p.peer.destroyed) p.peer.destroy();
          });
          peersRef.current = [];

          users.forEach((u) => {
            const peer = new Peer({ ...BASE_PEER_CONFIG, initiator: true, stream });
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
            peer.on("error", (err) => console.warn("Peer error:", err.message));

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
            if (!existing.peer.destroyed) existing.peer.signal(signal);
            return;
          }

          const peer = new Peer({ ...BASE_PEER_CONFIG, initiator: false, stream });
          peer.on("signal", (retSignal) => {
            socket.emit("returning-signal", { signal: retSignal, callerId });
          });
          peer.on("stream", (remoteStream) => {
            attachRemoteStream(callerId, remoteStream);
          });
          peer.on("error", (err) => console.warn("Peer error:", err.message));
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
          if (item && !item.peer.destroyed) item.peer.signal(signal);
        });

        socket.on("user-left", ({ socketId }) => {
          const item = peersRef.current.find((p) => p.peerId === socketId);
          if (item && !item.peer.destroyed) item.peer.destroy();
          peersRef.current = peersRef.current.filter((p) => p.peerId !== socketId);
          setPeers([...peersRef.current]);

          pendingJobsRef.current.delete(socketId);
          if (subtitleTimersRef.current[socketId]) clearTimeout(subtitleTimersRef.current[socketId]);
          if (interimTimersRef.current[socketId]) clearTimeout(interimTimersRef.current[socketId]);
          setSubtitles((prev) => ({ ...prev, [socketId]: null }));
          setInterimSubtitles((prev) => ({ ...prev, [socketId]: "" }));
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
      peersRef.current.forEach((p) => {
        if (!p.peer.destroyed) p.peer.destroy();
      });
      peersRef.current = [];
      setPeers([]);
    };
  }, [hasJoined, roomCode, userName]);

  const toggleMute = () => {
    const stream = streamRef.current;
    if (!stream) return;
    const nextMuted = !muted;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) audioTrack.enabled = !nextMuted;
    setMuted(nextMuted);
    socketRef.current?.emit("toggle-mute", { roomCode, muted: nextMuted });
  };

  const toggleVideo = () => {
    const stream = streamRef.current;
    if (!stream) return;
    const nextVideoOff = !videoOff;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) videoTrack.enabled = !nextVideoOff;
    setVideoOff(nextVideoOff);
    socketRef.current?.emit("toggle-video", { roomCode, videoOff: nextVideoOff });
  };

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
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
  }, []);

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

  const handleSendMessage = useCallback((text) => {
    if (!text.trim()) return;
    socketRef.current?.emit("chat-message", { roomCode, message: text, name: userName });
  }, [roomCode, userName]);

  const handleEndCall = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((t) => t.stop());
    if (socketRef.current) socketRef.current.disconnect();
    navigate("/dashboard");
  };

  const handleCopyRoom = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const aiBadgeText =
    modelStatus === "ready"
      ? activeEngine
      : modelStatus === "loading"
      ? `${activeEngine} ${modelProgress}%`
      : "Captions Only (AI Error)";

  // ==========================================
  // PRE-JOIN LOBBY UI
  // ==========================================
  if (!hasJoined) {
    return (
      <div className="page-wrapper dark-theme" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{MEETING_STYLES}</style>
        <div className="lobby-card">
          <div className="lobby-logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <h1 className="lobby-title">Ready to join?</h1>
          <p className="lobby-sub">
            Room: <strong style={{ color: "#ffb703", fontFamily: "monospace" }}>{roomCode}</strong>
          </p>

          <div className="lobby-status-bar">
            <div className={`status-pill ${serverStatus === "waking" ? "warn" : "ok"}`}>
              {serverStatus === "waking" ? "Waking Server..." : "Server Ready"}
            </div>
            <div
              className={`status-pill ${modelStatus === "ready" ? "ok" : modelStatus === "loading" ? "warn" : "err"}`}
              title={modelError}
            >
              {aiBadgeText}
            </div>
          </div>

          <form onSubmit={handleLobbyJoin}>
            <div className="form-group">
              <label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <TranslateIcon /> Select your language
                </div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "normal" }}>
                  Uses on-device AI & dedicated bilingual models (zero external APIs).
                </span>
              </label>
              <select
                className="lobby-select"
                required
                value={myLanguage}
                onChange={(e) => setMyLanguage(e.target.value)}
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-join">Join Meeting</button>
          </form>

          <div style={{ marginTop: "20px" }}>
            <Link to="/dashboard" style={{ color: "var(--text-muted)", fontSize: "0.9rem", textDecoration: "none" }}>
              ← Cancel and return to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ACTIVE MEETING UI
  // ==========================================
  return (
    <div className="page-wrapper meet-wrapper dark-theme">
      <style>{MEETING_STYLES}</style>
      <div className="meet-topbar">
        <Link to="/dashboard" className="logo">
          <div className="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          Chalfal
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#333", padding: "6px 14px", borderRadius: "50px" }}>
          <TranslateIcon />
          <select
            value={myLanguage}
            onChange={(e) => setMyLanguage(e.target.value)}
            style={{
              background: "transparent",
              color: "#fff",
              border: "none",
              fontWeight: "bold",
              fontSize: "0.85rem",
              outline: "none",
              cursor: "pointer",
            }}
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} style={{ background: "#1a1a1a" }}>{l.name}</option>
            ))}
          </select>
          <span
            title={modelError}
            style={{
              fontSize: "0.75rem",
              padding: "2px 8px",
              borderRadius: "20px",
              background:
                modelStatus === "ready"
                  ? "rgba(46, 204, 113, 0.2)"
                  : modelStatus === "loading"
                  ? "rgba(255, 183, 3, 0.2)"
                  : "rgba(230, 57, 70, 0.25)",
              color:
                modelStatus === "ready"
                  ? "#2ecc71"
                  : modelStatus === "loading"
                  ? "#ffb703"
                  : "#ff6b6b",
              fontWeight: 600,
            }}
          >
            {aiBadgeText}
          </span>
        </div>

        <button className="room-code" onClick={handleCopyRoom} title="Click to copy">
          {copiedCode ? "Copied!" : <>Room: <span style={{ fontFamily: "monospace", marginLeft: "5px" }}>{roomCode}</span></>}
        </button>
      </div>

      <div className="meet-body">
        <div className="video-grid">
          <div className={`video-tile self-tile${videoOff && !screenSharing ? " video-off" : ""}`}>
            <video ref={userVideoRef} autoPlay playsInline muted />
            <span className="v-label">{userName} (You)</span>
            {muted && <span className="v-muted"><MicOffIcon /></span>}
            {myLiveCaption && !muted && (
              <div className="v-subtitle interim">
                <span>{myLiveCaption}</span>
              </div>
            )}
          </div>

          {peers.map((p) => (
            <PeerVideo
              key={p.peerId}
              peer={p.peer}
              stream={p.stream}
              name={p.name}
              muted={p.muted}
              videoOff={p.videoOff}
              finalSubtitle={subtitles[p.peerId]}
              interimSubtitle={interimSubtitles[p.peerId]}
            />
          ))}
        </div>

        <ChatPanel open={chatOpen} messages={messages} onSend={handleSendMessage} />
      </div>

      <div className="meet-toolbar">
        <button className={`tb-btn${muted ? " off" : " active"}`} onClick={toggleMute} title={muted ? "Unmute" : "Mute"}>
          {muted ? <MicOffIcon /> : <MicOnIcon />}
        </button>
        <button className={`tb-btn${videoOff ? " off" : " active"}`} onClick={toggleVideo} title={videoOff ? "Turn Camera On" : "Turn Camera Off"}>
          {videoOff ? <CamOffIcon /> : <CamOnIcon />}
        </button>
        <button className={`tb-btn${screenSharing ? " off" : " active"}`} onClick={toggleScreenShare} title="Share Screen">
          <ScreenIcon />
        </button>
        <button className={`tb-btn${chatOpen ? " active" : ""}`} onClick={() => setChatOpen((o) => !o)} title="Chat">
          <ChatIcon />
        </button>
        <button className="tb-btn end" onClick={handleEndCall} title="Leave Call">
          <EndIcon />
        </button>
      </div>
    </div>
  );
}

const PeerVideo = memo(function PeerVideo({ peer, stream, name, muted, videoOff, finalSubtitle, interimSubtitle }) {
  const ref = useRef(null);

  useEffect(() => {
    const activeRemoteStream = stream || peer?._remoteStreams?.[0];
    if (ref.current && activeRemoteStream && ref.current.srcObject !== activeRemoteStream) {
      ref.current.srcObject = activeRemoteStream;
      ref.current.play().catch(() => {});
    }
  }, [peer, stream]);

  return (
    <div className={`video-tile${videoOff ? " video-off" : ""}`}>
      <video ref={ref} autoPlay playsInline />
      <span className="v-label">{name}</span>
      {muted && <span className="v-muted"><MicOffIcon /></span>}

      {finalSubtitle?.translated ? (
        <div className="v-subtitle">
          <span>
            {finalSubtitle.translated}
            {finalSubtitle.original && finalSubtitle.original !== finalSubtitle.translated && (
              <div className="v-subtitle-orig">{finalSubtitle.original}</div>
            )}
          </span>
        </div>
      ) : interimSubtitle ? (
        <div className="v-subtitle interim">
          <span>{interimSubtitle}</span>
        </div>
      ) : null}
    </div>
  );
});

const ChatPanel = memo(function ChatPanel({ open, messages, onSend }) {
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (open) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className={`chat-panel${open ? "" : " hidden"}`}>
      <div className="chat-panel-header">In-Call Messages</div>
      <div className="chat-messages">
        {messages.length === 0 && (
          <div style={{ color: "#7a7a80", fontSize: "0.85rem", textAlign: "center", marginTop: "1rem" }}>
            No messages yet.
          </div>
        )}
        {messages.map((m, i) => (
          <div className="chat-msg" key={i}>
            <span className="cm-name">{m.name}</span>
            {m.message}
            <span className="cm-time">
              {new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form className="chat-input-row" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
});

export default Meeting;