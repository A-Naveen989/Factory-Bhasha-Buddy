
import { classifyQuery } from '@/lib/intents';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';

import type {
  Language,
  LocalizedText,
  Notice,
  Result,
  SafetyTopic,
  Shift,
  Worker,
} from '@/lib/types';

export interface AskAnswer {
  title: string;
  text: string;
  spoken: string;
}

// --------------------------------------------------
// Helper: Create a successful answer
// --------------------------------------------------

function createAnswer(
  title: string,
  text: string,
  spoken: string = text
): Result<AskAnswer> {
  return {
    ok: true,
    data: {
      title,
      text,
      spoken,
    },
  };
}

// --------------------------------------------------
// Helper: Extract localized text with English fallback
// --------------------------------------------------

function pickText(
  localized: LocalizedText | null | undefined,
  language: Language
): string | null {
  if (!localized) {
    return null;
  }

  const translatedText = localized[language]?.trim();

  if (translatedText) {
    return translatedText;
  }

  const englishText = localized.en?.trim();

  return englishText || null;
}

// --------------------------------------------------
// Helper: Handle unexpected errors
// --------------------------------------------------

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred while processing your question.';
}

// --------------------------------------------------
// 1. Build Shift Information Answer
// --------------------------------------------------

async function buildShiftAnswer(
  worker: Worker,
  language: Language,
  wantsNight: boolean
): Promise<Result<AskAnswer>> {
  const title = t(language, 'answer');

  // Check whether the worker has selected a department.
  if (!worker.department_id) {
    const message = t(language, 'pickDepartment');

    return createAnswer(title, message);
  }

  const shiftType = wantsNight ? 'night' : 'day';

  // Retrieve the shift assigned to the worker's department.
  const { data, error } = await supabase
    .from('shifts')
    .select(
      'id, department_id, shift_type, start_time, end_time, location'
    )
    .eq('department_id', worker.department_id)
    .eq('shift_type', shiftType)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  if (!data) {
    const message = t(language, 'noShift');

    return createAnswer(title, message);
  }

  const shift = data as unknown as Shift;

  // Generate a localized shift response.
  const shiftLabel = t(
    language,
    shiftType === 'night' ? 'nightShift' : 'dayShift'
  );

  const message = t(language, 'shiftAnswer', {
    shift: shiftLabel,
    start: shift.start_time,
    end: shift.end_time,
    location: shift.location,
  });

  return createAnswer(title, message);
}

// --------------------------------------------------
// 2. Build Safety Information Answer
// --------------------------------------------------

async function buildSafetyAnswer(
  topicId: string | null,
  language: Language
): Promise<Result<AskAnswer>> {
  // Retrieve available safety topics.
  const { data, error } = await supabase
    .from('safety_topics')
    .select('id, name, guidance');

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  const topics = (data ?? []) as unknown as SafetyTopic[];

  // Filter by the identified topic when available.
  const filteredTopics = topics.filter(
    (topic) => !topicId || topic.id === topicId
  );

  // Extract guidance in the worker's preferred language.
  const lines = filteredTopics
    .map((topic) => pickText(topic.guidance, language))
    .filter((line): line is string => Boolean(line));

  // Handle unavailable safety information.
  if (lines.length === 0) {
    const message = t(language, 'notUnderstood');

    return createAnswer(
      t(language, 'safetyAnswerTitle'),
      message
    );
  }

  // Display separate guidance items clearly.
  const text = lines.join('\n');
  const spoken = lines.join(' ');

  return createAnswer(
    t(language, 'safetyAnswerTitle'),
    text,
    spoken
  );
}

// --------------------------------------------------
// 3. Build Factory Notice Answer
// --------------------------------------------------

async function buildNoticeAnswer(
  language: Language
): Promise<Result<AskAnswer>> {
  // Retrieve the latest available notice.
  const { data, error } = await supabase
    .from('notices')
    .select(
      `
        id,
        title,
        category,
        department_id,
        topic_id,
        full_text,
        created_at,
        notice_translations (
          notice_id,
          language,
          voice_script,
          key_points
        )
      `
    )
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  // Handle the situation where no notices exist.
  if (!data) {
    const message = t(language, 'noNotices');

    return createAnswer(
      t(language, 'noticesTitle'),
      message
    );
  }

  const notice = data as unknown as Notice;

  const translations = notice.notice_translations ?? [];

  // Prefer the requested language.
  const requestedTranslation = translations.find(
    (item) => item.language === language
  );

  // Fall back to English when a translation is unavailable.
  const englishTranslation = translations.find(
    (item) => item.language === 'en'
  );

  const requestedScript =
    requestedTranslation?.voice_script?.trim();

  const englishScript =
    englishTranslation?.voice_script?.trim();

  // Determine the best available notice content.
  const body =
    requestedScript ||
    englishScript ||
    notice.full_text?.trim() ||
    notice.title;

  // Inform workers when the requested translation is unavailable.
  const usingFallback =
    language !== 'en' && !requestedScript;

  const fallbackMessage = usingFallback
    ? t(language, 'noticeNotTranslated')
    : '';

  const text = [
    t(language, 'noticeAnswer'),
    fallbackMessage,
    body,
  ]
    .filter(Boolean)
    .join('\n');

  const spoken = [
    fallbackMessage,
    body,
  ]
    .filter(Boolean)
    .join(' ');

  return createAnswer(
    notice.title,
    text,
    spoken
  );
}

// --------------------------------------------------
// 4. Main Question Answering Function
// --------------------------------------------------

export async function buildAskAnswer(
  query: string,
  worker: Worker
): Promise<Result<AskAnswer>> {
  const language = worker.language;

  try {
    // Validate the incoming question.
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      const message = t(language, 'notUnderstood');

      return createAnswer(
        t(language, 'answer'),
        message
      );
    }

    // Identify the user's intention.
    const classified = classifyQuery(normalizedQuery);

    // Generate the appropriate response.
    switch (classified.intent) {
      case 'SHIFT_INFO': {
        return await buildShiftAnswer(
          worker,
          language,
          classified.wantsNight
        );
      }

      case 'SAFETY_INFO': {
        return await buildSafetyAnswer(
          classified.topicId,
          language
        );
      }

      case 'NOTICE_QUERY': {
        return await buildNoticeAnswer(language);
      }

      case 'COMPLAINT': {
        const message = t(language, 'reportIntro');

        return createAnswer(
          t(language, 'navReport'),
          message
        );
      }

      case 'OTHER':
      default: {
        const message = t(language, 'notUnderstood');

        return createAnswer(
          t(language, 'answer'),
          message
        );
      }
    }
  } catch (error) {
    // Handle unexpected database, network or processing errors.
    return {
      ok: false,
      error: getErrorMessage(error),
    };
  }
}
