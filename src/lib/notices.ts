
import type {
  Language,
  Notice,
  NoticeCategory,
  NoticeTranslation,
} from '@/lib/types';

// --------------------------------------------------
// RESOLVED NOTICE INTERFACE
// --------------------------------------------------

export interface ResolvedNotice {
  voiceScript: string;
  keyPoints: string[];
  isFallback: boolean;
}

// --------------------------------------------------
// HELPER: NORMALIZE TEXT
// --------------------------------------------------

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

// --------------------------------------------------
// HELPER: FIND NOTICE TRANSLATION
// --------------------------------------------------

function findTranslation(
  translations: NoticeTranslation[],
  language: Language
): NoticeTranslation | undefined {
  return translations.find(
    (item) => item.language === language
  );
}

// --------------------------------------------------
// HELPER: CLEAN KEY POINTS
// --------------------------------------------------

function cleanKeyPoints(
  points: string[] | null | undefined
): string[] {
  if (!Array.isArray(points)) {
    return [];
  }

  return points
    .map((point) => normalizeText(point))
    .filter(Boolean);
}

// --------------------------------------------------
// RESOLVE NOTICE TRANSLATION
// --------------------------------------------------

export function resolveNoticeTranslation(
  notice: Notice,
  language: Language
): ResolvedNotice {
  // Safely retrieve available translations.
  const translations = Array.isArray(notice.notice_translations)
    ? notice.notice_translations
    : [];

  // Find the requested language translation.
  const exact = findTranslation(translations, language);

  // Find the English translation as a fallback.
  const english = findTranslation(translations, 'en');

  // Extract available voice scripts.
  const exactScript = normalizeText(exact?.voice_script);
  const englishScript = normalizeText(english?.voice_script);
  const originalText = normalizeText(notice.full_text);

  // Select the best available voice script.
  const voiceScript =
    exactScript ||
    englishScript ||
    originalText ||
    normalizeText(notice.title);

  // Select key points from the requested translation.
  const exactKeyPoints = cleanKeyPoints(exact?.key_points);

  // Fall back to English key points when necessary.
  const englishKeyPoints = cleanKeyPoints(english?.key_points);

  const keyPoints =
    exactKeyPoints.length > 0
      ? exactKeyPoints
      : englishKeyPoints;

  // Determine whether non-English content required fallback.
  const hasRequestedContent =
    Boolean(exactScript) || exactKeyPoints.length > 0;

  const isFallback =
    language !== 'en' &&
    !hasRequestedContent;

  return {
    voiceScript,
    keyPoints,
    isFallback,
  };
}

// --------------------------------------------------
// NOTICE CATEGORY TRANSLATION KEYS
// --------------------------------------------------

export const CATEGORY_KEYS: Record<
  NoticeCategory,
  'catGeneral' | 'catSafety' | 'catPayroll' | 'catPolicy'
> = {
  general: 'catGeneral',
  safety: 'catSafety',
  payroll: 'catPayroll',
  policy: 'catPolicy',
};
