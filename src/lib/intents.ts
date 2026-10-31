
import type { Intent } from '@/lib/types';

// --------------------------------------------------
// INTENT KEYWORDS
// Order determines priority when multiple intents match.
// --------------------------------------------------

const INTENT_KEYWORDS: ReadonlyArray<
  readonly [Intent, readonly string[]]
> = [
  [
    'COMPLAINT',
    [
      'complain',
      'complaint',
      'complaints',
      'problem',
      'problems',
      'harass',
      'harassment',
      'unpaid',
      'not paid',
      'salary not paid',
      'shikayat',
      'fariyad',
      'शिकायत',
      'समस्या',
      'समस्याएं',
      'புகார்',
      'பிரச்சனை',
      'பிரச்சினை',
      'ఫిర్యాదు',
      'సమస్య',
      'సమస్యలు',
    ],
  ],
  [
    'SHIFT_INFO',
    [
      'shift',
      'shifts',
      'timing',
      'timings',
      'schedule',
      'schedules',
      'duty',
      'working hours',
      'baje',
      'kitne',
      'ivala',
      'innaiku',
      'irukka',
      'eppudu',
      'ஷிஃப்ட்',
      'ஷிப்ட்',
      'நேரம்',
      'நேரங்கள்',
      'வேலை நேரம்',
      'షిఫ్ట్',
      'సమయం',
      'పని సమయం',
      'शिफ्ट',
      'समय',
      'बजे',
      'ड्यूटी',
    ],
  ],
  [
    'SAFETY_INFO',
    [
      'safety',
      'safe',
      'helmet',
      'helmets',
      'gloves',
      'goggles',
      'fire',
      'exit',
      'ppe',
      'machine',
      'machines',
      'rule',
      'rules',
      'danger',
      'dangerous',
      'accident',
      'accidents',
      'emergency',
      'suraksh',
      'bhadrata',
      'பாதுகாப்',
      'பாதுகாப்பு',
      'பாதுகாப்பு விதி',
      'సురక్ష',
      'భద్రత',
      'ప్రమాదం',
      'सुरक्षा',
      'नियम',
      'खतरा',
      'दुर्घटना',
      'daggara',
    ],
  ],
  [
    'NOTICE_QUERY',
    [
      'notice',
      'notices',
      'announcement',
      'announcements',
      'circular',
      'circulars',
      'latest update',
      'नोटिस',
      'सूचना',
      'घोषणा',
      'அறிவிப்பு',
      'அறிவிப்புகள்',
      'சுற்றறிக்கை',
      'ప్రకటన',
      'ప్రకటనలు',
      'సూచన',
    ],
  ],
];

// --------------------------------------------------
// SAFETY TOPIC KEYWORDS
// These IDs should match the topic IDs in Supabase.
// --------------------------------------------------

const TOPIC_KEYWORDS: Readonly<
  Record<string, readonly string[]>
> = {
  ppe: [
    'helmet',
    'helmets',
    'gloves',
    'ppe',
    'goggles',
    'mask',
    'masks',
    'protective equipment',
    'हेलमेट',
    'दस्ताने',
    'सुरक्षा उपकरण',
    'தலைக்கவசம்',
    'கையுறை',
    'பாதுகாப்பு கவசம்',
    'ஹெல்மெட்',
    'హెల్మెట్',
    'గ్లౌజ్',
    'రక్షణ పరికరాలు',
  ],

  'fire-exit': [
    'fire',
    'fire exit',
    'fire safety',
    'exit',
    'fire extinguisher',
    'फायर',
    'आग',
    'आग से सुरक्षा',
    'தீ',
    'தீயணைப்பு',
    'வெளியேறும் வழி',
    'மீ',
    'మంట',
    'ఫైర్',
    'అగ్ని ప్రమాదం',
    'అగ్నిమాపక',
  ],

  'machine-safety': [
    'machine',
    'machines',
    'machinery',
    'cutting',
    'goggles',
    'machine safety',
    'मशीन',
    'मशीन सुरक्षा',
    'चश्मा',
    'இயந்திர',
    'மெஷின்',
    'கண்ணாடி',
    'இயந்திர பாதுகாப்பு',
    'మెషీన్',
    'మెషిన్',
    'కటింగ్',
    'గాగుల్స్',
    'యంత్ర భద్రత',
  ],

  housekeeping: [
    'oil',
    'spill',
    'slip',
    'floor',
    'wet floor',
    'cleaning',
    'तेल',
    'फर्श',
    'फिसलना',
    'எண்ணெய்',
    'தரை',
    'வழுக்குதல்',
    'నూనె',
    'నేల',
    'జారు',
    'తడి నేల',
  ],
};

// --------------------------------------------------
// NIGHT SHIFT KEYWORDS
// --------------------------------------------------

const NIGHT_WORDS = [
  'night',
  'night shift',
  'raat',
  'raatri',
  'रात',
  'रात की',
  'இரவு',
  'இரவு நேரம்',
  'రాత్రి',
  'రాత్రి షిఫ్ట్',
];

// --------------------------------------------------
// RESULT INTERFACE
// --------------------------------------------------

export interface ClassifiedQuery {
  intent: Intent;
  topicId: string | null;
  wantsNight: boolean;
}

// --------------------------------------------------
// TEXT NORMALIZATION
// --------------------------------------------------

function normalizeText(text: string): string {
  return text
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// --------------------------------------------------
// KEYWORD MATCHING
// --------------------------------------------------

function matchesKeyword(
  normalizedText: string,
  keyword: string
): boolean {
  const normalizedKeyword = normalizeText(keyword);

  if (!normalizedText || !normalizedKeyword) {
    return false;
  }

  // Indic-language keywords can represent partial word forms.
  // Preserve substring matching for these scripts.
  if (/[^\u0000-\u007F]/u.test(normalizedKeyword)) {
    return normalizedText.includes(normalizedKeyword);
  }

  // Match multi-word English and transliterated phrases.
  if (normalizedKeyword.includes(' ')) {
    return ` ${normalizedText} `.includes(
      ` ${normalizedKeyword} `
    );
  }

  // Match individual words and common word variations.
  const words = normalizedText.split(' ');

  return words.some(
    (word) =>
      word === normalizedKeyword ||
      (normalizedKeyword.length >= 5 &&
        word.startsWith(normalizedKeyword))
  );
}

// --------------------------------------------------
// FIND MATCHING KEYWORD
// --------------------------------------------------

function findMatchingIntent(
  normalizedText: string
): Intent | null {
  for (const [intent, keywords] of INTENT_KEYWORDS) {
    const matched = keywords.some((keyword) =>
      matchesKeyword(normalizedText, keyword)
    );

    if (matched) {
      return intent;
    }
  }

  return null;
}

// --------------------------------------------------
// FIND SAFETY TOPIC
// --------------------------------------------------

function findSafetyTopic(
  normalizedText: string
): string | null {
  for (const [topicId, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const matched = keywords.some((keyword) =>
      matchesKeyword(normalizedText, keyword)
    );

    if (matched) {
      return topicId;
    }
  }

  return null;
}

// --------------------------------------------------
// DETECT NIGHT SHIFT REQUEST
// --------------------------------------------------

function detectNightShift(
  normalizedText: string
): boolean {
  return NIGHT_WORDS.some((keyword) =>
    matchesKeyword(normalizedText, keyword)
  );
}

// --------------------------------------------------
// MAIN QUERY CLASSIFIER
// --------------------------------------------------

export function classifyQuery(text: string): ClassifiedQuery {
  const normalizedText = normalizeText(text);

  // Handle empty input.
  if (!normalizedText) {
    return {
      intent: 'OTHER',
      topicId: null,
      wantsNight: false,
    };
  }

  // Identify the requested intent.
  const matchedIntent = findMatchingIntent(normalizedText);

  // Identify a possible safety topic.
  const matchedTopic = findSafetyTopic(normalizedText);

  // A safety topic by itself can indicate a safety question.
  const intent: Intent =
    matchedIntent ??
    (matchedTopic ? 'SAFETY_INFO' : 'OTHER');

  // Only attach a safety topic to safety-related queries.
  const topicId =
    intent === 'SAFETY_INFO' ? matchedTopic : null;

  // Identify whether the worker specifically asks about night duty.
  const wantsNight = detectNightShift(normalizedText);

  return {
    intent,
    topicId,
    wantsNight,
  };
}
