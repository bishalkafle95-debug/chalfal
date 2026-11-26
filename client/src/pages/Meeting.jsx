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

// --- Icons ---
const MicOnIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);
const MicOffIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);
const CamOnIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);
const CamOffIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const ScreenIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);
const ChatIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const CaptionsIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M7 15h4M15 15h2M7 11h2M13 11h4" />
  </svg>
);
const EndIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

// ==========================================
// Robust Free Translation Engine (Chunked + Timeout + Multi-Provider)
// ==========================================
const translationCache = new Map();
const providerCooldown = new Map(); // Temporarily skip failed/rate-limited providers

const getBaseLang = (code) => {
  if (!code || typeof code !== "string") return "auto";
  return code.toLowerCase().split("-")[0];
};

const getLangName = (code) => {
  const base = getBaseLang(code);
  const match = SUPPORTED_LANGUAGES.find((l) => getBaseLang(l.code) === base);
  return match ? match.name : base === "auto" ? "Auto" : base.toUpperCase();
};

const getInitials = (name = "G") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || "G";

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
  // If user selected Nepali/Hindi but Web Speech transcribed English/Latin words, auto-detect
  if ((base === "ne" || base === "hi") && !/[\u0900-\u097F]/.test(text)) {
    return "auto";
  }
  return base;
}

// Splits long speech into natural chunks <= 150 chars so URL-based free APIs NEVER fail on long sentences
function splitIntoChunks(text, maxChars = 150) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return [clean];

  const chunks = [];
  // First split on sentence punctuation while keeping punctuation attached
  const sentences = clean.split(/(?<=[.?!।])\s+/);

  for (const sentence of sentences) {
    if (sentence.length <= maxChars) {
      chunks.push(sentence);
      continue;
    }

    // Split long unpunctuated speech on clauses or words
    const words = sentence.split(/\s+/);
    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length <= maxChars) {
        current = candidate;
      } else {
        if (current) chunks.push(current);
        current = word.length > maxChars ? word.slice(0, maxChars) : word;
      }
    }
    if (current) chunks.push(current);
  }

  return chunks.filter(Boolean);
}

// Fetch with hard timeout + optional external AbortSignal so a slow provider never stalls translation
async function fetchWithTimeout(url, externalSignal, timeoutMs = 4500) {
  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", onExternalAbort, { once: true });
    }
  }

  const timer = setTimeout(() => controller.abort("timeout"), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", onExternalAbort);
    }
  }
}

const isProviderCoolingDown = (name) => (providerCooldown.get(name) || 0) > Date.now();
const markProviderCooldown = (name, ms = 45000) => providerCooldown.set(name, Date.now() + ms);

async function translateSingleChunk(chunk, src, tgt, signal) {
  const cacheKey = `${src}:${tgt}:${chunk.toLowerCase()}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const saveCache = (result) => {
    if (translationCache.size > 1200) translationCache.clear();
    translationCache.set(cacheKey, result);
    return result;
  };

  // Provider 1: Google Translate GTX (Primary - Best accuracy for EN/NE/HI/ES/FR)
  if (!isProviderCoolingDown("gtx")) {
    try {
      const url =
        `https://translate.googleapis.com/translate_a/single?client=gtx` +
        `&sl=${encodeURIComponent(src)}&tl=${encodeURIComponent(tgt)}` +
        `&dt=t&q=${encodeURIComponent(chunk)}`;

      const res = await fetchWithTimeout(url, signal, 4500);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.[0])) {
          const translated = data[0]
            .map((seg) => (Array.isArray(seg) ? seg[0] : ""))
            .join("")
            .trim();
          const detectedLang = typeof data?.[2] === "string" ? data[2] : src;
          if (translated) return saveCache({ text: translated, detectedLang });
        }
      } else if (res.status === 429) {
        markProviderCooldown("gtx", 30000);
      }
    } catch (err) {
      if (signal?.aborted) throw err;
    }
  }

  // Provider 2: Google Chrome Extension endpoint (Same Google NMT quality, separate rate-limit pool)
  if (!isProviderCoolingDown("clients5")) {
    try {
      const url =
        `https://clients5.google.com/translate_a/t?client=dict-chrome-ex` +
        `&sl=${encodeURIComponent(src)}&tl=${encodeURIComponent(tgt)}` +
        `&q=${encodeURIComponent(chunk)}`;

      const res = await fetchWithTimeout(url, signal, 4500);
      if (res.ok) {
        const data = await res.json();
        let translated = "";
        let detectedLang = src;

        if (Array.isArray(data)) {
          if (typeof data[0] === "string") {
            translated = data[0].trim();
          } else if (Array.isArray(data[0]) && typeof data[0][0] === "string") {
            translated = data[0][0].trim();
            if (typeof data[0][1] === "string") detectedLang = data[0][1];
          }
        }
        if (translated) return saveCache({ text: translated, detectedLang });
      } else if (res.status === 429) {
        markProviderCooldown("clients5", 30000);
      }
    } catch (err) {
      if (signal?.aborted) throw err;
    }
  }

  // Provider 3: Lingva Translate (Open-source Google Translate proxy; sanitize slashes for URL path)
  const lingvaHosts = ["https://lingva.ml/api/v1", "https://lingva.lunar.icu/api/v1"];
  for (const host of lingvaHosts) {
    if (isProviderCoolingDown(host)) continue;
    try {
      const pathSafe = chunk.replace(/\//g, " ");
      const url = `${host}/${encodeURIComponent(src)}/${encodeURIComponent(tgt)}/${encodeURIComponent(pathSafe)}`;
      const res = await fetchWithTimeout(url, signal, 4000);
      if (res.ok) {
        const data = await res.json();
        const translated = (data?.translation || "").trim();
        if (translated) return saveCache({ text: translated, detectedLang: src });
      } else {
        markProviderCooldown(host, 60000);
      }
    } catch (err) {
      if (signal?.aborted) throw err;
      markProviderCooldown(host, 60000);
    }
  }

  // Provider 4: MyMemory (Filtered so warning text never appears)
  if (!isProviderCoolingDown("mymemory")) {
    try {
      const mmSrc = src === "auto" ? "en" : src;
      if (mmSrc !== tgt) {
        const url =
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}` +
          `&langpair=${encodeURIComponent(`${mmSrc}|${tgt}`)}`;
        const res = await fetchWithTimeout(url, signal, 4500);
        if (res.ok) {
          const data = await res.json();
          const translated = (data?.responseData?.translatedText || "").trim();
          const isWarning = /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(translated);
          if (data?.responseStatus === 200 && translated && !isWarning) {
            return saveCache({ text: translated, detectedLang: mmSrc });
          }
        } else if (res.status === 429) {
          markProviderCooldown("mymemory", 60000);
        }
      }
    } catch (err) {
      if (signal?.aborted) throw err;
    }
  }

  return { text: chunk, detectedLang: src };
}

async function translateFullText(text, sourceLang, targetLang, signal) {
  const raw = (text || "").trim();
  const tgt = getBaseLang(targetLang);
  if (!raw || tgt === "auto") return { text: raw, detectedLang: getBaseLang(sourceLang) };

  const src = resolveSourceParam(raw, sourceLang);
  if (src !== "auto" && src === tgt) {
    return { text: raw, detectedLang: src };
  }

  const prepared = normalizeSpeechText(raw, sourceLang);
  const fullCacheKey = `FULL:${src}:${tgt}:${prepared.toLowerCase()}`;
  if (translationCache.has(fullCacheKey)) {
    return translationCache.get(fullCacheKey);
  }

  // Chunk long sentences cleanly and translate chunks in parallel
  const chunks = splitIntoChunks(prepared, 150);
  const translatedChunks = await Promise.all(
    chunks.map((c) => translateSingleChunk(c, src, tgt, signal))
  );

  const combinedText = translatedChunks.map((r) => r.text).join(" ").replace(/\s+/g, " ").trim();
  const detectedLang = translatedChunks[0]?.detectedLang || src;
  const finalResult = { text: combinedText || raw, detectedLang };

  if (translationCache.size > 1200) translationCache.clear();
  translationCache.set(fullCacheKey, finalResult);
  return finalResult;
}

// ==========================================
// Original Chalfal Theme Colors — Modernized Layout
// ==========================================
const MEETING_STYLES = `
  :root {
    --bg-light: #0b192c;
    --surface: #1a1a1a;
    --surface-dark: #111;
    --border: #333;
    --border-soft: rgba(255, 255, 255, 0.1);
    --accent: #e63946;
    --accent-hover: #c1121f;
    --accent-light: rgba(230, 57, 70, 0.2);
    --amber: #ffb703;
    --green: #2ecc71;
    --text-main: #fff;
    --text-muted: #bbb;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }

  .page-wrapper {
    min-height: 100vh;
    height: 100vh;
    background-color: var(--bg-light);
    background-image: radial-gradient(circle at top right, rgba(230, 57, 70, 0.08), transparent 40%);
    display: flex;
    flex-direction: column;
    color: var(--text-main);
    overflow: hidden;
  }

  /* --- Pre-Join Lobby --- */
  .lobby-shell {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    overflow-y: auto;
  }
  .lobby-card {
    background: var(--surface);
    padding: 2.75rem 2.5rem;
    border-radius: 18px;
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.55);
    border: 1px solid var(--border);
    width: 100%;
    max-width: 470px;
    text-align: center;
  }
  .lobby-logo {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: var(--accent-light);
    border: 1px solid rgba(230, 57, 70, 0.35);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    margin-bottom: 1rem;
  }
  .lobby-title { font-size: 1.9rem; color: #fff; margin-bottom: 0.45rem; font-weight: 800; }
  .lobby-sub { color: var(--text-muted); font-size: 0.98rem; margin-bottom: 1.35rem; }
  .lobby-status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 1.4rem;
    padding: 7px 14px;
    border-radius: 999px;
    background: var(--surface-dark);
    border: 1px solid var(--border);
    font-size: 0.83rem;
    font-weight: 600;
  }
  .lobby-status.ok { border-color: rgba(46, 204, 113, 0.4); color: var(--green); }
  .lobby-status.warn { border-color: rgba(255, 183, 3, 0.4); color: var(--amber); }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }

  .lobby-toggles {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 1.4rem;
  }
  .lobby-toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 11px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--bg-light);
    color: #fff;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .lobby-toggle-btn:hover { border-color: #555; }
  .lobby-toggle-btn.off {
    background: var(--accent-light);
    border-color: var(--accent);
    color: var(--accent);
  }

  .form-group { text-align: left; margin-bottom: 1.65rem; }
  .form-group label { display: block; margin-bottom: 8px; color: #fff; font-size: 0.95rem; font-weight: 600; }
  .form-hint { display: block; font-size: 0.8rem; color: var(--text-muted); font-weight: 400; margin-top: 3px; }
  .lobby-select {
    width: 100%;
    padding: 13px 16px;
    background: var(--bg-light);
    border: 2px solid var(--border);
    border-radius: 10px;
    font-size: 1rem;
    color: #fff;
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s;
  }
  .lobby-select:focus { border-color: var(--accent); }
  .btn-join {
    width: 100%;
    padding: 15px;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 1.05rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s, transform 0.18s;
  }
  .btn-join:hover { background: var(--accent-hover); transform: translateY(-1px); }

  /* --- Topbar --- */
  .meet-topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.7rem 1.5rem;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    z-index: 30;
    flex-wrap: wrap;
    gap: 10px;
  }
  .topbar-left { display: flex; align-items: center; gap: 14px; }
  .logo {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    color: #fff;
    font-weight: 800;
    font-size: 1.1rem;
  }
  .logo-icon { color: var(--accent); display: flex; }

  .lang-control {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #262626;
    border: 1px solid var(--border);
    padding: 5px 12px;
    border-radius: 999px;
  }
  .lang-select-inline {
    background: transparent;
    color: #fff;
    border: none;
    font-weight: 700;
    font-size: 0.86rem;
    outline: none;
    cursor: pointer;
  }
  .lang-select-inline option { background: #1a1a1a; color: #fff; }
  .live-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    padding: 3px 9px;
    border-radius: 999px;
    font-weight: 700;
  }
  .live-pill.ok { background: rgba(46, 204, 113, 0.2); color: var(--green); }
  .live-pill.warn { background: rgba(255, 183, 3, 0.2); color: var(--amber); }

  .room-code {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--accent-light);
    color: var(--accent);
    padding: 6px 13px;
    border-radius: 999px;
    font-size: 0.86rem;
    border: 1px solid rgba(230, 57, 70, 0.35);
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
  }
  .room-code:hover { background: rgba(230, 57, 70, 0.3); }

  /* --- Main Video Area --- */
  .meet-body { flex: 1; display: flex; min-height: 0; position: relative; }
  .video-stage { flex: 1; display: flex; flex-direction: column; min-width: 0; position: relative; background: #000; }
  .video-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 1rem;
    padding: 1rem 1rem 5.5rem;
    overflow-y: auto;
    align-content: center;
  }
  .video-grid.single-tile { max-width: 960px; width: 100%; margin: 0 auto; }

  .video-tile {
    position: relative;
    background: var(--surface);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55);
    aspect-ratio: 16 / 9;
    border: 2px solid var(--border);
    contain: layout style paint;
    transition: border-color 0.2s ease;
  }
  .video-tile.speaking {
    border-color: var(--amber);
    box-shadow: 0 0 0 1px rgba(255, 183, 3, 0.4), 0 10px 28px rgba(0, 0, 0, 0.6);
  }
  .video-tile video { width: 100%; height: 100%; object-fit: cover; display: block; }
  .video-tile.video-off { background: linear-gradient(135deg, #1b263b, #0b192c); }
  .video-tile.video-off video { opacity: 0; }

  .avatar-fallback {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .avatar-circle {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    font-size: 1.5rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 20px rgba(230, 57, 70, 0.35);
  }

  .v-label {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.72);
    backdrop-filter: blur(6px);
    color: #fff;
    padding: 4px 11px;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 600;
    border: 1px solid rgba(255, 255, 255, 0.12);
  }
  .v-muted {
    position: absolute;
    top: 10px;
    right: 10px;
    background: var(--accent);
    color: #fff;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #fff;
  }

  /* --- Dual-Language Subtitle Box (Shows BOTH Spoken & Translated) --- */
  .dual-caption-wrap {
    position: absolute;
    bottom: 12px;
    left: 12px;
    right: 12px;
    display: flex;
    justify-content: center;
    pointer-events: none;
    z-index: 8;
  }
  .dual-caption-card {
    background: rgba(11, 25, 44, 0.9);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 183, 3, 0.35);
    border-radius: 12px;
    padding: 9px 14px;
    max-width: 96%;
    min-width: 240px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.65);
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
    word-break: break-word;
  }
  .caption-row.original {
    color: #e5e5e5;
    font-size: 0.88rem;
    font-weight: 500;
    padding-bottom: 5px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }
  .caption-row.original.solo { border-bottom: none; padding-bottom: 0; }
  .caption-row.translated {
    color: var(--amber);
    font-size: 1.05rem;
    font-weight: 800;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  }
  .caption-row.translated.pending {
    color: var(--text-muted);
    font-size: 0.86rem;
    font-style: italic;
    font-weight: 500;
    text-shadow: none;
  }
  .lang-tag {
    flex-shrink: 0;
    font-size: 0.66rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 2px 7px;
    border-radius: 5px;
  }
  .lang-tag.src { background: rgba(255, 255, 255, 0.14); color: #fff; }
  .lang-tag.tgt { background: rgba(255, 183, 3, 0.22); color: var(--amber); }

  /* --- Floating Toolbar Dock --- */
  .meet-dock-wrap {
    position: absolute;
    bottom: 16px;
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
    justify-content: center;
    align-items: center;
    gap: 12px;
    padding: 9px 18px;
    background: rgba(26, 26, 26, 0.92);
    backdrop-filter: blur(12px);
    border: 1px solid var(--border);
    border-radius: 999px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
  }
  .tb-btn {
    width: 48px;
    height: 48px;
    background: #333;
    color: #fff;
    border: 2px solid transparent;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease;
  }
  .tb-btn:hover { background: #444; transform: translateY(-2px); }
  .tb-btn.active-amber {
    background: rgba(255, 183, 3, 0.18);
    color: var(--amber);
    border-color: rgba(255, 183, 3, 0.6);
  }
  .tb-btn.off {
    background: var(--accent-light);
    color: var(--accent);
    border-color: var(--accent);
  }
  .tb-btn.end {
    width: 56px;
    border-radius: 999px;
    background: var(--accent);
    color: #fff;
  }
  .tb-btn.end:hover { background: var(--accent-hover); }
  .unread-dot {
    position: absolute;
    top: 7px;
    right: 7px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--amber);
  }

  /* --- Side Panel (Transcript & Chat) --- */
  .side-panel {
    width: 370px;
    background: var(--surface-dark);
    border-left: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    transition: width 0.25s ease, opacity 0.2s ease;
    overflow: hidden;
    z-index: 20;
  }
  .side-panel.hidden { width: 0; opacity: 0; border-left: none; pointer-events: none; }
  .panel-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 10px;
    gap: 8px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .panel-tab {
    padding: 9px 10px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-muted);
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }
  .panel-tab.active {
    background: var(--accent-light);
    border-color: rgba(230, 57, 70, 0.45);
    color: #fff;
  }
  .panel-list {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    background: var(--surface);
  }
  .empty-state {
    color: #888;
    font-size: 0.86rem;
    text-align: center;
    margin-top: 2rem;
    line-height: 1.5;
  }
  .chat-card, .transcript-card {
    background: var(--surface-dark);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 12px;
  }
  .card-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
    font-size: 0.8rem;
  }
  .cm-name { font-weight: 700; color: var(--amber); }
  .cm-time { color: #888; font-size: 0.74rem; }
  .chat-body { color: #fff; font-size: 0.92rem; line-height: 1.45; }

  .transcript-orig {
    color: #ddd;
    font-size: 0.86rem;
    display: flex;
    gap: 6px;
    align-items: baseline;
    line-height: 1.4;
    margin-bottom: 5px;
  }
  .transcript-trans {
    color: var(--amber);
    font-size: 0.95rem;
    font-weight: 700;
    display: flex;
    gap: 6px;
    align-items: baseline;
    line-height: 1.4;
  }

  .chat-input-row {
    padding: 0.9rem;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 8px;
    background: var(--surface-dark);
  }
  .chat-input-row input {
    flex: 1;
    padding: 11px 14px;
    border: 1px solid #444;
    border-radius: 8px;
    background: #222;
    color: #fff;
    outline: none;
  }
  .chat-input-row input:focus { border-color: var(--accent); }
  .chat-input-row button {
    padding: 0 18px;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
  }
  .chat-input-row button:hover { background: var(--accent-hover); }

  @media (max-width: 900px) {
    .meet-body { flex-direction: column; }
    .video-grid { grid-template-columns: 1fr; padding: 0.85rem 0.85rem 5.4rem; }
    .side-panel { width: 100%; height: 40vh; border-left: none; border-top: 1px solid var(--border); }
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
  const [micState, setMicState] = useState("idle"); // idle | listening | restarting | unsupported
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

  // --- Dual-Language Subtitles & Transcript State ---
  const [myLanguage, setMyLanguage] = useState("en-US");
  const [subtitles, setSubtitles] = useState({});
  const [transcriptHistory, setTranscriptHistory] = useState([]);
  const [myLiveCaption, setMyLiveCaption] = useState("");

  // --- Refs ---
  const socketRef = useRef(null);
  const userVideoRef = useRef(null);
  const streamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef([]);

  const myLanguageRef = useRef(myLanguage);
  const mutedRef = useRef(muted);
  const videoOffRef = useRef(videoOff);
  const panelOpenRef = useRef(panelOpen);
  const panelTabRef = useRef(panelTab);

  // Per-speaker translation coordination (interim never aborts final sentences!)
  const latestFinalSeqRef = useRef({});
  const latestInterimSeqRef = useRef({});
  const interimAbortRef = useRef({});
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
    }, payload.isLive ? 6000 : 9000);
  }, []);

  const appendTranscript = useCallback((entry) => {
    setTranscriptHistory((prev) => {
      // Avoid accidental duplicate adjacent transcript entries
      const last = prev[prev.length - 1];
      if (
        last &&
        last.speaker === entry.speaker &&
        last.original.toLowerCase() === entry.original.toLowerCase() &&
        Date.now() - last.time < 3000
      ) {
        return prev;
      }
      const next = [...prev, { id: `${Date.now()}-${Math.random()}`, time: Date.now(), ...entry }];
      return next.length > 100 ? next.slice(-100) : next;
    });
  }, []);

  // ==========================================
  // Incoming Subtitle Translator (Never Drops Long or Follow-Up Sentences)
  // ==========================================
  const handleIncomingSubtitle = useCallback(
    async (socketId, text, sourceLang, isInterim, senderName) => {
      const cleanText = (text || "").replace(/\s+/g, " ").trim();
      if (!cleanText) return;

      const targetLang = myLanguageRef.current;
      const srcBase = resolveSourceParam(cleanText, sourceLang);
      const tgtBase = getBaseLang(targetLang);
      const speaker =
        senderName ||
        peersRef.current.find((p) => p.peerId === socketId)?.name ||
        "Participant";

      const sameLanguage = srcBase !== "auto" && srcBase === tgtBase;

      // 1. Same language: instant display, zero API calls
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

      // 2. Interim caption: display original text immediately, translate after 800ms pause
      if (isInterim) {
        const interimSeq = (latestInterimSeqRef.current[socketId] || 0) + 1;
        latestInterimSeqRef.current[socketId] = interimSeq;

        if (interimPauseTimersRef.current[socketId]) {
          clearTimeout(interimPauseTimersRef.current[socketId]);
        }

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

        interimPauseTimersRef.current[socketId] = setTimeout(async () => {
          if (latestInterimSeqRef.current[socketId] !== interimSeq) return;

          if (interimAbortRef.current[socketId]) {
            interimAbortRef.current[socketId].abort();
          }
          const controller = new AbortController();
          interimAbortRef.current[socketId] = controller;

          try {
            const result = await translateFullText(cleanText, sourceLang, targetLang, controller.signal);
            if (latestInterimSeqRef.current[socketId] !== interimSeq) return;

            updatePeerSubtitle(socketId, {
              original: cleanText,
              translated: result.text,
              sourceLang: sourceLang || result.detectedLang || "auto",
              targetLang,
              isLive: true,
              isTranslating: false,
            });
          } catch (err) {
            if (err?.name !== "AbortError") {
              console.warn("Interim translation skipped:", err?.message || err);
            }
          }
        }, 800);
        return;
      }

      // 3. Finalized sentence: NEVER aborted by interim updates; translates even very long text via chunks
      if (interimPauseTimersRef.current[socketId]) {
        clearTimeout(interimPauseTimersRef.current[socketId]);
      }
      if (interimAbortRef.current[socketId]) {
        interimAbortRef.current[socketId].abort();
      }

      const finalSeq = (latestFinalSeqRef.current[socketId] || 0) + 1;
      latestFinalSeqRef.current[socketId] = finalSeq;
      // Bump interim seq so any late interim can't overwrite this final
      latestInterimSeqRef.current[socketId] = (latestInterimSeqRef.current[socketId] || 0) + 1;

      // Show original text immediately while translating
      setSubtitles((prev) => ({
        ...prev,
        [socketId]: {
          original: cleanText,
          translated: prev[socketId]?.original === cleanText ? prev[socketId].translated : "",
          sourceLang: sourceLang || "auto",
          targetLang,
          isLive: false,
          isTranslating: true,
        },
      }));

      try {
        const result = await translateFullText(cleanText, sourceLang, targetLang);
        const resolvedSource =
          sourceLang || (result.detectedLang && result.detectedLang !== "auto" ? result.detectedLang : "auto");

        // Always record finalized sentences in the bilingual transcript
        appendTranscript({
          speaker,
          original: cleanText,
          translated: result.text,
          sourceLang: resolvedSource,
          targetLang,
        });

        // Update on-screen caption only if this is still the newest finalized sentence
        if (latestFinalSeqRef.current[socketId] === finalSeq) {
          updatePeerSubtitle(socketId, {
            original: cleanText,
            translated: result.text,
            sourceLang: resolvedSource,
            targetLang,
            isLive: false,
            isTranslating: false,
          });
        }
      } catch (err) {
        console.warn("Final translation error:", err?.message || err);
        if (latestFinalSeqRef.current[socketId] === finalSeq) {
          updatePeerSubtitle(socketId, {
            original: cleanText,
            translated: cleanText,
            sourceLang: sourceLang || "auto",
            targetLang,
            isLive: false,
            isTranslating: false,
          });
        }
      }
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
  // 1. Self-Healing Speech Recognition (Fixes Long-Sentence Cutoff & Stalling)
  // ==========================================
  useEffect(() => {
    if (!hasJoined || muted) {
      setMicState("idle");
      setMyLiveCaption("");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicState("unsupported");
      return;
    }

    let isDisposed = false;
    let isListening = false;
    let fatalPermissionError = false;
    let recognition = null;
    let restartTimer = null;
    let pauseFlushTimer = null;
    let watchdogTimer = null;

    let lastInterimEmitAt = 0;
    let unfinalizedInterim = "";
    let lastEmittedFinal = "";
    let lastEmittedFinalAt = 0;

    const emitFinalSentence = (rawText) => {
      const clean = (rawText || "").replace(/\s+/g, " ").trim();
      if (!clean || !socketRef.current) return;

      // Deduplicate identical final emitted within 2.5s (e.g., pause-flush followed by Chrome isFinal)
      const now = Date.now();
      if (clean.toLowerCase() === lastEmittedFinal.toLowerCase() && now - lastEmittedFinalAt < 2500) {
        return;
      }

      lastEmittedFinal = clean;
      lastEmittedFinalAt = now;
      unfinalizedInterim = "";

      setMyLiveCaption(clean);
      if (selfCaptionTimerRef.current) clearTimeout(selfCaptionTimerRef.current);
      selfCaptionTimerRef.current = setTimeout(() => setMyLiveCaption(""), 5500);

      socketRef.current.emit("send-subtitle", {
        roomCode,
        text: clean,
        sourceLang: myLanguage,
        name: userName,
      });

      appendTranscript({
        speaker: `${userName} (You)`,
        original: clean,
        translated: clean,
        sourceLang: myLanguage,
        targetLang: myLanguage,
      });
    };

    const scheduleRestart = (delayMs = 350) => {
      if (isDisposed || fatalPermissionError || mutedRef.current) return;
      if (restartTimer) clearTimeout(restartTimer);
      setMicState("restarting");

      restartTimer = setTimeout(() => {
        if (!isDisposed && !fatalPermissionError && !mutedRef.current) {
          startFreshRecognition();
        }
      }, delayMs);
    };

    const startFreshRecognition = () => {
      if (isDisposed || fatalPermissionError || mutedRef.current) return;

      // Cleanly tear down any previous wedged instance before creating a fresh one
      if (recognition) {
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        try { recognition.abort(); } catch {}
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = myLanguage;

      rec.onstart = () => {
        if (isDisposed) return;
        isListening = true;
        setMicState("listening");
      };

      rec.onresult = (event) => {
        if (isDisposed || mutedRef.current || !socketRef.current) return;

        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0]?.transcript || "";
          if (event.results[i].isFinal) {
            finalTranscript += ` ${transcript}`;
          } else {
            interimTranscript += ` ${transcript}`;
          }
        }

        const trimmedInterim = interimTranscript.replace(/\s+/g, " ").trim();
        const trimmedFinal = finalTranscript.replace(/\s+/g, " ").trim();

        if (trimmedInterim) {
          unfinalizedInterim = trimmedInterim;
          setMyLiveCaption(trimmedInterim);

          const now = Date.now();
          if (now - lastInterimEmitAt >= 400) {
            lastInterimEmitAt = now;
            socketRef.current.emit("send-interim-subtitle", {
              roomCode,
              text: trimmedInterim,
              sourceLang: myLanguage,
              name: userName,
            });
          }

          // If Chrome delays isFinal on a long sentence, flush automatically after a 1.1s pause
          if (pauseFlushTimer) clearTimeout(pauseFlushTimer);
          pauseFlushTimer = setTimeout(() => {
            if (unfinalizedInterim) {
              const toFlush = unfinalizedInterim;
              emitFinalSentence(toFlush);
              // For very long utterances (>180 chars), cycle recognition cleanly so Chrome's buffer stays fresh
              if (toFlush.length > 180) {
                try { rec.stop(); } catch {}
              }
            }
          }, 1100);
        }

        if (trimmedFinal) {
          if (pauseFlushTimer) clearTimeout(pauseFlushTimer);
          emitFinalSentence(trimmedFinal);
        }
      };

      rec.onerror = (event) => {
        if (isDisposed) return;
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          fatalPermissionError = true;
          isListening = false;
          setMicState("idle");
          console.error("Speech recognition permission denied:", event.error);
          return;
        }
        // On network/audio-capture glitches, recover cleanly after a short delay
        if (event.error === "network" || event.error === "audio-capture") {
          isListening = false;
          scheduleRestart(1000);
        }
      };

      rec.onend = () => {
        isListening = false;
        if (isDisposed) return;

        // CRITICAL FIX: Chrome often cuts off long sentences via onend WITHOUT emitting isFinal.
        // Flush any unfinalized long sentence here so it NEVER gets lost!
        if (pauseFlushTimer) clearTimeout(pauseFlushTimer);
        if (unfinalizedInterim) {
          emitFinalSentence(unfinalizedInterim);
        }

        if (!fatalPermissionError && !mutedRef.current) {
          scheduleRestart(300);
        }
      };

      recognition = rec;
      try {
        rec.start();
      } catch {
        // Retry instead of dying permanently on InvalidStateError
        scheduleRestart(650);
      }
    };

    startFreshRecognition();

    // Watchdog: guarantees speech recognition never stays permanently dead after a long utterance
    watchdogTimer = setInterval(() => {
      if (!isDisposed && !fatalPermissionError && !mutedRef.current && !isListening && !restartTimer) {
        startFreshRecognition();
      }
    }, 3000);

    return () => {
      isDisposed = true;
      if (restartTimer) clearTimeout(restartTimer);
      if (pauseFlushTimer) clearTimeout(pauseFlushTimer);
      if (watchdogTimer) clearInterval(watchdogTimer);
      if (selfCaptionTimerRef.current) clearTimeout(selfCaptionTimerRef.current);
      if (recognition) {
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        try { recognition.abort(); } catch {}
      }
    };
  }, [hasJoined, muted, myLanguage, roomCode, userName, appendTranscript]);

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

          if (interimAbortRef.current[socketId]) {
            interimAbortRef.current[socketId].abort();
            delete interimAbortRef.current[socketId];
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
      Object.values(interimAbortRef.current).forEach((c) => c.abort());
      interimAbortRef.current = {};
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
            <div className="lobby-logo">
              <CamOnIcon />
            </div>
            <h1 className="lobby-title">Ready to join?</h1>
            <p className="lobby-sub">
              Room:{" "}
              <strong style={{ color: "#ffb703", fontFamily: "monospace" }}>
                {roomCode}
              </strong>
            </p>

            <div className={`lobby-status ${serverStatus === "waking" ? "warn" : "ok"}`}>
              <span className="status-dot" />
              {serverStatus === "waking"
                ? "Waking Server..."
                : "Server Ready • Live Dual-Language Translation"}
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
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <TranslateIcon /> Select your language
                  </span>
                  <span className="form-hint">
                    Displays both the speaker's original language and live translation in your language.
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
                Join Meeting
              </button>
            </form>

            <div style={{ marginTop: "20px" }}>
              <Link
                to="/dashboard"
                style={{ color: "var(--text-muted)", fontSize: "0.9rem", textDecoration: "none" }}
              >
                ← Cancel and return to dashboard
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
            <span className="logo-icon">
              <CamOnIcon />
            </span>
            Chalfal
          </Link>
        </div>

        <div className="lang-control">
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
          <span
            className={`live-pill ${
              serverStatus === "connected" && micState !== "unsupported" ? "ok" : "warn"
            }`}
          >
            <span className="status-dot" style={{ width: 6, height: 6 }} />
            {serverStatus !== "connected"
              ? "Connecting..."
              : micState === "unsupported"
              ? "No Speech API"
              : muted
              ? "Mic Muted"
              : micState === "listening"
              ? "Live Translate"
              : "Syncing Mic..."}
          </span>
        </div>

        <button className="room-code" onClick={handleCopyRoom} title="Click to copy room code">
          <CopyIcon />
          {copiedCode ? (
            "Copied!"
          ) : (
            <>
              Room: <span style={{ fontFamily: "monospace" }}>{roomCode}</span>
            </>
          )}
        </button>
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
                title={muted ? "Unmute" : "Mute"}
              >
                {muted ? <MicOffIcon /> : <MicOnIcon />}
              </button>
              <button
                className={`tb-btn${videoOff ? " off" : ""}`}
                onClick={toggleVideo}
                title={videoOff ? "Turn Camera On" : "Turn Camera Off"}
              >
                {videoOff ? <CamOffIcon /> : <CamOnIcon />}
              </button>
              <button
                className={`tb-btn${screenSharing ? " active-amber" : ""}`}
                onClick={toggleScreenShare}
                title={screenSharing ? "Stop Screen Share" : "Share Screen"}
              >
                <ScreenIcon />
              </button>
              <button
                className={`tb-btn${captionsEnabled ? " active-amber" : ""}`}
                onClick={() => setCaptionsEnabled((c) => !c)}
                title={captionsEnabled ? "Hide Subtitles" : "Show Subtitles"}
              >
                <CaptionsIcon />
              </button>
              <button
                className={`tb-btn${panelOpen && panelTab === "transcript" ? " active-amber" : ""}`}
                onClick={() => handleOpenPanel("transcript")}
                title="Bilingual Transcript"
              >
                <TranslateIcon />
              </button>
              <button
                className={`tb-btn${panelOpen && panelTab === "chat" ? " active-amber" : ""}`}
                onClick={() => handleOpenPanel("chat")}
                title="In-Call Chat"
              >
                <ChatIcon />
                {unreadChat && <span className="unread-dot" />}
              </button>
              <button className="tb-btn end" onClick={handleEndCall} title="Leave Call">
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

            {/* Row 2: Translated Text in Your Language */}
            {showTranslationRow && (
              <div
                className={`caption-row translated${
                  subtitle.isTranslating && !subtitle.translated ? " pending" : ""
                }`}
              >
                <span className="lang-tag tgt">{getLangName(subtitle.targetLang)}</span>
                <span>{subtitle.translated || "Translating..."}</span>
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
              Both spoken sentences and their translations will be logged here live.
            </div>
          )}
          {transcriptHistory.map((item) => {
            const isTranslated =
              item.translated &&
              item.translated !== item.original &&
              getBaseLang(item.sourceLang) !== getBaseLang(item.targetLang);

            return (
              <div className="transcript-card" key={item.id}>
                <div className="card-meta">
                  <span className="cm-name">{item.speaker}</span>
                  <span className="cm-time">
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
              <div className="empty-state">No messages yet.</div>
            )}
            {messages.map((m, i) => (
              <div className="chat-card" key={i}>
                <div className="card-meta">
                  <span className="cm-name">{m.name}</span>
                  <span className="cm-time">
                    {new Date(m.time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="chat-body">{m.message}</div>
              </div>
            ))}
            <div ref={endRef} />
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
        </>
      )}
    </aside>
  );
});

export default Meeting;