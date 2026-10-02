// A small, fully offline free-text matcher. No LLM, no network call — this
// has to work identically whether the game is opened locally or as an
// artifact, so "understanding" the player's typed question is done with
// weighted keyword/phrase matching against each piece of case content.
//
// Every history question, exam finding and special assessment is
// automatically matchable from the words in its own text/label (see
// deriveKeywords). A handful of entries additionally carry a hand-authored
// `keywords` array to catch the way people actually ask ("tripoding",
// "accessory muscles", "words or sentences"...) when that phrasing doesn't
// naturally share words with the clinical finding text.

import { PRIMARY_SURVEY_STEPS } from "./primarySurvey.js";

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "do", "does", "did", "i", "you", "your", "my", "me", "to", "of", "in", "on", "at",
  "and", "or", "for", "was", "were", "has", "have", "had", "any", "what", "when", "where", "how", "why", "that",
  "this", "it", "he", "she", "they", "them", "his", "her", "their", "as", "with", "about", "if", "please", "can",
  "could", "would", "will", "just", "really", "up", "down", "out", "there", "here", "am", "be", "been", "im",
  "let's", "lets", "going", "look", "looking",
]);

function normalize(s) {
  return String(s)
    .toLowerCase()
    .replace(/['’]/g, "") // "what's" -> "whats" (no stray token from the apostrophe)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function deriveKeywords(text) {
  return Array.from(new Set(normalize(text).split(/\s+/).filter((w) => w.length > 3 && !STOPWORDS.has(w))));
}

function scoreKeywords(inputNorm, keywords) {
  let score = 0;
  for (const kw of keywords) {
    const kwNorm = normalize(kw);
    if (!kwNorm) continue;
    if (inputNorm.includes(kwNorm)) {
      score += kwNorm.includes(" ") ? kwNorm.length + 2 : Math.max(kwNorm.length, 4);
    }
  }
  return score;
}

const TYPE_SYNONYMS = {
  inspect: ["look", "inspect", "see", "observe", "appear", "appearance", "glance"],
  palpate: ["feel", "palpate", "touch", "press", "pulse"],
  auscultate: ["listen", "auscultate", "stethoscope", "hear", "sounds", "chest sounds"],
};

const VITALS_KEYWORDS = [
  "vitals", "vital signs", "obs", "observations", "blood pressure", "spo2", "sats", "saturation", "temperature",
  "resp rate", "respiratory rate", "pulse rate", "heart rate", "get vitals", "check vitals", "partner get",
  "full set of obs", "set of vitals",
];
const BGL_KEYWORDS = ["blood glucose", "bgl", "blood sugar", "glucose level", "sugar level", "glucometer"];

const MIN_SCORE = 4;

export function buildTopics(caseDef, encounter, selectedRegion) {
  const topics = [];

  for (const [id, def] of Object.entries(caseDef.scene || {})) {
    const kw = def.keywords?.length ? def.keywords : deriveKeywords(def.label);
    topics.push({ kind: "scene", id, keywords: kw, run: () => encounter.sceneAssessment(id) });
  }

  for (const step of PRIMARY_SURVEY_STEPS) {
    topics.push({ kind: "primary", id: step.id, keywords: step.keywords, run: () => encounter.primarySurvey(step.id) });
  }

  for (const q of caseDef.history) {
    const kw = q.keywords?.length ? q.keywords : deriveKeywords(q.text);
    topics.push({ kind: "history", id: q.id, label: q.text, keywords: kw, run: () => encounter.askHistory(q.id) });
  }

  for (const [regionId, region] of Object.entries(caseDef.exam)) {
    for (const f of region.findings) {
      const base = f.keywords?.length ? f.keywords : [region.label, ...(TYPE_SYNONYMS[f.type] || []), ...deriveKeywords(f.label)];
      topics.push({
        kind: "exam",
        id: `${regionId}:${f.type}`,
        label: `${f.label} (${region.label})`,
        keywords: base,
        boost: regionId === selectedRegion ? 6 : 0,
        run: () => encounter.examine(regionId, f.type),
      });
    }
  }

  for (const s of caseDef.specialAssessments || []) {
    const kw = s.keywords?.length ? s.keywords : deriveKeywords(s.label);
    topics.push({ kind: "special", id: s.id, label: s.label, keywords: kw, run: () => encounter.performSpecial(s.id) });
  }

  topics.push({ kind: "vitals", id: "take", keywords: VITALS_KEYWORDS, run: () => encounter.takeVitals() });
  topics.push({ kind: "vitals", id: "bgl", keywords: BGL_KEYWORDS, run: () => encounter.checkBGL() });

  return topics;
}

export function matchInput(input, topics) {
  const norm = normalize(input);
  if (!norm) return null;
  let best = null;
  let bestScore = 0;
  for (const t of topics) {
    const base = scoreKeywords(norm, t.keywords);
    // the "selected region" boost only breaks ties between genuinely relevant
    // matches — it must never be enough on its own to win, or focusing a
    // region would hijack unrelated messages (e.g. "get some vitals").
    const s = base > 0 ? base + (t.boost || 0) : 0;
    if (s > bestScore) {
      bestScore = s;
      best = t;
    }
  }
  return bestScore >= MIN_SCORE ? best : null;
}
