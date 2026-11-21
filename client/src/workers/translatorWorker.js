import { pipeline, env } from "@xenova/transformers";

env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;
env.backends.onnx.wasm.numThreads = 1;

const NLLB_LANG_MAP = {
  en: "eng_Latn",
  ne: "npi_Deva",
  hi: "hin_Deva",
  es: "spa_Latn",
  fr: "fra_Latn",
};

const QUESTION_STARTERS = {
  en: /^(what|where|when|why|who|whom|whose|which|how|is|are|am|was|were|do|does|did|can|could|will|would|shall|should|have|has|had)\b/i,
  ne: /^(के|कहाँ|कहिले|किन|को|कस्तो|कति|कसरी|कुन)/,
  hi: /^(क्या|कहाँ|कब|क्यों|कौन|कैसा|कैसी|कैसे|कितना|कितने|किस)/,
  es: /^(qué|dónde|cuándo|por qué|quién|cómo|cuál|cuánto)/i,
  fr: /^(que|quoi|où|quand|pourquoi|qui|comment|quel|quelle|est-ce)/i,
};

const getBaseLang = (code = "en-US") => code.toLowerCase().split("-")[0];
const toNllbCode = (code = "en-US") => NLLB_LANG_MAP[getBaseLang(code)] || "eng_Latn";

// NLLB-200 accuracy jumps noticeably when raw speech is properly punctuated
function normalizeSpeechInput(text, sourceLang) {
  let clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";

  const base = getBaseLang(sourceLang);
  const isDevanagari = base === "ne" || base === "hi";

  // Capitalize first letter for Latin scripts
  if (!isDevanagari) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  // Add ending punctuation if Web Speech API omitted it
  if (!/[.?!।]$/.test(clean)) {
    const qRegex = QUESTION_STARTERS[base];
    if (qRegex && qRegex.test(clean)) {
      clean += "?";
    } else {
      clean += isDevanagari ? "।" : ".";
    }
  }

  return clean;
}

let translatorPromise = null;

async function getTranslator() {
  if (!translatorPromise) {
    translatorPromise = pipeline("translation", "Xenova/nllb-200-distilled-600M", {
      quantized: true, // Uses stable q8 WASM weights
      progress_callback: (data) => {
        if (data.status === "progress" && typeof data.progress === "number") {
          self.postMessage({ status: "loading", progress: Math.round(data.progress) });
        }
      },
    });
  }
  return translatorPromise;
}

self.onmessage = async (event) => {
  const { type, seq, socketId, text, sourceLang, targetLang, isInterim } = event.data || {};

  if (type === "init") {
    try {
      self.postMessage({ status: "loading", progress: 1 });
      await getTranslator();
      self.postMessage({ status: "ready" });
    } catch (err) {
      translatorPromise = null;
      self.postMessage({ status: "error", error: err?.message || String(err) });
    }
    return;
  }

  if (type === "translate") {
    try {
      const translator = await getTranslator();
      const preparedText = normalizeSpeechInput(text, sourceLang);
      if (!preparedText) return;

      const output = await translator(preparedText, {
        src_lang: toNllbCode(sourceLang),
        tgt_lang: toNllbCode(targetLang),
        num_beams: 4,             // Change to 3 if you want slightly faster speed
        length_penalty: 1.0,
        no_repeat_ngram_size: 3,  // Stops repeating word loops
        repetition_penalty: 1.15,
        early_stopping: true,
        max_new_tokens: 128,
      });

      const translatedText = (output?.[0]?.translation_text || text).trim();

      self.postMessage({
        status: "complete",
        seq,
        socketId,
        sourceLang,
        targetLang,
        originalText: text,
        isInterim,
        translatedText,
      });
    } catch (err) {
      self.postMessage({
        status: "error",
        seq,
        socketId,
        originalText: text,
        isInterim,
        error: err?.message || String(err),
      });
    }
  }
};