
import { ChevronRight, Megaphone } from 'lucide-react';

import { t } from '@/lib/i18n';
import {
  CATEGORY_KEYS,
  resolveNoticeTranslation,
} from '@/lib/notices';

import type { Language, Notice } from '@/lib/types';

// --------------------------------------------------
// COMPONENT PROPS
// --------------------------------------------------

interface NoticeCardProps {
  notice: Notice;
  language: Language;
  onOpen: () => void;
}

// --------------------------------------------------
// NOTICE CARD
// --------------------------------------------------

export function NoticeCard({
  notice,
  language,
  onOpen,
}: NoticeCardProps) {
  // Resolve notice content in the selected language.
  const resolved = resolveNoticeTranslation(notice, language);

  // Get the localized notice category.
  const categoryLabel = t(
    language,
    CATEGORY_KEYS[notice.category]
  );

  // Use key points first, then fall back to the voice script.
  const preview =
    resolved.keyPoints.find((point) => point.trim()) ||
    resolved.voiceScript ||
    notice.full_text ||
    '';

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${notice.title}. ${categoryLabel}`}
      className="
        group flex w-full min-w-0 items-center gap-3
        rounded-2xl border border-slate-200
        bg-white p-4 text-left shadow-sm
        transition-all duration-200
        hover:-translate-y-0.5
        hover:border-brand-300
        hover:shadow-md
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-brand-600
        focus-visible:ring-offset-2
        active:scale-[0.99]
        motion-reduce:transform-none
        motion-reduce:transition-none
        sm:gap-4 sm:rounded-3xl sm:p-5
      "
    >
      {/* NOTICE ICON */}

      <span
        className="
          flex h-11 w-11 shrink-0
          items-center justify-center
          rounded-xl bg-brand-50
          text-brand-700
          transition-colors duration-200
          group-hover:bg-brand-100
          sm:h-12 sm:w-12
        "
        aria-hidden="true"
      >
        <Megaphone className="h-5 w-5 sm:h-6 sm:w-6" />
      </span>

      {/* NOTICE CONTENT */}

      <span className="min-w-0 flex-1 space-y-2">

        {/* CATEGORY */}

        <span className="flex items-center gap-2">
          <span
            className="
              inline-flex max-w-full items-center
              truncate rounded-full
              bg-accent-100 px-2.5 py-1
              text-xs font-bold uppercase
              tracking-wide text-accent-800
            "
          >
            {categoryLabel}
          </span>

          {/* TRANSLATION FALLBACK INDICATOR */}

          {resolved.isFallback && language !== 'en' && (
            <span className="shrink-0 text-xs text-slate-400">
              English
            </span>
          )}
        </span>

        {/* NOTICE TITLE */}

        <span
          className="
            block truncate text-sm
            font-bold leading-6 text-slate-900
            transition-colors
            group-hover:text-brand-800
            sm:text-base
          "
        >
          {notice.title}
        </span>

        {/* NOTICE PREVIEW */}

        {preview && (
          <span
            className="
              block overflow-hidden text-ellipsis
              text-sm leading-5 text-slate-500
            "
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {preview}
          </span>
        )}

      </span>

      {/* NAVIGATION ICON */}

      <span
        className="
          flex h-9 w-9 shrink-0
          items-center justify-center
          rounded-full text-slate-400
          transition-all duration-200
          group-hover:translate-x-1
          group-hover:bg-brand-50
          group-hover:text-brand-700
        "
        aria-hidden="true"
      >
        <ChevronRight className="h-5 w-5" />
      </span>
    </button>
  );
}
