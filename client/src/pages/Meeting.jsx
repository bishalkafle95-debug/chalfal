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
];

// --- Icons ---
const MicOnIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);
const MicOffIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
// Accurate Free Translation Engine (EN / NE / HI)
// ==========================================
const translationCache = new Map();
const providerCooldown = new Map();

const getBaseLang = (code) => {
  if (!code || typeof code !== "string") return "auto";
  const base = code.toLowerCase().split("-")[0];
  return ["en", "ne", "hi"].includes(base) ? base : "auto";
};

const getLangName = (code) => {
  const base = getBaseLang(code);
  const match = SUPPORTED_LANGUAGES.find((l) => getBaseLang(l.code) === base);
  return match ? match.name : "Auto";
};

const getInitials = (name = "G") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || "G";

// Heuristic distinction between Nepali and Hindi when Devanagari arrives without explicit sourceLang
const NEPALI_MARKERS = /(तपाईं|तिमी|छु|छौ|छन्|छैन|होइन|गर्छु|गर्नु|पनि|कस्तो|के\s|कहाँ|किन|हामी|मेरो|तिम्रो|तपाईंको|लाई|बाट|मा\s)/;
const HINDI_MARKERS = /(आप|तुम|मैं|है\b|हैं|नहीं|कैसे|क्या|कहाँ|क्यों|हम|मेरा|तुम्हारा|आपका|करता|करती|और|भी|से\s|में\s)/;

function detectEffectiveSource(text, declaredSourceLang, targetLang) {
  const declared = getBaseLang(declaredSourceLang);
  const tgt = getBaseLang(targetLang);
  const hasDevanagari = /[\u0900-\u097F]/.test(text);

  if (hasDevanagari) {
    if (declared === "ne" || declared === "hi") return declared;
    const neHits = (text.match(new RegExp(NEPALI_MARKERS, "g")) || []).length;
    const hiHits = (text.match(new RegExp(HINDI_MARKERS, "g")) || []).length;
    if (neHits > hiHits) return "ne";
    if (hiHits > neHits) return "hi";
    // If listener is Hindi, Devanagari is likely Nepali; otherwise default to auto
    return tgt === "hi" ? "ne" : tgt === "ne" ? "hi" : "auto";
  }

  // Pure Latin script: if speaker declared EN or spoke English words while set to NE/HI
  if (/[a-zA-Z]/.test(text)) {
    return declared === "en" ? "en" : "auto";
  }

  return declared;
}

const QUESTION_STARTERS = {
  en: /^(what|what's|where|where's|when|why|who|who's|whom|whose|which|how|how's|is|are|am|was|were|do|does|did|can|could|will|would|shall|should|have|has|had)\b/i,
  ne: /^(के|कहाँ|कहिले|किन|को|कस्तो|कति|कसरी|कुन)/,
  hi: /^(क्या|कहाँ|कब|क्यों|कौन|कैसा|कैसी|कैसे|कितना|कितने|किस)/,
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

function normalizeSpeechText(text, srcBase) {
  let clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";

  const hasDevanagari = /[\u0900-\u097F]/.test(clean);

  if (!hasDevanagari) {
    for (const [pattern, replacement] of EN_CONTRACTIONS) {
      clean = clean.replace(pattern, replacement);
    }
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  if (!/[.?!।]$/.test(clean)) {
    const qRegex = QUESTION_STARTERS[srcBase];
    if (qRegex && qRegex.test(clean)) {
      clean += "?";
    }
  }
  return clean;
}

// Keep full sentences intact up to 350 chars for natural NMT accuracy; split only very long speech
function splitIntoChunks(text, maxChars = 350) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return [clean];

  const chunks = [];
  const sentences = clean.split(/(?<=[.?!।])\s+/);

  for (const sentence of sentences) {
    if (sentence.length <= maxChars) {
      chunks.push(sentence);
      continue;
    }

    // Try splitting on natural clause boundaries before falling back to word boundaries
    const clauses = sentence.split(/(?<=,|;)\s+|\s+(?=(?:and|but|because|so|or|तर|अनि|किनभने|और|लेकिन|क्योंकि)\s)/i);
    let current = "";

    for (const clause of clauses) {
      if (clause.length > maxChars) {
        if (current) {
          chunks.push(current);
          current = "";
        }
        const words = clause.split(/\s+/);
        for (const w of words) {
          const cand = current ? `${current} ${w}` : w;
          if (cand.length <= maxChars) {
            current = cand;
          } else {
            if (current) chunks.push(current);
            current = w.slice(0, maxChars);
          }
        }
        continue;
      }

      const candidate = current ? `${current} ${clause}` : clause;
      if (candidate.length <= maxChars) {
        current = candidate;
      } else {
        if (current) chunks.push(current);
        current = clause;
      }
    }
    if (current) chunks.push(current);
  }

  return chunks.filter(Boolean);
}

async function fetchWithTimeout(url, externalSignal, timeoutMs = 5000) {
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

const isCoolingDown = (key) => (providerCooldown.get(key) || 0) > Date.now();
const setCooldown = (key, ms = 35000) => providerCooldown.set(key, Date.now() + ms);

const isSameIgnoringCase = (a = "", b = "") =>
  a.replace(/[.?!।\s]+/g, " ").trim().toLowerCase() ===
  b.replace(/[.?!।\s]+/g, " ").trim().toLowerCase();

async function callGoogleGtx(chunk, sl, tl, signal) {
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx` +
    `&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}` +
    `&dt=t&q=${encodeURIComponent(chunk)}`;

  const res = await fetchWithTimeout(url, signal, 5000);
  if (res.status === 429) {
    setCooldown("gtx", 30000);
    return null;
  }
  if (!res.ok) return null;

  const data = await res.json();
  if (!Array.isArray(data?.[0])) return null;

  const translated = data[0]
    .map((seg) => (Array.isArray(seg) && typeof seg[0] === "string" ? seg[0] : ""))
    .join("")
    .trim();
  const detectedLang = typeof data?.[2] === "string" ? data[2] : sl;
  return translated ? { text: translated, detectedLang, ok: true } : null;
}

async function callGoogleDict(chunk, sl, tl, signal) {
  const url =
    `https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex` +
    `&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}` +
    `&dt=t&q=${encodeURIComponent(chunk)}`;

  const res = await fetchWithTimeout(url, signal, 5000);
  if (res.status === 429) {
    setCooldown("dict", 30000);
    return null;
  }
  if (!res.ok) return null;

  const data = await res.json();
  let translated = "";
  let detectedLang = sl;

  if (Array.isArray(data?.sentences)) {
    translated = data.sentences.map((s) => s?.trans || "").join("").trim();
    if (typeof data?.src === "string") detectedLang = data.src;
  } else if (Array.isArray(data?.[0])) {
    translated = data[0]
      .map((seg) => (Array.isArray(seg) && typeof seg[0] === "string" ? seg[0] : ""))
      .join("")
      .trim();
    if (typeof data?.[2] === "string") detectedLang = data[2];
  }

  return translated ? { text: translated, detectedLang, ok: true } : null;
}

async function translateSingleChunk(chunk, src, tgt, signal) {
  const cacheKey = `${src}:${tgt}:${chunk.toLowerCase()}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const saveAndReturn = (res) => {
    if (res?.ok) {
      if (translationCache.size > 1200) translationCache.clear();
      translationCache.set(cacheKey, res);
    }
    return res;
  };

  // 1. Primary: Google Translate GTX (CORS-enabled, highest accuracy for EN / NE / HI)
  if (!isCoolingDown("gtx")) {
    try {
      let res = await callGoogleGtx(chunk, src, tgt, signal);
      // If explicit sl returned exact same text, retry once with sl=auto (handles mixed-language speech)
      if (res && isSameIgnoringCase(res.text, chunk) && src !== "auto") {
        const autoRes = await callGoogleGtx(chunk, "auto", tgt, signal);
        if (autoRes && !isSameIgnoringCase(autoRes.text, chunk)) {
          res = autoRes;
        }
      }
      if (res) return saveAndReturn(res);
    } catch (err) {
      if (signal?.aborted) throw err;
    }
  }

  // 2. Backup Google endpoint on CORS-enabled translate.googleapis.com
  if (!isCoolingDown("dict")) {
    try {
      const res = await callGoogleDict(chunk, src, tgt, signal);
      if (res) return saveAndReturn(res);
    } catch (err) {
      if (signal?.aborted) throw err;
    }
  }

  // 3. Fallback: MyMemory API (CORS-enabled, requires explicit 2-letter source code)
  if (!isCoolingDown("mymemory")) {
    try {
      let mmSrc = src;
      if (mmSrc === "auto") {
        if (/[\u0900-\u097F]/.test(chunk)) {
          mmSrc = tgt === "hi" ? "ne" : "hi";
        } else {
          mmSrc = "en";
        }
      }

      if (mmSrc !== tgt) {
        const url =
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}` +
          `&langpair=${encodeURIComponent(`${mmSrc}|${tgt}`)}`;
        const res = await fetchWithTimeout(url, signal, 5000);
        if (res.status === 429) {
          setCooldown("mymemory", 60000);
        } else if (res.ok) {
          const data = await res.json();
          const translated = (data?.responseData?.translatedText || "").trim();
          const isWarning = /MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID LANGUAGE/i.test(translated);
          if (data?.responseStatus === 200 && translated && !isWarning) {
            return saveAndReturn({ text: translated, detectedLang: mmSrc, ok: true });
          }
        }
      }
    } catch (err) {
      if (signal?.aborted) throw err;
    }
  }

  // 4. Last resort: Lingva Translate proxy
  if (!isCoolingDown("lingva")) {
    try {
      const pathSafe = chunk.replace(/\//g, " ");
      const url = `https://lingva.ml/api/v1/${encodeURIComponent(src)}/${encodeURIComponent(tgt)}/${encodeURIComponent(pathSafe)}`;
      const res = await fetchWithTimeout(url, signal, 4000);
      if (res.ok) {
        const data = await res.json();
        const translated = (data?.translation || "").trim();
        if (translated) {
          return saveAndReturn({ text: translated, detectedLang: src, ok: true });
        }
      } else {
        setCooldown("lingva", 60000);
      }
    } catch (err) {
      if (signal?.aborted) throw err;
      setCooldown("lingva", 60000);
    }
  }

  // IMPORTANT: Never cache a failed translation!
  return { text: "", detectedLang: src, ok: false };
}

async function translateFullText(text, declaredSourceLang, targetLang, signal) {
  const raw = (text || "").replace(/\s+/g, " ").trim();
  const tgt = getBaseLang(targetLang);
  if (!raw || tgt === "auto") {
    return { text: raw, detectedLang: getBaseLang(declaredSourceLang), ok: true };
  }

  const src = detectEffectiveSource(raw, declaredSourceLang, targetLang);
  if (src !== "auto" && src === tgt) {
    return { text: raw, detectedLang: src, ok: true };
  }

  const prepared = normalizeSpeechText(raw, src);
  const fullCacheKey = `FULL:${src}:${tgt}:${prepared.toLowerCase()}`;
  if (translationCache.has(fullCacheKey)) {
    return translationCache.get(fullCacheKey);
  }

  const chunks = splitIntoChunks(prepared, 350);
  const chunkResults = await Promise.all(
    chunks.map((c) => translateSingleChunk(c, src, tgt, signal))
  );

  const anySucceeded = chunkResults.some((r) => r.ok && r.text);
  const allSucceeded = chunkResults.every((r) => r.ok && r.text);
  const combinedText = chunkResults
    .map((r, i) => (r.ok && r.text ? r.text : chunks[i]))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const detectedLang = chunkResults.find((r) => r.detectedLang && r.detectedLang !== "auto")?.detectedLang || src;
  const result = {
    text: anySucceeded ? combinedText : "",
    detectedLang,
    ok: anySucceeded,
  };

  if (allSucceeded) {
    if (translationCache.size > 1200) translationCache.clear();
    translationCache.set(fullCacheKey, result);
  }

  return result;
}

// ==========================================
// Original Chalfal Theme Colors + Compact Below-Video Names
// ==========================================
const MEETING_STYLES = `
  :root {
    --bg-light: #0b192c;
    --surface: #1a1a1a;
    --surface-dark: #111;
    --border: #333;
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
    padding: 2.5rem;
    border-radius: 18px;
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.55);
    border: 1px solid var(--border);
    width: 100%;
    max-width: 460px;
    text-align: center;
  }
  .lobby-logo {
    width: 54px;
    height: 54px;
    border-radius: 14px;
    background: var(--accent-light);
    border: 1px solid rgba(230, 57, 70, 0.35);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    margin-bottom: 1rem;
  }
  .lobby-title { font-size: 1.85rem; color: #fff; margin-bottom: 0.45rem; font-weight: 800; }
  .lobby-sub { color: var(--text-muted); font-size: 0.96rem; margin-bottom: 1.25rem; }
  .lobby-status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 1.35rem;
    padding: 7px 14px;
    border-radius: 999px;
    background: var(--surface-dark);
    border: 1px solid var(--border);
    font-size: 0.82rem;
    font-weight: 600;
  }
  .lobby-status.ok { border-color: rgba(46, 204, 113, 0.4); color: var(--green); }
  .lobby-status.warn { border-color: rgba(255, 183, 3, 0.4); color: var(--amber); }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }

  .lobby-toggles {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 1.35rem;
  }
  .lobby-toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--bg-light);
    color: #fff;
    font-size: 0.88rem;
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

  .form-group { text-align: left; margin-bottom: 1.55rem; }
  .form-group label { display: block; margin-bottom: 8px; color: #fff; font-size: 0.94rem; font-weight: 600; }
  .form-hint { display: block; font-size: 0.79rem; color: var(--text-muted); font-weight: 400; margin-top: 3px; }
  .lobby-select {
    width: 100%;
    padding: 13px 15px;
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
    padding: 14px;
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
    padding: 0.65rem 1.5rem;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    z-index: 30;
    flex-wrap: wrap;
    gap: 10px;
  }
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
    font-size: 0.74rem;
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
    font-size: 0.85rem;
    border: 1px solid rgba(230, 57, 70, 0.35);
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
  }
  .room-code:hover { background: rgba(230, 57, 70, 0.3); }

  /* --- Video Stage & Below-Video Compact Name Bar --- */
  .meet-body { flex: 1; display: flex; min-height: 0; position: relative; }
  .video-stage { flex: 1; display: flex; flex-direction: column; min-width: 0; position: relative; background: #000; }
  .video-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 1.1rem;
    padding: 1rem 1.25rem 5.4rem;
    overflow-y: auto;
    align-content: center;
  }
  .video-grid.single-tile { max-width: 940px; width: 100%; margin: 0 auto; }

  .video-slot {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }
  .video-tile {
    position: relative;
    background: var(--surface);
    border-radius: 12px;
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
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    font-size: 1.45rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 20px rgba(230, 57, 70, 0.35);
  }

  /* Compact name bar directly below each video (zero obstruction on video) */
  .video-name-below {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px;
    gap: 8px;
    min-height: 20px;
  }
  .video-name-text {
    font-size: 0.78rem;
    font-weight: 600;
    color: #d4d4d8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .video-name-meta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .video-lang-mini {
    font-size: 0.68rem;
    font-weight: 700;
    color: var(--text-muted);
    background: #1a1a1a;
    border: 1px solid var(--border);
    padding: 1px 6px;
    border-radius: 4px;
  }
  .video-muted-mini {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 0.68rem;
    font-weight: 700;
    color: var(--accent);
  }

  /* --- Dual-Language Subtitle Box (Shows BOTH Spoken & Translated) --- */
  .dual-caption-wrap {
    position: absolute;
    bottom: 10px;
    left: 10px;
    right: 10px;
    display: flex;
    justify-content: center;
    pointer-events: none;
    z-index: 8;
  }
  .dual-caption-card {
    background: rgba(11, 25, 44, 0.92);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 183, 3, 0.38);
    border-radius: 10px;
    padding: 8px 13px;
    max-width: 97%;
    min-width: 220px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.65);
    display: flex;
    flex-direction: column;
    gap: 5px;
    text-align: left;
  }
  .caption-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    line-height: 1.36;
    word-break: break-word;
  }
  .caption-row.original {
    color: #e5e5e5;
    font-size: 0.86rem;
    font-weight: 500;
    padding-bottom: 4px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }
  .caption-row.original.solo { border-bottom: none; padding-bottom: 0; }
  .caption-row.translated {
    color: var(--amber);
    font-size: 1.04rem;
    font-weight: 800;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  }
  .caption-row.translated.pending {
    color: var(--text-muted);
    font-size: 0.84rem;
    font-style: italic;
    font-weight: 500;
    text-shadow: none;
  }
  .caption-row.translated.failed {
    color: #fca5a5;
    font-size: 0.82rem;
    font-weight: 600;
    text-shadow: none;
  }
  .lang-tag {
    flex-shrink: 0;
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .lang-tag.src { background: rgba(255, 255, 255, 0.14); color: #fff; }
  .lang-tag.tgt { background: rgba(255, 183, 3, 0.22); color: var(--amber); }

  /* --- Floating Toolbar Dock --- */
  .meet-dock-wrap {
    position: absolute;
    bottom: 14px;
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
    gap: 11px;
    padding: 8px 16px;
    background: rgba(26, 26, 26, 0.92);
    backdrop-filter: blur(12px);
    border: 1px solid var(--border);
    border-radius: 999px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
  }
  .tb-btn {
    width: 46px;
    height: 46px;
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
    width: 54px;
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
    width: 360px;
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
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-muted);
    font-size: 0.86rem;
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
    gap: 0.8rem;
    background: var(--surface);
  }
  .empty-state {
    color: #888;
    font-size: 0.85rem;
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
    font-size: 0.79rem;
  }
  .cm-name { font-weight: 700; color: var(--amber); }
  .cm-time { color: #888; font-size: 0.72rem; }
  .chat-body { color: #fff; font-size: 0.91rem; line-height: 1.45; }

  .transcript-orig {
    color: #ddd;
    font-size: 0.84rem;
    display: flex;
    gap: 6px;
    align-items: baseline;
    line-height: 1.4;
    margin-bottom: 5px;
  }
  .transcript-trans {
    color: var(--amber);
    font-size: 0.93rem;
    font-weight: 700;
    display: flex;
    gap: 6px;
    align-items: baseline;
    line-height: 1.4;
  }

  .chat-input-row {
    padding: 0.85rem;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 8px;
    background: var(--surface-dark);
  }
  .chat-input-row input {
    flex: 1;
    padding: 10px 13px;
    border: 1px solid #444;
    border-radius: 8px;
    background: #222;
    color: #fff;
    outline: none;
  }
  .chat-input-row input:focus { border-color: var(--accent); }
  .chat-input-row button {
    padding: 0 16px;
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
    .video-grid { grid-template-columns: 1fr; padding: 0.8rem 0.8rem 5.2rem; }
    .side-panel { width: 100%; height: 40vh; border-left: none; border-top: 1px solid var(--border); }
    .side-panel.hidden { height: 0; width: 100%; }
    .meet-topbar { padding: 0.6rem 1rem; }
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
  // Incoming Subtitle Translator (EN / NE / HI)
  // ==========================================
  const handleIncomingSubtitle = useCallback(
    async (socketId, text, sourceLang, isInterim, senderName) => {
      const cleanText = (text || "").replace(/\s+/g, " ").trim();
      if (!cleanText) return;

      const targetLang = myLanguageRef.current;
      const effectiveSrc = detectEffectiveSource(cleanText, sourceLang, targetLang);
      const tgtBase = getBaseLang(targetLang);
      const speaker =
        senderName ||
        peersRef.current.find((p) => p.peerId === socketId)?.name ||
        "Participant";

      const sameLanguage = effectiveSrc !== "auto" && effectiveSrc === tgtBase;

      // 1. Same language -> display directly without calling API
      if (sameLanguage) {
        updatePeerSubtitle(socketId, {
          original: cleanText,
          translated: cleanText,
          sourceLang: effectiveSrc,
          targetLang,
          isLive: isInterim,
          isTranslating: false,
          failed: false,
        });
        if (!isInterim) {
          appendTranscript({
            speaker,
            original: cleanText,
            translated: cleanText,
            sourceLang: effectiveSrc,
            targetLang,
          });
        }
        return;
      }

      // 2. Interim live speech -> show original immediately, translate on 750ms pause
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
              sourceLang: effectiveSrc,
              targetLang,
              isLive: true,
              isTranslating: true,
              failed: false,
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
              translated: result.ok ? result.text : "",
              sourceLang: result.detectedLang !== "auto" ? result.detectedLang : effectiveSrc,
              targetLang,
              isLive: true,
              isTranslating: false,
              failed: !result.ok,
            });
          } catch (err) {
            if (err?.name !== "AbortError") {
              console.warn("Interim translation skipped:", err?.message || err);
            }
          }
        }, 750);
        return;
      }

      // 3. Finalized sentence -> never aborted by interim updates; full sentence accuracy
      if (interimPauseTimersRef.current[socketId]) {
        clearTimeout(interimPauseTimersRef.current[socketId]);
      }
      if (interimAbortRef.current[socketId]) {
        interimAbortRef.current[socketId].abort();
      }

      const finalSeq = (latestFinalSeqRef.current[socketId] || 0) + 1;
      latestFinalSeqRef.current[socketId] = finalSeq;
      latestInterimSeqRef.current[socketId] = (latestInterimSeqRef.current[socketId] || 0) + 1;

      setSubtitles((prev) => ({
        ...prev,
        [socketId]: {
          original: cleanText,
          translated: prev[socketId]?.original === cleanText ? prev[socketId].translated : "",
          sourceLang: effectiveSrc,
          targetLang,
          isLive: false,
          isTranslating: true,
          failed: false,
        },
      }));

      try {
        const result = await translateFullText(cleanText, sourceLang, targetLang);
        const resolvedSource =
          result.detectedLang && result.detectedLang !== "auto" ? result.detectedLang : effectiveSrc;

        appendTranscript({
          speaker,
          original: cleanText,
          translated: result.ok ? result.text : "",
          sourceLang: resolvedSource,
          targetLang,
        });

        if (latestFinalSeqRef.current[socketId] === finalSeq) {
          updatePeerSubtitle(socketId, {
            original: cleanText,
            translated: result.ok ? result.text : "",
            sourceLang: resolvedSource,
            targetLang,
            isLive: false,
            isTranslating: false,
            failed: !result.ok,
          });
        }
      } catch (err) {
        console.warn("Final translation error:", err?.message || err);
        if (latestFinalSeqRef.current[socketId] === finalSeq) {
          updatePeerSubtitle(socketId, {
            original: cleanText,
            translated: "",
            sourceLang: effectiveSrc,
            targetLang,
            isLive: false,
            isTranslating: false,
            failed: true,
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

  const handleLanguageChange = (nextLang) => {
    myLanguageRef.current = nextLang;
    setMyLanguage(nextLang);
  };

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
  // 1. Self-Healing Speech Recognition (Never Drops Long or Subsequent Sentences)
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
        restartTimer = null;
        if (!isDisposed && !fatalPermissionError && !mutedRef.current) {
          startFreshRecognition();
        }
      }, delayMs);
    };

    const startFreshRecognition = () => {
      if (isDisposed || fatalPermissionError || mutedRef.current) return;

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

          if (pauseFlushTimer) clearTimeout(pauseFlushTimer);
          pauseFlushTimer = setTimeout(() => {
            if (unfinalizedInterim) {
              const toFlush = unfinalizedInterim;
              emitFinalSentence(toFlush);
              if (toFlush.length > 220) {
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
        if (event.error === "network" || event.error === "audio-capture") {
          isListening = false;
          scheduleRestart(1000);
        }
      };

      rec.onend = () => {
        isListening = false;
        if (isDisposed) return;

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
        scheduleRestart(650);
      }
    };

    startFreshRecognition();

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
                : "Server Ready • English / Nepali / Hindi Live Translation"}
            </div>

            <div className="lobby-toggles">
              <button
                type="button"
                className={`lobby-toggle-btn${muted ? " off" : ""}`}
                onClick={() => setMuted((m) => !m)}
              >
                {muted ? <MicOffIcon size={18} /> : <MicOnIcon size={18} />}
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
                    Shows both what the other person speaks and its accurate translation in your language.
                  </span>
                </label>
                <select
                  className="lobby-select"
                  required
                  value={myLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
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

            <div style={{ marginTop: "18px" }}>
              <Link
                to="/dashboard"
                style={{ color: "var(--text-muted)", fontSize: "0.88rem", textDecoration: "none" }}
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
        <Link to="/dashboard" className="logo">
          <span className="logo-icon">
            <CamOnIcon />
          </span>
          Chalfal
        </Link>

        <div className="lang-control">
          <TranslateIcon />
          <select
            className="lang-select-inline"
            value={myLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
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
            {/* Self Video Slot */}
            <div className="video-slot">
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

              {/* Compact name line below video */}
              <div className="video-name-below">
                <span className="video-name-text">{userName} (You)</span>
                <span className="video-name-meta">
                  <span className="video-lang-mini">{getLangName(myLanguage)}</span>
                  {muted && (
                    <span className="video-muted-mini" title="Muted">
                      <MicOffIcon size={13} /> Muted
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Remote Peer Video Slots */}
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

  const isDifferentLang =
    subtitle && getBaseLang(subtitle.sourceLang) !== getBaseLang(subtitle.targetLang);

  const showTranslationRow =
    subtitle &&
    (subtitle.isTranslating || subtitle.failed || (subtitle.translated && isDifferentLang));

  return (
    <div className="video-slot">
      <div className={`video-tile${videoOff ? " video-off" : ""}${subtitle ? " speaking" : ""}`}>
        <video ref={ref} autoPlay playsInline />
        {videoOff && (
          <div className="avatar-fallback">
            <div className="avatar-circle">{getInitials(name)}</div>
          </div>
        )}

        {subtitle?.original && (
          <div className="dual-caption-wrap">
            <div className="dual-caption-card">
              {/* Row 1: Original Spoken Text */}
              <div className={`caption-row original${showTranslationRow ? "" : " solo"}`}>
                <span className="lang-tag src">{getLangName(subtitle.sourceLang)}</span>
                <span>{subtitle.original}</span>
              </div>

              {/* Row 2: Translated Text */}
              {showTranslationRow && (
                <div
                  className={`caption-row translated${
                    subtitle.failed
                      ? " failed"
                      : subtitle.isTranslating && !subtitle.translated
                      ? " pending"
                      : ""
                  }`}
                >
                  <span className="lang-tag tgt">{getLangName(subtitle.targetLang)}</span>
                  <span>
                    {subtitle.failed
                      ? "Translation unavailable right now"
                      : subtitle.translated || "Translating..."}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Compact name line below video */}
      <div className="video-name-below">
        <span className="video-name-text">{name}</span>
        <span className="video-name-meta">
          {subtitle?.sourceLang && subtitle.sourceLang !== "auto" && (
            <span className="video-lang-mini">{getLangName(subtitle.sourceLang)}</span>
          )}
          {muted && (
            <span className="video-muted-mini" title="Muted">
              <MicOffIcon size={13} /> Muted
            </span>
          )}
        </span>
      </div>
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