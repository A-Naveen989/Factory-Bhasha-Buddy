
import type { ComplaintCategory } from '@/lib/types';

// --------------------------------------------------
// SENTENCE PROCESSING
// --------------------------------------------------

const SENTENCE_BREAK = /(?<=[.!?।॥])\s+|\r?\n+/u;

/**
 * Splits text into individual sentences.
 * Supports English and common Indian punctuation.
 */
export function splitSentences(text: string): string[] {
  if (!text || !text.trim()) {
    return [];
  }

  return text
    .trim()
    .split(SENTENCE_BREAK)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

// --------------------------------------------------
// NOTICE KEY POINTS
// --------------------------------------------------

/**
 * Generates up to three concise key points.
 * Each point is limited to ten whitespace-separated words.
 */
export function buildKeyPoints(fullText: string): string[] {
  return splitSentences(fullText)
    .slice(0, 3)
    .map((sentence) => {
      const words = sentence.split(/\s+/);

      return words.length > 10
        ? `${words.slice(0, 10).join(' ')}...`
        : sentence;
    });
}

// --------------------------------------------------
// NOTICE VOICE SCRIPT
// --------------------------------------------------

/**
 * Generates a voice-friendly script using the first
 * three sentences of the original notice.
 */
export function buildVoiceScript(fullText: string): string {
  return splitSentences(fullText)
    .slice(0, 3)
    .join(' ');
}

// --------------------------------------------------
// COMPLAINT CATEGORY LABELS
// --------------------------------------------------

const CATEGORY_LABEL: Record<ComplaintCategory, string> = {
  unsafe: 'an unsafe condition',
  unpaid_salary: 'unpaid salary',
  harassment: 'harassment',
  other: 'a problem',
};

// --------------------------------------------------
// LOCATION DETECTION
// --------------------------------------------------

/**
 * Detects commonly mentioned factory locations.
 *
 * Supports English, Hindi, Tamil and Telugu.
 * This is keyword extraction, not full location understanding.
 */
const LOCATION_PATTERN =
  /\b(?:production\s+line|assembly\s+line|machine|machines|line|gate|packing|assembly|cutting|cleaning|bay|hall|floor)\s*(?:[-#:]\s*)?\d*|(?:मशीन|लाइन|गेट|पैकिंग|असेंबली|कटिंग|सफाई|फर्श|மெஷின்|இயந்திரம்|இயந்திர|லைன்|வாயில்|பேக்கிங்|அசெம்ப்ளி|வெட்டு|சுத்தம்|தரை|మెషీన్|యంత్రం|లైన్|గేట్|ప్యాకింగ్|అసెంబ్లీ|కటింగ్|శుభ్రత|నేల)\s*(?:[-#:]\s*)?\d*/iu;

// --------------------------------------------------
// DURATION DETECTION
// --------------------------------------------------

/**
 * Detects commonly mentioned time durations.
 * Supports English, Hindi, Tamil and Telugu.
 */
const DURATION_PATTERN =
  /[0-9०-९௦-௯౦-౯]+\s*(?:hours?|hrs?|days?|weeks?|months?|घंटा|घंटे|घंटों|दिन|हफ्ता|हफ्ते|सप्ताह|महीना|महीने|மணி|மணிநேரம்|நாள்|நாட்கள்|வாரம்|வாரங்கள்|மாதம்|மாதங்கள்|గంట|గంటలు|రోజు|రోజులు|వారం|వారాలు|నెల|నెలలు)/iu;

// --------------------------------------------------
// COMPLAINT SUMMARY
// --------------------------------------------------

/**
 * Extracts an approximate location and duration from
 * the worker's original complaint.
 *
 * The resulting summary is written in English for
 * internal reporting purposes.
 */
export function buildComplaintSummary(
  category: ComplaintCategory,
  rawText: string
): string {
  const details = rawText?.trim() ?? '';

  // Identify the reported factory location.
  const location =
    details.match(LOCATION_PATTERN)?.[0]?.trim() ??
    'not mentioned';

  // Identify how long the issue has existed.
  const duration =
    details.match(DURATION_PATTERN)?.[0]?.trim() ??
    'not mentioned';

  // Resolve the complaint category.
  const categoryLabel =
    CATEGORY_LABEL[category] ?? 'a problem';

  // Handle an empty complaint description.
  const description =
    details || 'No description provided.';

  return (
    `Worker reports ${categoryLabel}. ` +
    `Location: ${location}. ` +
    `Duration: ${duration}. ` +
    `Details: ${description}`
  );
}
