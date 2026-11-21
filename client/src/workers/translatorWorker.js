import { pipeline, env } from "@huggingface/transformers";

// Production deployment fixes (Vercel / static hosting)
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = true;
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.numThreads = 1;
}

// Dedicated bilingual models: far more accurate & 5x smaller than NLLB-600M
const DIRECT_OPUS_MODELS = {
  "en->hi": "Xenova/opus-mt-en-hi",
  "hi->en": "Xenova/opus-mt-hi-en",
  "en->es": "Xenova/opus-mt-en-es",
  "es->en": "Xenova/opus-mt-es-en",
  "en->fr": "Xenova/opus-mt-en-fr",
  "fr->en": "Xenova/opus-mt-fr-en",
};

const NLLB_MODEL = "Xenova/nllb-200-distilled-600M";

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

// Punctuates raw Web Speech API output so translation models parse full sentences properly
function normalizeSpeechInput(text, sourceLang) {
  let clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";

  const base = getBaseLang(sourceLang);
  const isDevanagari = base === "ne" || base === "hi";

  if (!isDevanagari) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }

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

// Cache loaded pipelines by model ID so each pair downloads only once
const pipelineCache = new Map();
const progressTrackers = new Map();

function reportModelProgress(modelId, file, progress) {
  if (!file || typeof progress !== "number") return;
  if (!progressTrackers.has(modelId)) {
    progressTrackers.set(modelId, new Map());
  }
  const files = progressTrackers.get(modelId);
  files.set(file, progress);
  const vals = Array.from(files.values());
  const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);

  self.postMessage({
    status: "loading",
    progress: Math.min(99, Math.max(1, avg)),
    model: modelId.split("/").pop(),
  });
}

async function getPipeline(modelId) {
  if (!pipelineCache.has(modelId)) {
    const loadPromise = pipeline("translation", modelId, {
      dtype: "q8",
      progress_callback: (data) => {
        if (data.status === "progress") {
          reportModelProgress(modelId, data.file, data.progress);
        } else if (data.status === "done" && data.file) {
          reportModelProgress(modelId, data.file, 100);
        }
      },
    }).catch((err) => {
      pipelineCache.delete(modelId);
      throw err;
    });
    pipelineCache.set(modelId, loadPromise);
  }
  return pipelineCache.get(modelId);
}

self.onmessage = async (event) => {
  const { type, seq, socketId, text, sourceLang, targetLang, preferredLang } = event.data || {};

  // Warm up only what's actually needed
  if (type === "init") {
    try {
      const base = getBaseLang(preferredLang || "en-US");
      // Only pre-load NLLB up front if the user selected Nepali
      if (base === "ne") {
        self.postMessage({ status: "loading", progress: 1, model: "nllb-200" });
        await getPipeline(NLLB_MODEL);
      }
      self.postMessage({ status: "ready" });
    } catch (err) {
      self.postMessage({ status: "error", error: err?.message || String(err) });
    }
    return;
  }

  if (type === "translate") {
    try {
      const srcBase = getBaseLang(sourceLang);
      const tgtBase = getBaseLang(targetLang);
      const pairKey = `${srcBase}->${tgtBase}`;
      const opusModel = DIRECT_OPUS_MODELS[pairKey];

      const preparedText = normalizeSpeechInput(text, sourceLang);
      if (!preparedText) return;

      let output;
      let engineName;

      if (opusModel) {
        // Tier 2: Dedicated bilingual Opus-MT model (high accuracy, fast)
        const translator = await getPipeline(opusModel);
        output = await translator(preparedText, {
          num_beams: 4,
          early_stopping: true,
          max_new_tokens: 128,
        });
        engineName = `Opus-MT (${pairKey})`;
      } else {
        // Tier 3: NLLB-200 for Nepali & indirect pairs (NO repetition_penalty distortion)
        const translator = await getPipeline(NLLB_MODEL);
        output = await translator(preparedText, {
          src_lang: toNllbCode(sourceLang),
          tgt_lang: toNllbCode(targetLang),
          num_beams: 4,
          early_stopping: true,
          max_new_tokens: 128,
        });
        engineName = "NLLB-200";
      }

      const translatedText = (output?.[0]?.translation_text || text).trim();

      self.postMessage({
        status: "complete",
        seq,
        socketId,
        sourceLang,
        targetLang,
        originalText: text,
        translatedText,
        engine: engineName,
      });
    } catch (err) {
      self.postMessage({
        status: "error",
        seq,
        socketId,
        originalText: text,
        error: err?.message || String(err),
      });
    }
  }
};