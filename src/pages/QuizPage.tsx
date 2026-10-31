
import { useEffect, useRef, useState } from 'react';

import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  Trophy,
  XCircle,
} from 'lucide-react';

import { QuizQuestionCard } from '@/components/QuizQuestionCard';
import { useWorker } from '@/hooks/useWorker';

import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

import type { QuizQuestion } from '@/lib/types';

// --------------------------------------------------
// LOAD STATE
// --------------------------------------------------

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; questions: QuizQuestion[] };

// --------------------------------------------------
// QUIZ PHASE
// --------------------------------------------------

type QuizPhase =
  | { kind: 'intro' }
  | {
      kind: 'question';
      index: number;
      answered: boolean;
      chosen: 0 | 1 | null;
    }
  | { kind: 'result' };

// --------------------------------------------------
// HELPER: ERROR MESSAGE
// --------------------------------------------------

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to load quiz questions. Please try again.';
}

// --------------------------------------------------
// HELPER: LOCALIZED CONTENT
// --------------------------------------------------

function getLocalizedText(
  translations: Record<string, string>,
  language: string
): string {
  const selected = translations?.[language]?.trim();

  if (selected) {
    return selected;
  }

  return translations?.en?.trim() ?? '';
}

// --------------------------------------------------
// QUIZ PAGE
// --------------------------------------------------

export function QuizPage() {
  const { worker } = useWorker();

  const language = worker.language;

  // ------------------------------------------------
  // STATE
  // ------------------------------------------------

  const [load, setLoad] = useState<LoadState>({
    status: 'loading',
  });

  const [phase, setPhase] = useState<QuizPhase>({
    kind: 'intro',
  });

  const [score, setScore] = useState(0);

  const [saveFailed, setSaveFailed] = useState(false);

  const [savingAttempt, setSavingAttempt] = useState(false);

  const [retryCount, setRetryCount] = useState(0);

  // ------------------------------------------------
  // REFS
  // ------------------------------------------------

  // Prevent duplicate answer submissions.
  const answerLockRef = useRef(false);

  // Protect against state updates after unmounting.
  const mountedRef = useRef(true);

  // ------------------------------------------------
  // COMPONENT LIFECYCLE
  // ------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ------------------------------------------------
  // LOAD QUIZ QUESTIONS
  // ------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadQuestions() {
      setLoad({ status: 'loading' });

      try {
        const { data, error } = await supabase
          .from('quiz_questions')
          .select(
            'id, topic_id, image_a_url, image_b_url, correct_option, prompt, explanation, sort_order'
          )
          .order('sort_order', { ascending: true });

        if (error) {
          throw new Error(error.message);
        }

        if (!data) {
          throw new Error('Quiz questions could not be retrieved.');
        }

        if (cancelled) {
          return;
        }

        setLoad({
          status: 'ready',
          questions: data as QuizQuestion[],
        });
      } catch (error) {
        console.error(
          'Failed to load quiz questions:',
          error
        );

        if (!cancelled) {
          setLoad({
            status: 'error',
            message: getErrorMessage(error),
          });
        }
      }
    }

    void loadQuestions();

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  // ------------------------------------------------
  // RETRY QUESTION LOADING
  // ------------------------------------------------

  function retryLoading(): void {
    setRetryCount((current) => current + 1);
  }

  // ------------------------------------------------
  // START QUIZ
  // ------------------------------------------------

  function startQuiz(): void {
    if (load.status !== 'ready' || !load.questions.length) {
      return;
    }

    answerLockRef.current = false;

    setScore(0);
    setSaveFailed(false);
    setSavingAttempt(false);

    setPhase({
      kind: 'question',
      index: 0,
      answered: false,
      chosen: null,
    });
  }

  // ------------------------------------------------
  // SUBMIT ANSWER
  // ------------------------------------------------

  async function answer(
    question: QuizQuestion,
    chosen: 0 | 1
  ): Promise<void> {
    // Prevent repeated or invalid submissions.
    if (
      answerLockRef.current ||
      !mountedRef.current ||
      phase.kind !== 'question' ||
      phase.answered
    ) {
      return;
    }

    answerLockRef.current = true;

    const isCorrect =
      chosen === question.correct_option;

    // Update the local score immediately.
    // The score represents the worker's actual answers,
    // even if the database is temporarily unavailable.
    if (isCorrect) {
      setScore((current) => current + 1);
    }

    // Lock the current question.
    setPhase((current) => {
      if (
        current.kind !== 'question' ||
        current.answered
      ) {
        return current;
      }

      return {
        ...current,
        answered: true,
        chosen,
      };
    });

    setSavingAttempt(true);

    try {
      // Save the quiz attempt.
      const { error } = await supabase
        .from('quiz_attempts')
        .insert({
          worker_id: worker.id,
          question_id: question.id,
          chosen_option: chosen,
          is_correct: isCorrect,
          language,
        });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error(
        'Failed to save quiz attempt:',
        error
      );

      if (mountedRef.current) {
        setSaveFailed(true);
      }
    } finally {
      answerLockRef.current = false;

      if (mountedRef.current) {
        setSavingAttempt(false);
      }
    }
  }

  // ------------------------------------------------
  // MOVE TO NEXT QUESTION
  // ------------------------------------------------

  function nextQuestion(): void {
    // Do not proceed before the current attempt
    // has finished saving.
    if (savingAttempt || phase.kind !== 'question') {
      return;
    }

    const nextIndex = phase.index + 1;

    if (
      load.status !== 'ready' ||
      nextIndex >= load.questions.length
    ) {
      setPhase({ kind: 'result' });
      return;
    }

    setPhase({
      kind: 'question',
      index: nextIndex,
      answered: false,
      chosen: null,
    });
  }

  // ------------------------------------------------
  // LOADING STATE
  // ------------------------------------------------

  if (load.status === 'loading') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="
          flex min-h-[50vh]
          flex-col items-center
          justify-center gap-4
        "
      >
        <LoaderCircle
          className="h-10 w-10 animate-spin text-brand-700"
          aria-hidden="true"
        />

        <p className="text-sm font-medium text-slate-500">
          {t(language, 'loading')}
        </p>
      </div>
    );
  }

  // ------------------------------------------------
  // ERROR STATE
  // ------------------------------------------------

  if (load.status === 'error') {
    return (
      <section className="
        flex min-h-[50vh]
        flex-col items-center
        justify-center
      ">
        <div className="
          w-full max-w-md
          rounded-3xl border
          border-slate-200
          bg-white p-6
          text-center shadow-sm
        ">

          <div className="
            mx-auto mb-4
            flex h-14 w-14
            items-center justify-center
            rounded-full bg-rose-50
          ">
            <AlertCircle
              className="h-7 w-7 text-rose-600"
              aria-hidden="true"
            />
          </div>

          <h2 className="text-lg font-bold text-slate-900">
            Unable to load quiz
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {t(language, 'connectError')}
          </p>

          <p className="mt-2 break-words text-xs text-slate-400">
            {load.message}
          </p>

          <button
            type="button"
            onClick={retryLoading}
            className="
              mt-6 flex min-h-12
              w-full items-center
              justify-center gap-2
              rounded-xl bg-brand-700
              px-5 py-3 text-sm
              font-bold text-white
              transition-colors
              hover:bg-brand-800
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-brand-600
              focus-visible:ring-offset-2
            "
          >
            <RefreshCw
              className="h-4 w-4"
              aria-hidden="true"
            />

            {t(language, 'retry')}
          </button>

        </div>
      </section>
    );
  }

  // ------------------------------------------------
  // EMPTY QUESTION STATE
  // ------------------------------------------------

  const { questions } = load;

  if (questions.length === 0) {
    return (
      <div className="
        flex flex-col items-center
        justify-center rounded-3xl
        border border-dashed
        border-slate-300 bg-white
        px-6 py-12 text-center
      ">
        <AlertCircle
          className="mb-4 h-10 w-10 text-slate-400"
          aria-hidden="true"
        />

        <p className="text-sm leading-6 text-slate-500">
          {t(language, 'quizNoQuestions')}
        </p>

        <button
          type="button"
          onClick={retryLoading}
          className="
            mt-5 text-sm
            font-bold text-brand-700
            underline underline-offset-4
          "
        >
          {t(language, 'retry')}
        </button>
      </div>
    );
  }

  // ------------------------------------------------
  // INTRO SCREEN
  // ------------------------------------------------

  if (phase.kind === 'intro') {
    return (
      <div className="
        animate-fade-up space-y-6
      ">

        <header className="space-y-3">

          <span className="
            inline-flex h-12 w-12
            items-center justify-center
            rounded-2xl bg-success-100
            text-success-800
          ">
            <Trophy
              className="h-6 w-6"
              aria-hidden="true"
            />
          </span>

          <h1 className="
            text-2xl font-bold
            leading-tight text-slate-900
            sm:text-3xl
          ">
            {t(language, 'quizTitle')}
          </h1>

          <p className="
            text-sm leading-7 text-slate-600
          ">
            {t(language, 'quizIntro')}
          </p>

        </header>

        <div className="
          rounded-2xl border
          border-slate-200 bg-white
          p-5 shadow-sm
        ">
          <p className="text-sm font-semibold text-slate-700">
            Quiz information
          </p>

          <div className="
            mt-4 grid grid-cols-2
            gap-3
          ">
            <div className="
              rounded-xl bg-slate-50 p-4
            ">
              <p className="text-xs text-slate-500">
                Questions
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {questions.length}
              </p>
            </div>

            <div className="
              rounded-xl bg-slate-50 p-4
            ">
              <p className="text-xs text-slate-500">
                Language
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {language.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={startQuiz}
          className="
            flex min-h-14 w-full
            items-center justify-center
            rounded-2xl bg-brand-700
            px-5 py-4 text-lg font-bold
            text-white shadow-md
            transition-colors
            hover:bg-brand-800
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-brand-600
            focus-visible:ring-offset-2
            active:scale-[0.98]
          "
        >
          {t(language, 'quizStart')}
        </button>

      </div>
    );
  }

  // ------------------------------------------------
  // RESULT SCREEN
  // ------------------------------------------------

  if (phase.kind === 'result') {
    const isPerfect =
      score === questions.length;

    const percentage = Math.round(
      (score / questions.length) * 100
    );

    return (
      <div className="
        animate-fade-up
        space-y-6 rounded-3xl
        border border-slate-200
        bg-white p-6 shadow-sm
      ">

        {/* RESULT ICON */}

        <div className={`
          mx-auto flex h-20 w-20
          items-center justify-center
          rounded-full
          ${
            isPerfect
              ? 'bg-success-100 text-success-700'
              : 'bg-brand-100 text-brand-800'
          }
        `}>
          {isPerfect ? (
            <Trophy
              className="h-10 w-10"
              aria-hidden="true"
            />
          ) : (
            <CheckCircle2
              className="h-10 w-10"
              aria-hidden="true"
            />
          )}
        </div>

        {/* RESULT TITLE */}

        <div className="space-y-2 text-center">

          <h1 className="text-xl font-bold text-slate-900">
            {t(language, 'quizFinish')}
          </h1>

          <p className="
            text-base font-semibold
            leading-relaxed text-slate-700
          ">
            {t(language, 'quizScore', {
              correct: score,
              total: questions.length,
            })}
          </p>

        </div>

        {/* SCORE SUMMARY */}

        <div className="
          rounded-2xl bg-slate-50
          p-5 text-center
        ">

          <p className="text-4xl font-extrabold text-brand-800">
            {percentage}%
          </p>

          <p className="mt-1 text-xs font-medium text-slate-500">
            Overall accuracy
          </p>

          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-label="Quiz score"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="
                h-full rounded-full
                bg-brand-600
                transition-all duration-500
              "
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="
            mt-4 flex justify-center
            gap-6 text-sm
          ">
            <span className="font-semibold text-success-700">
              {score} Correct
            </span>

            <span className="font-semibold text-error-700">
              {questions.length - score} Incorrect
            </span>
          </div>

        </div>

        {/* DATABASE SAVE WARNING */}

        {saveFailed && (
          <div
            role="alert"
            className="
              flex items-start gap-3
              rounded-xl border
              border-rose-200
              bg-rose-50 p-4
            "
          >
            <AlertCircle
              className="mt-0.5 h-5 w-5 shrink-0 text-rose-600"
              aria-hidden="true"
            />

            <p className="text-sm leading-6 text-rose-800">
              {t(language, 'saveFailed')}
              {' '}
              Your score was calculated locally, but some quiz attempts may not have been saved.
            </p>
          </div>
        )}

        {/* RETAKE QUIZ */}

        <button
          type="button"
          onClick={startQuiz}
          className="
            flex min-h-12 w-full
            items-center justify-center
            rounded-2xl border-2
            border-brand-700
            px-5 py-3 text-base
            font-bold text-brand-800
            transition-colors
            hover:bg-brand-50
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-brand-600
            focus-visible:ring-offset-2
            active:scale-[0.98]
          "
        >
          {t(language, 'quizAgain')}
        </button>

      </div>
    );
  }

  // ------------------------------------------------
  // CURRENT QUESTION
  // ------------------------------------------------

  const question = questions[phase.index];

  const isLast =
    phase.index + 1 >= questions.length;

  const isCorrect =
    phase.chosen !== null &&
    phase.chosen === question.correct_option;

  // Resolve the question prompt and explanation.
  const prompt = getLocalizedText(
    question.prompt,
    language
  ) || t(language, 'notUnderstood');

  const explanation = getLocalizedText(
    question.explanation,
    language
  );

  // Calculate quiz progress.
  const progress = Math.round(
    (
      (phase.index + (phase.answered ? 1 : 0)) /
      questions.length
    ) * 100
  );

  // ------------------------------------------------
  // QUESTION SCREEN
  // ------------------------------------------------

  return (
    <div className="space-y-5">

      {/* ==========================================
          QUIZ PROGRESS
      =========================================== */}

      <div className="space-y-3">

        <div className="
          flex items-center
          justify-between gap-3
        ">

          <p className="
            text-sm font-semibold
            text-slate-600
          ">
            {t(language, 'quizProgress', {
              current: phase.index + 1,
              total: questions.length,
            })}
          </p>

          <span className="
            text-xs font-bold
            text-brand-800
          ">
            {progress}%
          </span>

        </div>

        <div
          className="
            h-2 overflow-hidden
            rounded-full bg-slate-200
          "
          role="progressbar"
          aria-label="Quiz progress"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="
              h-full rounded-full
              bg-brand-600
              transition-all duration-500
            "
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

      </div>

      {/* ==========================================
          QUESTION CARD
      =========================================== */}

      <QuizQuestionCard
        key={question.id}
        question={question}
        language={language}
        prompt={prompt}
        answered={phase.answered}
        chosen={phase.chosen}
        onChoose={(option) => {
          void answer(question, option);
        }}
      />

      {/* ==========================================
          ANSWER EXPLANATION
      =========================================== */}

      {phase.answered && (
        <section className="
          animate-fade-up space-y-4
          rounded-3xl border
          border-slate-200
          bg-white p-5 shadow-sm
        ">

          {/* ANSWER RESULT */}

          <p
            className={`
              flex items-center gap-2
              text-base font-bold
              ${
                isCorrect
                  ? 'text-success-800'
                  : 'text-error-700'
              }
            `}
            role="status"
            aria-live="polite"
          >
            {isCorrect ? (
              <CheckCircle2
                className="h-5 w-5 shrink-0"
                aria-hidden="true"
              />
            ) : (
              <XCircle
                className="h-5 w-5 shrink-0"
                aria-hidden="true"
              />
            )}

            {t(
              language,
              isCorrect ? 'quizCorrect' : 'quizWrong'
            )}
          </p>

          {/* EXPLANATION */}

          {explanation && (
            <div className="
              rounded-xl bg-slate-50
              p-4
            ">
              <p className="
                mb-2 text-xs font-bold
                uppercase tracking-wide
                text-slate-500
              ">
                Explanation
              </p>

              <p className="
                text-sm leading-7
                text-slate-700
              ">
                {explanation}
              </p>
            </div>
          )}

          {/* SAVE STATUS */}

          {savingAttempt && (
            <div
              role="status"
              aria-live="polite"
              className="
                flex items-center
                gap-2 text-xs
                font-medium text-slate-500
              "
            >
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />

              Saving your answer...
            </div>
          )}

          {/* SAVE ERROR */}

          {saveFailed && (
            <p className="
              flex items-center gap-2
              text-xs font-medium
              text-rose-700
            ">
              <AlertCircle
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              />

              Some quiz answers could not be saved.
            </p>
          )}

          {/* NEXT QUESTION */}

          <button
            type="button"
            onClick={nextQuestion}
            disabled={savingAttempt}
            className="
              flex min-h-12 w-full
              items-center justify-center
              rounded-2xl bg-brand-700
              px-5 py-3 text-base
              font-bold text-white
              transition-colors
              hover:bg-brand-800
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-brand-600
              focus-visible:ring-offset-2
              active:scale-[0.98]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {savingAttempt ? (
              <>
                <LoaderCircle
                  className="mr-2 h-5 w-5 animate-spin"
                  aria-hidden="true"
                />

                Saving...
              </>
            ) : isLast ? (
              t(language, 'quizFinish')
            ) : (
              t(language, 'quizNext')
            )}
          </button>

        </section>
      )}

    </div>
  );
}
