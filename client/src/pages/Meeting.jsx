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
  { code: "en-US", short: "EN", name: "English" },
  { code: "ne-NP", short: "NE", name: "Nepali" },
  { code: "hi-IN", short: "HI", name: "Hindi" },
  { code: "es-ES", short: "ES", name: "Spanish" },
  { code: "fr-FR", short: "FR", name: "French" },
];

const LINGVA_INSTANCES = [
  "https://lingva.ml/api/v1",
  "https://lingva.lunar.icu/api/v1",
];

// --- Icons ---
const MicOnIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);
const MicOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);
const CamOnIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);
const CamOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const ScreenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);
const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const CaptionsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M7 15h4M15 15h2M7 11h2M13 11h4" />
  </svg>
);
const EndIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const TranslateIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 8l6 6" />
    <path d="M4 14l6-6 2-3" />
    <path d="M2 5h12" />
    <path d="M7 2h1" />
    <path d="M22 22l-5-10-5 10" />
    <path d="M14 18h6" />
  </svg>
);
const CopyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

// --- Language & Translation Helpers ---
const translationCache = new Map();

const getBaseLang = (code) => {
  if (!code || typeof code !== "string") return "auto";
  return code.toLowerCase().split("-")[0];
};

const getLangName = (code) => {
  const base = getBaseLang(code);
  const match = SUPPORTED_LANGUAGES.find((l) => getBaseLang(l.code) === base);
  return match ? match.name : base === "auto" ? "Auto" : base.toUpperCase();
};

const QUESTION_STARTERS = {
  en: /^(what|what's|where|where's|when|why|who|who's|whom|whose|which|how|how's|is|are|am|was|were|do|does|did|can|could|will|would|shall|should|have|has|had)\b/i,
  ne: /^(के|कहाँ|कहिले|किन|को|कस्तो|कति|कसरी|कुन)/,
  hi: /^(क्या|कहाँ|कब|क्यों|कौन|कैसा|कैसी|कैसे|कितना|कितने|किस)/,
  es: /^(qué|dónde|cuándo|por qué|quién|cómo|cuál|cuánto)/i,
  fr: /^(que|quoi|où|quand|pourquoi|qui|comment|quel|quelle|est-ce)/i,
};

const EN_CONTRACTIONS = [
  [/\bim\b/gi, "I'm"],
  [/\bive\b/gi, "I've"],
  [/\bwhats\b/gi, "what's"],
  [/\bwheres\b/gi, "where's"],
  [/\bwhos\b/gi, "who's"],
  [/\bhows\b/gi, "how's"],
  [/\bdont\b/gi, "don't"],
  [/\bdoesnt\b/gi, "doesn't"],
  [/\bdidnt\b/gi, "didn't"],
  [/\bcant\b/gi, "can't"],
  [/\bwont\b/gi, "won't"],
  [/\byoure\b/gi, "you're"],
  [/\bthats\b/gi, "that's"],
];

function normalizeSpeechText(text, sourceLang) {
  let clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";

  const base = getBaseLang(sourceLang);
  const hasDevanagari = /[\u0900-\u097F]/.test(clean);

  if (base === "en" || (!hasDevanagari && base === "auto")) {
    for (const [pattern, replacement] of EN_CONTRACTIONS) {
      clean = clean.replace(pattern, replacement);
    }
  }

  if (!hasDevanagari) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  if (!/[.?!।]$/.test(clean)) {
    const qRegex = QUESTION_STARTERS[base];
    if (qRegex && qRegex.test(clean)) {
      clean += "?";
    }
  }
  return clean;
}

function resolveSourceParam(text, sourceLang) {
  const base = getBaseLang(sourceLang);
  if (base === "auto") return "auto";
  // If speaker selected Nepali/Hindi but Web Speech transcribed Latin/English words, use auto-detect
  if ((base === "ne" || base === "hi") && !/[\u0900-\u097F]/.test(text)) {
    return "auto";
  }
  return base;
}

// Multi-provider free translation engine:
// 1. Google Translate GTX -> 2. Lingva Translate (Google proxy) -> 3. MyMemory (filtered)
async function translateWithBestFreeAPI(text, sourceLang, targetLang, signal) {
  const raw = (text || "").trim();
  const tgt = getBaseLang(targetLang);
  if (!raw || tgt === "auto") return { text: raw, detectedLang: getBaseLang(sourceLang) };

  const src = resolveSourceParam(raw, sourceLang);
  if (src !== "auto" && src === tgt) {
    return { text: raw, detectedLang: src };
  }

  const prepared = normalizeSpeechText(raw, sourceLang);
  const cacheKey = `${src}:${tgt}:${prepared.toLowerCase()}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const saveCache = (result) => {
    if (translationCache.size > 1000) translationCache.clear();
    translationCache.set(cacheKey, result);
    return result;
  };

  // Provider 1: Google Translate public GTX endpoint (highest accuracy for EN/NE/HI/ES/FR)
  try {
    const googleUrl =
      `https://translate.googleapis.com/translate_a/single?client=gtx` +
      `&sl=${encodeURIComponent(src)}&tl=${encodeURIComponent(tgt)}` +
      `&dt=t&q=${encodeURIComponent(prepared)}`;

    const res = await fetch(googleUrl, { signal });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.[0])) {
        const translated = data[0]
          .map((seg) => (Array.isArray(seg) ? seg[0] : ""))
          .join("")
          .trim();
        const detectedLang = typeof data?.[2] === "string" ? data[2] : src;

        if (translated) {
          return saveCache({ text: translated, detectedLang, provider: "Google" });
        }
      }
    }
  } catch (err) {
    if (err?.name === "AbortError") throw err;
  }

  // Provider 2: Lingva Translate (free open-source Google Translate REST proxy, avoids direct 429s)
  for (const baseUrl of LINGVA_INSTANCES) {
    try {
      const lingvaUrl = `${baseUrl}/${encodeURIComponent(src)}/${encodeURIComponent(tgt)}/${encodeURIComponent(prepared)}`;
      const res = await fetch(lingvaUrl, { signal });
      if (res.ok) {
        const data = await res.json();
        const translated = (data?.translation || "").trim();
        if (translated) {
          return saveCache({ text: translated, detectedLang: src, provider: "Lingva" });
        }
      }
    } catch (err) {
      if (err?.name === "AbortError") throw err;
    }
  }

  // Provider 3: MyMemory free API (strictly filtered so warning text is never shown)
  try {
    const mmSrc = src === "auto" ? "en" : src;
    if (mmSrc !== tgt) {
      const myMemoryUrl =
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(prepared)}` +
        `&langpair=${encodeURIComponent(`${mmSrc}|${tgt}`)}`;

      const res = await fetch(myMemoryUrl, { signal });
      if (res.ok) {
        const data = await res.json();
        const translated = (data?.responseData?.translatedText || "").trim();
        const isWarning = /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(translated);
        if (data?.responseStatus === 200 && translated && !isWarning) {
          return saveCache({ text: translated, detectedLang: mmSrc, provider: "MyMemory" });
        }
      }
    }
  } catch (err) {
    if (err?.name === "AbortError") throw err;
  }

  return { text: raw, detectedLang: src, provider: "fallback" };
}

const getInitials = (name = "G") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || "G";

// --- Modern Glassmorphic Dark UI Styles ---
const MEETING_STYLES = `
  :root {
    --bg-canvas: #070b14;
    --bg-surface: rgba(17, 24, 39, 0.78);
    --bg-elevated: rgba(30, 41, 59, 0.72);
    --border-subtle: rgba(255, 255, 255, 0.09);
    --border-strong: rgba(255, 255, 255, 0.16);
    --primary: #6366f1;
    --primary-hover: #4f46e5;
    --danger: #ef4444;
    --danger-hover: #dc2626;
    --success: #10b981;
    --amber: #fbbf24;
    --text-main: #f8fafc;
    --text-muted: #94a3b8;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .page-wrapper {
    min-height: 100vh;
    height: 100vh;
    background:
      radial-gradient(circle at 12% 10%, rgba(99, 102, 241, 0.16), transparent 40%),
      radial-gradient(circle at 88% 85%, rgba(16, 185, 129, 0.12), transparent 42%),
      var(--bg-canvas);
    display: flex;
    flex-direction: column;
    color: var(--text-main);
    overflow: hidden;
  }

  /* --- Modern Pre-Join Lobby --- */
  .lobby-shell {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    overflow-y: auto;
  }
  .lobby-card {
    background: var(--bg-surface);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    padding: 2.5rem;
    border-radius: 24px;
    border: 1px solid var(--border-subtle);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
    width: 100%;
    max-width: 460px;
    text-align: center;
  }
  .lobby-brand {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.25rem;
    box-shadow: 0 10px 25px rgba(99, 102, 241, 0.35);
  }
  .lobby-title { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.4rem; }
  .lobby-sub { color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem; }
  .room-chip {
    display: inline-block;
    background: rgba(99, 102, 241, 0.16);
    color: #a5b4fc;
    border: 1px solid rgba(99, 102, 241, 0.35);
    padding: 2px 10px;
    border-radius: 999px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-weight: 700;
  }
  .lobby-status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 1.5rem;
    padding: 7px 14px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid var(--border-subtle);
    font-size: 0.82rem;
    font-weight: 600;
  }
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--amber);
  }
  .lobby-status.ok .status-dot { background: var(--success); box-shadow: 0 0 10px var(--success); }
  .lobby-status.ok { color: #6ee7b7; border-color: rgba(16, 185, 129, 0.3); }
  .lobby-status.warn { color: #fde68a; border-color: rgba(251, 191, 36, 0.3); }

  .lobby-toggles {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 1.5rem;
  }
  .lobby-toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 11px;
    border-radius: 12px;
    border: 1px solid var(--border-subtle);
    background: rgba(30, 41, 59, 0.55);
    color: var(--text-main);
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .lobby-toggle-btn:hover { background: rgba(51, 65, 85, 0.7); }
  .lobby-toggle-btn.off {
    background: rgba(239, 68, 68, 0.14);
    border-color: rgba(239, 68, 68, 0.4);
    color: #fca5a5;
  }

  .form-group { text-align: left; margin-bottom: 1.5rem; }
  .form-group label { display: block; margin-bottom: 8px; font-size: 0.9rem; font-weight: 600; color: var(--text-main); }
  .form-hint { display: block; font-size: 0.78rem; color: var(--text-muted); font-weight: 400; margin-top: 2px; }
  .lobby-select {
    width: 100%;
    padding: 13px 16px;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid var(--border-strong);
    border-radius: 12px;
    font-size: 0.98rem;
    color: var(--text-main);
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .lobby-select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25); }
  .btn-join {
    width: 100%;
    padding: 15px;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 10px 25px rgba(99, 102, 241, 0.35);
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }
  .btn-join:hover { transform: translateY(-1px); box-shadow: 0 14px 30px rgba(99, 102, 241, 0.45); }

  /* --- Top Bar --- */
  .meet-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1.5rem;
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border-subtle);
    z-index: 30;
    gap: 12px;
    flex-wrap: wrap;
  }
  .topbar-left { display: flex; align-items: center; gap: 14px; }
  .logo {
    display: flex;
    align-items: center;
    gap: 9px;
    text-decoration: none;
    color: var(--text-main);
    font-weight: 800;
    font-size: 1.05rem;
    letter-spacing: -0.02em;
  }
  .logo-badge {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }
  .room-code-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: rgba(255, 255, 255, 0.06);
    color: #e2e8f0;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 0.82rem;
    border: 1px solid var(--border-subtle);
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  .room-code-btn:hover { background: rgba(255, 255, 255, 0.12); }

  .lang-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid var(--border-strong);
    padding: 6px 12px;
    border-radius: 999px;
    color: #c7d2fe;
  }
  .lang-select-inline {
    background: transparent;
    color: #fff;
    border: none;
    font-weight: 700;
    font-size: 0.85rem;
    outline: none;
    cursor: pointer;
  }
  .lang-select-inline option { background: #0f172a; color: #fff; }
  .live-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.74rem;
    padding: 3px 9px;
    border-radius: 999px;
    font-weight: 700;
  }
  .live-badge.ok { background: rgba(16, 185, 129, 0.16); color: #6ee7b7; }
  .live-badge.warn { background: rgba(251, 191, 36, 0.16); color: #fde68a; }
  .participant-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.82rem;
    color: var(--text-muted);
    background: rgba(255, 255, 255, 0.05);
    padding: 6px 11px;
    border-radius: 999px;
    border: 1px solid var(--border-subtle);
    font-weight: 600;
  }

  /* --- Main Stage --- */
  .meet-body {
    flex: 1;
    display: flex;
    min-height: 0;
    position: relative;
  }
  .video-stage {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    position: relative;
  }
  .video-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 1rem;
    padding: 1.25rem 1.25rem 5.75rem;
    overflow-y: auto;
    align-content: center;
  }
  .video-grid.single-tile {
    max-width: 960px;
    width: 100%;
    margin: 0 auto;
  }
  .video-tile {
    position: relative;
    background: #0f172a;
    border-radius: 18px;
    overflow: hidden;
    aspect-ratio: 16 / 9;
    border: 1.5px solid var(--border-subtle);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
    contain: layout style paint;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .video-tile.speaking {
    border-color: rgba(99, 102, 241, 0.85);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3), 0 16px 36px rgba(0, 0, 0, 0.5);
  }
  .video-tile video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .video-tile.video-off video { opacity: 0; }
  .avatar-fallback {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: radial-gradient(circle at center, #1e293b 0%, #0f172a 75%);
  }
  .avatar-circle {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 800;
    color: #fff;
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
  }
  .v-label {
    position: absolute;
    top: 12px;
    left: 12px;
    background: rgba(2, 6, 23, 0.68);
    backdrop-filter: blur(8px);
    color: #f8fafc;
    padding: 5px 11px;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .v-muted {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(239, 68, 68, 0.9);
    color: #fff;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  }

  /* --- Modern Dual-Language Subtitle Card (Shows BOTH Spoken & Translated) --- */
  .dual-caption-wrap {
    position: absolute;
    bottom: 14px;
    left: 14px;
    right: 14px;
    display: flex;
    justify-content: center;
    pointer-events: none;
    z-index: 8;
  }
  .dual-caption-card {
    background: rgba(7, 11, 20, 0.86);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 14px;
    padding: 10px 14px;
    max-width: 96%;
    min-width: 240px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55);
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: left;
  }
  .caption-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    line-height: 1.38;
  }
  .caption-row.original {
    color: #cbd5e1;
    font-size: 0.88rem;
    font-weight: 500;
    padding-bottom: 5px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .caption-row.original.solo {
    border-bottom: none;
    padding-bottom: 0;
  }
  .caption-row.translated {
    color: #fde68a;
    font-size: 1.03rem;
    font-weight: 700;
  }
  .caption-row.translated.pending {
    color: #94a3b8;
    font-size: 0.86rem;
    font-style: italic;
    font-weight: 500;
  }
  .lang-tag {
    flex-shrink: 0;
    font-size: 0.66rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 7px;
    border-radius: 6px;
  }
  .lang-tag.src {
    background: rgba(148, 163, 184, 0.2);
    color: #e2e8f0;
  }
  .lang-tag.tgt {
    background: rgba(251, 191, 36, 0.2);
    color: #fcd34d;
  }

  /* --- Floating Bottom Control Dock --- */
  .meet-dock-wrap {
    position: absolute;
    bottom: 18px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    pointer-events: none;
    z-index: 25;
  }
  .meet-toolbar {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid var(--border-strong);
    border-radius: 999px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);
  }
  .tb-btn {
    width: 46px;
    height: 46px;
    background: rgba(51, 65, 85, 0.65);
    color: #f8fafc;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    transition: all 0.18s ease;
  }
  .tb-btn:hover { background: rgba(71, 85, 105, 0.9); transform: translateY(-2px); }
  .tb-btn.active-accent {
    background: rgba(99, 102, 241, 0.25);
    border-color: rgba(99, 102, 241, 0.6);
    color: #c7d2fe;
  }
  .tb-btn.off {
    background: rgba(239, 68, 68, 0.2);
    color: #fca5a5;
    border-color: rgba(239, 68, 68, 0.5);
  }
  .tb-btn.end {
    width: 56px;
    border-radius: 999px;
    background: var(--danger);
    border-color: transparent;
    color: #fff;
  }
  .tb-btn.end:hover { background: var(--danger-hover); }
  .unread-dot {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #fbbf24;
  }

  /* --- Tabbed Side Panel (Chat + Live Bilingual Transcript) --- */
  .side-panel {
    width: 370px;
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(20px);
    border-left: 1px solid var(--border-subtle);
    display: flex;
    flex-direction: column;
    transition: width 0.24s ease, opacity 0.2s ease;
    overflow: hidden;
    z-index: 20;
  }
  .side-panel.hidden { width: 0; opacity: 0; border-left: none; pointer-events: none; }
  .panel-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 10px;
    gap: 8px;
    border-bottom: 1px solid var(--border-subtle);
  }
  .panel-tab {
    padding: 9px 10px;
    border-radius: 10px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-muted);
    font-size: 0.86rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.18s;
  }
  .panel-tab.active {
    background: rgba(99, 102, 241, 0.18);
    border-color: rgba(99, 102, 241, 0.35);
    color: #e0e7ff;
  }
  .panel-list {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
  .empty-state {
    color: var(--text-muted);
    font-size: 0.86rem;
    text-align: center;
    margin-top: 2rem;
    line-height: 1.5;
  }
  .chat-bubble {
    background: rgba(30, 41, 59, 0.65);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    padding: 10px 13px;
    font-size: 0.92rem;
    line-height: 1.45;
  }
  .bubble-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    font-size: 0.78rem;
  }
  .bubble-name { font-weight: 700; color: #a5b4fc; }
  .bubble-time { color: var(--text-muted); font-size: 0.72rem; }

  .transcript-item {
    background: rgba(30, 41, 59, 0.55);
    border: 1px solid var(--border-subtle);
    border-radius: 14px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .transcript-orig {
    font-size: 0.84rem;
    color: #cbd5e1;
    display: flex;
    gap: 6px;
    align-items: baseline;
  }
  .transcript-trans {
    font-size: 0.94rem;
    color: #fde68a;
    font-weight: 600;
    display: flex;
    gap: 6px;
    align-items: baseline;
  }

  .chat-input-row {
    padding: 0.85rem;
    border-top: 1px solid var(--border-subtle);
    display: flex;
    gap: 8px;
    background: rgba(7, 11, 20, 0.6);
  }
  .chat-input-row input {
    flex: 1;
    padding: 11px 14px;
    border: 1px solid var(--border-strong);
    border-radius: 12px;
    background: rgba(30, 41, 59, 0.7);
    color: #fff;
    font-size: 0.9rem;
    outline: none;
  }
  .chat-input-row input:focus { border-color: var(--primary); }
  .chat-input-row button {
    padding: 0 18px;
    background: var(--primary);
    color: #fff;
    border: none;
    border-radius: 12px;
    font-weight: 700;
    font-size: 0.88rem;
    cursor: pointer;
  }
  .chat-input-row button:hover { background: var(--primary-hover); }

  @media (max-width: 900px) {
    .meet-body { flex-direction: column; }
    .video-grid { grid-template-columns: 1fr; padding: 0.85rem 0.85rem 5.5rem; }
    .side-panel { width: 100%; height: 42vh; border-left: none; border-top: 1px solid var(--border-subtle); }
    .side-panel.hidden { height: 0; width: 100%; }
    .meet-topbar { padding: 0.65rem 1rem; }
  }
`;

function Meeting() {
  const { roomCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // --- UI & Call State ---
  const [hasJoined, setHasJoined] = useState(false);
  const [serverStatus, setServerStatus] = useState("waking"); // waking | ready | connected
  const [peers, setPeers] = useState([]);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState("transcript"); // transcript | chat
  const [messages, setMessages] = useState([]);
  const [unreadChat, setUnreadChat] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // --- Translation & Dual-Subtitle State ---
  const [myLanguage, setMyLanguage] = useState("en-US");
  // { [socketId]: { original, translated, sourceLang, targetLang, isLive, isTranslating } | null }
  const [subtitles, setSubtitles] = useState({});
  const [transcriptHistory, setTranscriptHistory] = useState([]);
  const [myLiveCaption, setMyLiveCaption] = useState("");

  // --- Refs ---
  const socketRef = useRef(null);
  const userVideoRef = useRef(null);
  const streamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef([]);
  const recognitionRef = useRef(null);

  const myLanguageRef = useRef(myLanguage);
  const mutedRef = useRef(muted);
  const videoOffRef = useRef(videoOff);
  const panelOpenRef = useRef(panelOpen);
  const panelTabRef = useRef(panelTab);

  const lastInterimEmitRef = useRef(0);
  const lastInterimTextRef = useRef("");
  const lastFinalSentRef = useRef("");
  const latestSeqRef = useRef({});
  const finalAbortRef = useRef({});
  const interimPauseTimersRef = useRef({});
  const subtitleTimersRef = useRef({});
  const selfCaptionTimerRef = useRef(null);

  useEffect(() => { myLanguageRef.current = myLanguage; }, [myLanguage]);
  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { videoOffRef.current = videoOff; }, [videoOff]);
  useEffect(() => { panelOpenRef.current = panelOpen; }, [panelOpen]);
  useEffect(() => { panelTabRef.current = panelTab; }, [panelTab]);

  const userName = user?.fullName || "Guest";

  const updatePeerSubtitle = useCallback((socketId, payload) => {
    setSubtitles((prev) => ({
      ...prev,
      [socketId]: payload,
    }));

    if (subtitleTimersRef.current[socketId]) {
      clearTimeout(subtitleTimersRef.current[socketId]);
    }
    subtitleTimersRef.current[socketId] = setTimeout(() => {
      setSubtitles((prev) => ({ ...prev, [socketId]: null }));
    }, payload.isLive ? 5500 : 8500);
  }, []);

  const appendTranscript = useCallback((entry) => {
    setTranscriptHistory((prev) => {
      const next = [...prev, { id: `${Date.now()}-${Math.random()}`, time: Date.now(), ...entry }];
      return next.length > 80 ? next.slice(-80) : next;
    });
  }, []);

  // Translate incoming peer captions cleanly without spamming or aborting final sentences
  const handleIncomingSubtitle = useCallback(
    async (socketId, text, sourceLang, isInterim, senderName) => {
      const cleanText = (text || "").trim();
      if (!cleanText) return;

      const targetLang = myLanguageRef.current;
      const srcBase = resolveSourceParam(cleanText, sourceLang);
      const tgtBase = getBaseLang(targetLang);
      const speaker =
        senderName ||
        peersRef.current.find((p) => p.peerId === socketId)?.name ||
        "Participant";

      const seq = (latestSeqRef.current[socketId] || 0) + 1;
      latestSeqRef.current[socketId] = seq;

      if (interimPauseTimersRef.current[socketId]) {
        clearTimeout(interimPauseTimersRef.current[socketId]);
      }

      const sameLanguage = srcBase !== "auto" && srcBase === tgtBase;

      // 1. Same language -> show immediately without API call
      if (sameLanguage) {
        updatePeerSubtitle(socketId, {
          original: cleanText,
          translated: cleanText,
          sourceLang: sourceLang || targetLang,
          targetLang,
          isLive: isInterim,
          isTranslating: false,
        });
        if (!isInterim) {
          appendTranscript({
            speaker,
            original: cleanText,
            translated: cleanText,
            sourceLang: sourceLang || targetLang,
            targetLang,
          });
        }
        return;
      }

      // Helper to execute the free multi-provider translation
      const runTranslation = async (forInterim) => {
        // Cancel only previous in-flight request of the SAME speaker when a newer translation starts
        if (!forInterim && finalAbortRef.current[socketId]) {
          finalAbortRef.current[socketId].abort();
        }
        const controller = new AbortController();
        if (!forInterim) finalAbortRef.current[socketId] = controller;

        try {
          const result = await translateWithBestFreeAPI(
            cleanText,
            sourceLang,
            targetLang,
            controller.signal
          );

          // Prevent stale interim from overwriting newer captions
          if (forInterim && latestSeqRef.current[socketId] !== seq) return;

          const resolvedSource =
            sourceLang || (result.detectedLang && result.detectedLang !== "auto" ? result.detectedLang : "auto");

          updatePeerSubtitle(socketId, {
            original: cleanText,
            translated: result.text,
            sourceLang: resolvedSource,
            targetLang,
            isLive: forInterim,
            isTranslating: false,
          });

          if (!forInterim) {
            appendTranscript({
              speaker,
              original: cleanText,
              translated: result.text,
              sourceLang: resolvedSource,
              targetLang,
            });
          }
        } catch (err) {
          if (err?.name !== "AbortError") {
            updatePeerSubtitle(socketId, {
              original: cleanText,
              translated: cleanText,
              sourceLang: sourceLang || "auto",
              targetLang,
              isLive: forInterim,
              isTranslating: false,
            });
          }
        }
      };

      // 2. Interim caption: display original spoken text immediately (0ms),
      //    then translate only if the speaker pauses 700ms (prevents 429 rate limits & broken halves)
      if (isInterim) {
        setSubtitles((prev) => {
          const prevSub = prev[socketId];
          return {
            ...prev,
            [socketId]: {
              original: cleanText,
              translated: prevSub?.isLive ? prevSub.translated : "",
              sourceLang: sourceLang || "auto",
              targetLang,
              isLive: true,
              isTranslating: true,
            },
          };
        });

        interimPauseTimersRef.current[socketId] = setTimeout(() => {
          if (latestSeqRef.current[socketId] === seq) {
            runTranslation(true);
          }
        }, 700);
        return;
      }

      // 3. Finalized sentence: show original immediately + fetch accurate translation right away
      updatePeerSubtitle(socketId, {
        original: cleanText,
        translated: "",
        sourceLang: sourceLang || "auto",
        targetLang,
        isLive: false,
        isTranslating: true,
      });

      await runTranslation(false);
    },
    [appendTranscript, updatePeerSubtitle]
  );

  const handleIncomingRef = useRef(handleIncomingSubtitle);
  useEffect(() => {
    handleIncomingRef.current = handleIncomingSubtitle;
  }, [handleIncomingSubtitle]);

  // ==========================================
  // 0. Pre-warm Render Backend in Lobby
  // ==========================================
  useEffect(() => {
    let active = true;
    fetch(SOCKET_URL, { mode: "no-cors", cache: "no-store" })
      .then(() => { if (active) setServerStatus((s) => (s === "connected" ? s : "ready")); })
      .catch(() => { if (active) setServerStatus((s) => (s === "connected" ? s : "ready")); });
    return () => { active = false; };
  }, []);

  // ==========================================
  // 1. Speech Recognition
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
    recognition.maxAlternatives = 1;
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

      if (
        trimmedInterim &&
        trimmedInterim !== lastInterimTextRef.current &&
        now - lastInterimEmitRef.current >= 350
      ) {
        lastInterimEmitRef.current = now;
        lastInterimTextRef.current = trimmedInterim;
        setMyLiveCaption(trimmedInterim);

        socketRef.current.emit("send-interim-subtitle", {
          roomCode,
          text: trimmedInterim,
          sourceLang: myLanguage,
          name: userName,
        });
      }

      if (trimmedFinal && trimmedFinal !== lastFinalSentRef.current) {
        lastInterimTextRef.current = "";
        lastFinalSentRef.current = trimmedFinal;
        setMyLiveCaption(trimmedFinal);

        if (selfCaptionTimerRef.current) clearTimeout(selfCaptionTimerRef.current);
        selfCaptionTimerRef.current = setTimeout(() => setMyLiveCaption(""), 5000);

        socketRef.current.emit("send-subtitle", {
          roomCode,
          text: trimmedFinal,
          sourceLang: myLanguage,
          name: userName,
        });

        appendTranscript({
          speaker: `${userName} (You)`,
          original: trimmedFinal,
          translated: trimmedFinal,
          sourceLang: myLanguage,
          targetLang: myLanguage,
        });

        setTimeout(() => { lastFinalSentRef.current = ""; }, 1200);
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
            try { recognition.start(); } catch {}
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;
    if (!mutedRef.current) {
      try { recognition.start(); } catch {}
    }

    return () => {
      isStopping = true;
      if (restartTimer) clearTimeout(restartTimer);
      if (selfCaptionTimerRef.current) clearTimeout(selfCaptionTimerRef.current);
      try { recognition.stop(); } catch {}
      recognitionRef.current = null;
    };
  }, [hasJoined, myLanguage, roomCode, userName, appendTranscript]);

  useEffect(() => {
    const rec = recognitionRef.current;
    if (!rec || !hasJoined) return;
    if (muted) {
      setMyLiveCaption("");
      try { rec.stop(); } catch {}
    } else {
      try { rec.start(); } catch {}
    }
  }, [muted, hasJoined]);

  // ==========================================
  // 2. Core WebRTC & Socket Connection
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

        // Apply pre-join lobby mute/camera preferences immediately
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) audioTrack.enabled = !mutedRef.current;
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) videoTrack.enabled = !videoOffRef.current;

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
          if (mutedRef.current) socket.emit("toggle-mute", { roomCode, muted: true });
          if (videoOffRef.current) socket.emit("toggle-video", { roomCode, videoOff: true });
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

          if (finalAbortRef.current[socketId]) {
            finalAbortRef.current[socketId].abort();
            delete finalAbortRef.current[socketId];
          }
          if (interimPauseTimersRef.current[socketId]) {
            clearTimeout(interimPauseTimersRef.current[socketId]);
          }
          if (subtitleTimersRef.current[socketId]) {
            clearTimeout(subtitleTimersRef.current[socketId]);
          }
          setSubtitles((prev) => ({ ...prev, [socketId]: null }));
        });

        socket.on("chat-message", (msg) => {
          setMessages((prev) => [...prev, msg]);
          if (!panelOpenRef.current || panelTabRef.current !== "chat") {
            setUnreadChat(true);
          }
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

        socket.on("receive-interim-subtitle", ({ socketId, text, sourceLang, name }) => {
          handleIncomingRef.current(socketId, text, sourceLang, true, name);
        });

        socket.on("receive-subtitle", ({ socketId, text, sourceLang, name }) => {
          handleIncomingRef.current(socketId, text, sourceLang, false, name);
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
      Object.values(finalAbortRef.current).forEach((c) => c.abort());
      finalAbortRef.current = {};
      Object.values(interimPauseTimersRef.current).forEach(clearTimeout);
      Object.values(subtitleTimersRef.current).forEach(clearTimeout);
    };
  }, [hasJoined, roomCode, userName]);

  const toggleMute = () => {
    const stream = streamRef.current;
    const nextMuted = !muted;
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = !nextMuted;
    }
    setMuted(nextMuted);
    socketRef.current?.emit("toggle-mute", { roomCode, muted: nextMuted });
  };

  const toggleVideo = () => {
    const stream = streamRef.current;
    const nextVideoOff = !videoOff;
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = !nextVideoOff;
    }
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

  const handleOpenPanel = (tab) => {
    if (panelOpen && panelTab === tab) {
      setPanelOpen(false);
    } else {
      setPanelTab(tab);
      setPanelOpen(true);
      if (tab === "chat") setUnreadChat(false);
    }
  };

  const handleSendMessage = useCallback(
    (text) => {
      if (!text.trim()) return;
      socketRef.current?.emit("chat-message", { roomCode, message: text, name: userName });
    },
    [roomCode, userName]
  );

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

  // ==========================================
  // PRE-JOIN LOBBY UI
  // ==========================================
  if (!hasJoined) {
    return (
      <div className="page-wrapper">
        <style>{MEETING_STYLES}</style>
        <div className="lobby-shell">
          <div className="lobby-card">
            <div className="lobby-brand">
              <CamOnIcon />
            </div>
            <h1 className="lobby-title">Join Chalfal Meeting</h1>
            <p className="lobby-sub">
              Room <span className="room-chip">{roomCode}</span>
            </p>

            <div className={`lobby-status ${serverStatus === "waking" ? "warn" : "ok"}`}>
              <span className="status-dot" />
              {serverStatus === "waking"
                ? "Waking server..."
                : "Server ready • Dual-language captions active"}
            </div>

            <div className="lobby-toggles">
              <button
                type="button"
                className={`lobby-toggle-btn${muted ? " off" : ""}`}
                onClick={() => setMuted((m) => !m)}
              >
                {muted ? <MicOffIcon /> : <MicOnIcon />}
                {muted ? "Mic Off" : "Mic On"}
              </button>
              <button
                type="button"
                className={`lobby-toggle-btn${videoOff ? " off" : ""}`}
                onClick={() => setVideoOff((v) => !v)}
              >
                {videoOff ? <CamOffIcon /> : <CamOnIcon />}
                {videoOff ? "Cam Off" : "Cam On"}
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setHasJoined(true); }}>
              <div className="form-group">
                <label>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
                    <TranslateIcon /> Your Language
                  </span>
                  <span className="form-hint">
                    You will see both what others speak and its live translation in your language.
                  </span>
                </label>
                <select
                  className="lobby-select"
                  required
                  value={myLanguage}
                  onChange={(e) => setMyLanguage(e.target.value)}
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.short})
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn-join">
                Enter Meeting Room
              </button>
            </form>

            <div style={{ marginTop: "18px" }}>
              <Link
                to="/dashboard"
                style={{ color: "var(--text-muted)", fontSize: "0.86rem", textDecoration: "none" }}
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ACTIVE MEETING UI
  // ==========================================
  return (
    <div className="page-wrapper">
      <style>{MEETING_STYLES}</style>

      <header className="meet-topbar">
        <div className="topbar-left">
          <Link to="/dashboard" className="logo">
            <span className="logo-badge">
              <CamOnIcon />
            </span>
            Chalfal
          </Link>
          <button className="room-code-btn" onClick={handleCopyRoom} title="Copy room code">
            <CopyIcon />
            {copiedCode ? "Copied!" : <span style={{ fontFamily: "monospace" }}>{roomCode}</span>}
          </button>
        </div>

        <div className="lang-pill">
          <TranslateIcon />
          <select
            className="lang-select-inline"
            value={myLanguage}
            onChange={(e) => setMyLanguage(e.target.value)}
            aria-label="Your meeting language"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
          <span className={`live-badge ${serverStatus === "connected" ? "ok" : "warn"}`}>
            <span className="status-dot" style={{ width: 6, height: 6 }} />
            {serverStatus === "connected" ? "Live Translate" : "Connecting"}
          </span>
        </div>

        <div className="participant-pill" title="Participants in room">
          <UsersIcon />
          {peers.length + 1}
        </div>
      </header>

      <main className="meet-body">
        <section className="video-stage">
          <div className={`video-grid${peers.length === 0 ? " single-tile" : ""}`}>
            {/* Self Video Tile */}
            <div
              className={`video-tile${videoOff && !screenSharing ? " video-off" : ""}${
                myLiveCaption && !muted ? " speaking" : ""
              }`}
            >
              <video ref={userVideoRef} autoPlay playsInline muted />
              {videoOff && !screenSharing && (
                <div className="avatar-fallback">
                  <div className="avatar-circle">{getInitials(userName)}</div>
                </div>
              )}
              <span className="v-label">
                {userName} (You) • {getLangName(myLanguage)}
              </span>
              {muted && (
                <span className="v-muted" title="Muted">
                  <MicOffIcon />
                </span>
              )}

              {captionsEnabled && myLiveCaption && !muted && (
                <div className="dual-caption-wrap">
                  <div className="dual-caption-card">
                    <div className="caption-row original solo">
                      <span className="lang-tag src">{getLangName(myLanguage)}</span>
                      <span>{myLiveCaption}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Remote Peer Video Tiles */}
            {peers.map((p) => (
              <PeerVideo
                key={p.peerId}
                peer={p.peer}
                stream={p.stream}
                name={p.name}
                muted={p.muted}
                videoOff={p.videoOff}
                subtitle={captionsEnabled ? subtitles[p.peerId] : null}
              />
            ))}
          </div>

          {/* Floating Control Dock */}
          <div className="meet-dock-wrap">
            <div className="meet-toolbar">
              <button
                className={`tb-btn${muted ? " off" : ""}`}
                onClick={toggleMute}
                title={muted ? "Unmute microphone" : "Mute microphone"}
              >
                {muted ? <MicOffIcon /> : <MicOnIcon />}
              </button>
              <button
                className={`tb-btn${videoOff ? " off" : ""}`}
                onClick={toggleVideo}
                title={videoOff ? "Turn camera on" : "Turn camera off"}
              >
                {videoOff ? <CamOffIcon /> : <CamOnIcon />}
              </button>
              <button
                className={`tb-btn${screenSharing ? " active-accent" : ""}`}
                onClick={toggleScreenShare}
                title={screenSharing ? "Stop sharing screen" : "Share screen"}
              >
                <ScreenIcon />
              </button>
              <button
                className={`tb-btn${captionsEnabled ? " active-accent" : ""}`}
                onClick={() => setCaptionsEnabled((c) => !c)}
                title={captionsEnabled ? "Hide live captions" : "Show live captions"}
              >
                <CaptionsIcon />
              </button>
              <button
                className={`tb-btn${panelOpen && panelTab === "transcript" ? " active-accent" : ""}`}
                onClick={() => handleOpenPanel("transcript")}
                title="Live bilingual transcript"
              >
                <TranslateIcon />
              </button>
              <button
                className={`tb-btn${panelOpen && panelTab === "chat" ? " active-accent" : ""}`}
                onClick={() => handleOpenPanel("chat")}
                title="In-call chat"
              >
                <ChatIcon />
                {unreadChat && <span className="unread-dot" />}
              </button>
              <button className="tb-btn end" onClick={handleEndCall} title="Leave call">
                <EndIcon />
              </button>
            </div>
          </div>
        </section>

        <SidePanel
          open={panelOpen}
          activeTab={panelTab}
          onChangeTab={(tab) => {
            setPanelTab(tab);
            if (tab === "chat") setUnreadChat(false);
          }}
          messages={messages}
          transcriptHistory={transcriptHistory}
          onSendMessage={handleSendMessage}
        />
      </main>
    </div>
  );
}

const PeerVideo = memo(function PeerVideo({ peer, stream, name, muted, videoOff, subtitle }) {
  const ref = useRef(null);

  useEffect(() => {
    const activeRemoteStream = stream || peer?._remoteStreams?.[0];
    if (ref.current && activeRemoteStream && ref.current.srcObject !== activeRemoteStream) {
      ref.current.srcObject = activeRemoteStream;
      ref.current.play().catch(() => {});
    }
  }, [peer, stream]);

  const showTranslationRow =
    subtitle &&
    (subtitle.isTranslating ||
      (subtitle.translated &&
        getBaseLang(subtitle.sourceLang) !== getBaseLang(subtitle.targetLang)));

  return (
    <div className={`video-tile${videoOff ? " video-off" : ""}${subtitle ? " speaking" : ""}`}>
      <video ref={ref} autoPlay playsInline />
      {videoOff && (
        <div className="avatar-fallback">
          <div className="avatar-circle">{getInitials(name)}</div>
        </div>
      )}
      <span className="v-label">{name}</span>
      {muted && (
        <span className="v-muted" title="Muted">
          <MicOffIcon />
        </span>
      )}

      {subtitle?.original && (
        <div className="dual-caption-wrap">
          <div className="dual-caption-card">
            {/* Row 1: Original Spoken Language */}
            <div className={`caption-row original${showTranslationRow ? "" : " solo"}`}>
              <span className="lang-tag src">{getLangName(subtitle.sourceLang)}</span>
              <span>{subtitle.original}</span>
            </div>

            {/* Row 2: Translated Text in Listener's Language */}
            {showTranslationRow && (
              <div
                className={`caption-row translated${
                  subtitle.isTranslating && !subtitle.translated ? " pending" : ""
                }`}
              >
                <span className="lang-tag tgt">{getLangName(subtitle.targetLang)}</span>
                <span>
                  {subtitle.translated || "Translating..."}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

const SidePanel = memo(function SidePanel({
  open,
  activeTab,
  onChangeTab,
  messages,
  transcriptHistory,
  onSendMessage,
}) {
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, transcriptHistory, open, activeTab]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <aside className={`side-panel${open ? "" : " hidden"}`}>
      <div className="panel-tabs">
        <button
          type="button"
          className={`panel-tab${activeTab === "transcript" ? " active" : ""}`}
          onClick={() => onChangeTab("transcript")}
        >
          Transcript ({transcriptHistory.length})
        </button>
        <button
          type="button"
          className={`panel-tab${activeTab === "chat" ? " active" : ""}`}
          onClick={() => onChangeTab("chat")}
        >
          Chat ({messages.length})
        </button>
      </div>

      {activeTab === "transcript" ? (
        <div className="panel-list">
          {transcriptHistory.length === 0 && (
            <div className="empty-state">
              Spoken sentences and their translations will appear here in real time.
            </div>
          )}
          {transcriptHistory.map((item) => {
            const isTranslated =
              item.translated &&
              item.translated !== item.original &&
              getBaseLang(item.sourceLang) !== getBaseLang(item.targetLang);

            return (
              <div className="transcript-item" key={item.id}>
                <div className="bubble-meta">
                  <span className="bubble-name">{item.speaker}</span>
                  <span className="bubble-time">
                    {new Date(item.time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="transcript-orig">
                  <span className="lang-tag src">{getLangName(item.sourceLang)}</span>
                  <span>{item.original}</span>
                </div>
                {isTranslated && (
                  <div className="transcript-trans">
                    <span className="lang-tag tgt">{getLangName(item.targetLang)}</span>
                    <span>{item.translated}</span>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      ) : (
        <>
          <div className="panel-list">
            {messages.length === 0 && (
              <div className="empty-state">No messages yet. Say hello to the room.</div>
            )}
            {messages.map((m, i) => (
              <div className="chat-bubble" key={i}>
                <div className="bubble-meta">
                  <span className="bubble-name">{m.name}</span>
                  <span className="bubble-time">
                    {new Date(m.time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div>{m.message}</div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form className="chat-input-row" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Send a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit">Send</button>
          </form>
        </>
      )}
    </aside>
  );
});

export default Meeting;