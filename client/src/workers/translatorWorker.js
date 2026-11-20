import { pipeline, env } from "@huggingface/transformers";

env.allowLocalModels = false;
env.useBrowserCache = true;

// Lightweight ~35MB models per language pair (fast browser loading, zero external APIs)
const PAIR_MODELS = {
  "en-es": "Xenova/opus-mt-en-es",
  "es-en": "Xenova/opus-mt-es-en",
  "en-fr": "Xenova/opus-mt-en-fr",
  "fr-en": "Xenova/opus-mt-fr-en",
  "en-hi": "Xenova/opus-mt-en-hi",
  "hi-en": "Xenova/opus-mt-hi-en",
  "en-ne": "Xenova/opus-mt-en-mul", // Multilingual target (supports Nepali)
  "ne-en": "Xenova/opus-mt-mul-en", // Multilingual source (supports Nepali)
};

const loadedPipelines = new Map();

async function getTranslator(srcCode, tgtCode, progressCallback) {
  const src = srcCode.split("-")[0];
  const tgt = tgtCode.split("-")[0];
  const pairKey = `${src}-${tgt}`;

  // Fallback to NLLB-200 only for non-English-to-non-English pairs (e.g., Nepali <-> Hindi)
  const modelName = PAIR_MODELS[pairKey] || "Xenova/nllb-200-distilled-600M";

  if (!loadedPipelines.has(modelName)) {
    const pipe = await pipeline("translation", modelName, {
      dtype: "q8",
      progress_callback: progressCallback,
    });
    loadedPipelines.set(modelName, pipe);
  }
  return { pipe: loadedPipelines.get(modelName), modelName, src, tgt };
}

const NLLB_LANG_MAP = {
  en: "eng_Latn",
  ne: "npi_Deva",
  hi: "hin_Deva",
  es: "spa_Latn",
  fr: "fra_Latn",
};

self.addEventListener("message", async (event) => {
  const { type, seq, socketId, text, sourceLang, targetLang, isInterim } = event.data;

  if (type === "init") {
    self.postMessage({ status: "ready" });
    return;
  }

  try {
    const { pipe, modelName, src, tgt } = await getTranslator(sourceLang, targetLang, (x) => {
      if (x.status === "progress") {
        self.postMessage({ status: "loading", progress: Math.round(x.progress || 0) });
      }
    });

    let output;
    if (modelName === "Xenova/nllb-200-distilled-600M") {
      output = await pipe(text, {
        src_lang: NLLB_LANG_MAP[src] || "eng_Latn",
        tgt_lang: NLLB_LANG_MAP[tgt] || "eng_Latn",
        max_new_tokens: 128,
      });
    } else {
      // opus-mt-en-mul expects >>nep<< prefix for Nepali
      const inputText = modelName === "Xenova/opus-mt-en-mul" && tgt === "ne"
        ? `>>nep<< ${text}`
        : text;
      output = await pipe(inputText, { max_new_tokens: 128 });
    }

    self.postMessage({
      status: "complete",
      seq,
      socketId,
      sourceLang,
      targetLang,
      originalText: text,
      isInterim,
      translatedText: output[0].translation_text,
    });
  } catch (err) {
    console.error("Worker translation error:", err);
    self.postMessage({
      status: "error",
      seq,
      socketId,
      isInterim,
      error: err.message,
    });
  }
});