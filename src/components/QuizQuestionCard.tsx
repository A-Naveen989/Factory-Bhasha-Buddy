
import { useEffect, useId, useState } from 'react';

import {
  Volume2,
  ImageOff,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

import { t } from '@/lib/i18n';
import { speakText, stopSpeaking } from '@/lib/speech';

import type {
  Language,
  QuizQuestion,
} from '@/lib/types';

// --------------------------------------------------
// COMPONENT PROPS
// --------------------------------------------------

interface QuizQuestionCardProps {
  question: QuizQuestion;
  language: Language;
  prompt: string;
  answered: boolean;
  chosen: 0 | 1 | null;
  onChoose: (option: 0 | 1) => void;
}

// --------------------------------------------------
// QUIZ OPTIONS
// --------------------------------------------------

const OPTIONS = [0, 1] as const;
const LETTERS = ['A', 'B'] as const;

// --------------------------------------------------
// QUIZ QUESTION CARD
// --------------------------------------------------

export function QuizQuestionCard({
  question,
  language,
  prompt,
  answered,
  chosen,
  onChoose,
}: QuizQuestionCardProps) {
  const promptId = useId();

  const images = [
    question.image_a_url,
    question.image_b_url,
  ];

  // Track images that fail to load.
  const [failedImages, setFailedImages] = useState<
    Set<0 | 1>
  >(() => new Set());

  // Reset image errors when the question changes.
  useEffect(() => {
    setFailedImages(new Set());
  }, [question.id]);

  // --------------------------------------------------
  // AUTOMATIC QUESTION SPEECH
  // --------------------------------------------------

  useEffect(() => {
    if (!prompt.trim()) {
      return;
    }

    speakText(prompt, language);

    // Stop speech when the question changes or component unmounts.
    return () => {
      stopSpeaking();
    };
  }, [prompt, language]);

  // --------------------------------------------------
  // REPLAY QUESTION
  // --------------------------------------------------

  function handleReplay(): void {
    if (prompt.trim()) {
      speakText(prompt, language);
    }
  }

  // --------------------------------------------------
  // IMAGE ERROR HANDLING
  // --------------------------------------------------

  function handleImageError(option: 0 | 1): void {
    setFailedImages((previous) => {
      const updated = new Set(previous);
      updated.add(option);
      return updated;
    });
  }

  // --------------------------------------------------
  // OPTION STYLING
  // --------------------------------------------------

  function getOptionStyles(
    option: 0 | 1
  ): string {
    const isCorrect =
      option === question.correct_option;

    const isChosen =
      chosen === option;

    if (answered && isCorrect) {
      return `
        border-success-500
        ring-4 ring-success-100
        bg-success-50
      `;
    }

    if (answered && isChosen && !isCorrect) {
      return `
        border-error-500
        ring-4 ring-error-100
        bg-error-50
      `;
    }

    if (answered) {
      return `
        border-slate-200
        opacity-60
      `;
    }

    return `
      border-slate-200
      hover:border-brand-400
      hover:shadow-md
    `;
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <section
      aria-label={prompt}
      aria-busy={!answered ? false : undefined}
      className="
        animate-fade-up space-y-5
        rounded-3xl border border-slate-200
        bg-white p-4 shadow-sm
        motion-reduce:animate-none
        sm:p-5
      "
    >

      {/* ==========================================
          QUESTION HEADER
      =========================================== */}

      <div className="flex items-start gap-3">

        <div className="min-w-0 flex-1">

          <p
            id={promptId}
            className="
              text-base font-bold
              leading-relaxed text-slate-900
              sm:text-lg
            "
          >
            {prompt}
          </p>

        </div>

        {/* REPLAY QUESTION BUTTON */}

        <button
          type="button"
          onClick={handleReplay}
          disabled={!prompt.trim()}
          aria-label={t(language, 'quizHearAgain')}
          title={t(language, 'quizHearAgain')}
          className="
            flex h-11 w-11 shrink-0
            items-center justify-center
            rounded-full bg-brand-50
            text-brand-800
            transition-colors duration-200
            hover:bg-brand-100
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-brand-600
            focus-visible:ring-offset-2
            active:scale-95
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <Volume2
            className="h-5 w-5"
            aria-hidden="true"
          />
        </button>

      </div>

      {/* ==========================================
          ANSWER INSTRUCTIONS
      =========================================== */}

      {!answered && (
        <p className="text-xs font-medium text-slate-500">
          {t(language, 'quizIntro')}
        </p>
      )}

      {/* ==========================================
          ANSWER OPTIONS
      =========================================== */}

      <div
        role="group"
        aria-labelledby={promptId}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3"
      >

        {OPTIONS.map((option) => {
          const isCorrect =
            option === question.correct_option;

          const isChosen =
            chosen === option;

          const imageFailed =
            failedImages.has(option);

          return (
            <button
              key={option}
              type="button"
              disabled={answered}
              onClick={() => onChoose(option)}
              aria-label={`Option ${LETTERS[option]}`}
              aria-pressed={isChosen}
              aria-describedby={promptId}
              className={`
                group relative
                aspect-square w-full
                overflow-hidden rounded-2xl
                border-2 bg-slate-100
                text-left
                transition-all duration-200
                focus-visible:outline-none
                focus-visible:ring-4
                focus-visible:ring-brand-300
                focus-visible:ring-offset-2
                motion-reduce:transition-none
                disabled:cursor-default
                ${getOptionStyles(option)}
                ${
                  answered
                    ? ''
                    : 'active:scale-[0.98]'
                }
              `}
            >

              {/* ANSWER IMAGE */}

              {!imageFailed && images[option] ? (
                <img
                  src={images[option]}
                  alt=""
                  loading="eager"
                  decoding="async"
                  draggable={false}
                  onError={() =>
                    handleImageError(option)
                  }
                  className="
                    absolute inset-0
                    h-full w-full object-cover
                    transition-transform duration-300
                    group-hover:scale-105
                    group-disabled:scale-100
                    motion-reduce:transform-none
                  "
                />
              ) : (
                /* IMAGE FALLBACK */

                <span
                  className="
                    absolute inset-0
                    flex flex-col items-center
                    justify-center gap-3
                    bg-slate-100 text-slate-400
                  "
                >
                  <ImageOff
                    className="h-10 w-10"
                    aria-hidden="true"
                  />

                  <span className="text-xs font-medium">
                    {LETTERS[option]}
                  </span>
                </span>
              )}

              {/* IMAGE OVERLAY */}

              <span
                className="
                  absolute inset-0
                  bg-gradient-to-b
                  from-black/30
                  via-transparent
                  to-black/20
                  pointer-events-none
                "
                aria-hidden="true"
              />

              {/* OPTION LABEL */}

              <span
                className="
                  absolute left-3 top-3
                  flex h-9 w-9
                  items-center justify-center
                  rounded-full
                  bg-slate-900/85
                  text-sm font-bold text-white
                  shadow-md
                "
                aria-hidden="true"
              >
                {LETTERS[option]}
              </span>

              {/* CORRECT ANSWER INDICATOR */}

              {answered && isCorrect && (
                <span
                  className="
                    absolute bottom-3 right-3
                    flex h-10 w-10
                    items-center justify-center
                    rounded-full bg-success-600
                    text-white shadow-lg
                  "
                  aria-label={t(language, 'quizCorrect')}
                >
                  <CheckCircle2
                    className="h-6 w-6"
                    aria-hidden="true"
                  />
                </span>
              )}

              {/* INCORRECT SELECTION INDICATOR */}

              {answered && isChosen && !isCorrect && (
                <span
                  className="
                    absolute bottom-3 right-3
                    flex h-10 w-10
                    items-center justify-center
                    rounded-full bg-error-600
                    text-white shadow-lg
                  "
                  aria-label={t(language, 'quizWrong')}
                >
                  <XCircle
                    className="h-6 w-6"
                    aria-hidden="true"
                  />
                </span>
              )}

            </button>
          );
        })}

      </div>

      {/* ==========================================
          ANSWER RESULT
      =========================================== */}

      {answered && chosen !== null && (
        <div
          role="status"
          aria-live="polite"
          className={`
            flex items-start gap-3
            rounded-2xl border p-4
            ${
              chosen === question.correct_option
                ? 'border-success-200 bg-success-50 text-success-800'
                : 'border-error-200 bg-error-50 text-error-800'
            }
          `}
        >
          {chosen === question.correct_option ? (
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
          ) : (
            <XCircle
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
          )}

          <p className="text-sm font-semibold leading-6">
            {t(
              language,
              chosen === question.correct_option
                ? 'quizCorrect'
                : 'quizWrong'
            )}
          </p>
        </div>
      )}

    </section>
  );
}
