
import { LANGUAGES, t } from '@/lib/i18n';
import type { Language } from '@/lib/types';

// --------------------------------------------------
// COMPONENT PROPS
// --------------------------------------------------

interface LanguageSelectorProps {
  value: Language;
  onChange: (language: Language) => void;
}

// --------------------------------------------------
// LANGUAGE SELECTOR
// --------------------------------------------------

export function LanguageSelector({
  value,
  onChange,
}: LanguageSelectorProps) {
  return (
    <div
      role="group"
      aria-label={t(value, 'chooseLanguage')}
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {LANGUAGES.map((language) => {
        const selected = language.code === value;

        return (
          <button
            key={language.code}
            type="button"
            lang={language.speechLocale}
            aria-pressed={selected}
            onClick={() => {
              // Avoid unnecessary updates when already selected.
              if (!selected) {
                onChange(language.code);
              }
            }}
            className={`
              flex min-h-12 w-full items-center justify-center
              rounded-2xl border px-4 py-3
              text-base font-semibold
              transition-colors duration-200
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-brand-600
              focus-visible:ring-offset-2
              active:scale-[0.98]
              motion-reduce:transition-none
              motion-reduce:active:transform-none
              ${
                selected
                  ? 'border-brand-700 bg-brand-700 text-white shadow-md'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-brand-400 hover:bg-brand-50'
              }
            `}
          >
            {language.label}
          </button>
        );
      })}
    </div>
  );
}
