
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';

import {
  Send,
  LoaderCircle,
  MessageCircle,
  AlertCircle,
} from 'lucide-react';

import { MicButton } from '@/components/MicButton';
import { SpeakButton } from '@/components/SpeakButton';

import { useWorker } from '@/hooks/useWorker';

import {
  buildAskAnswer,
  type AskAnswer,
} from '@/lib/askAnswer';

import { classifyQuery } from '@/lib/intents';
import { t } from '@/lib/i18n';
import {
  speakText,
  stopSpeaking,
} from '@/lib/speech';

import { supabase } from '@/lib/supabase';

// --------------------------------------------------
// ASK PAGE
// --------------------------------------------------

export function AskPage() {
  const { worker } = useWorker();

  const language = worker.language;

  // ------------------------------------------------
  // STATE
  // ------------------------------------------------

  const [draft, setDraft] = useState('');

  const [question, setQuestion] = useState('');

  const [answer, setAnswer] = useState<AskAnswer | null>(
    null
  );

  const [error, setError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);

  // ------------------------------------------------
  // REFS
  // ------------------------------------------------

  // Prevent simultaneous question submissions.
  const requestInProgressRef = useRef(false);

  // Prevent state updates after unmounting.
  const mountedRef = useRef(true);

  // ------------------------------------------------
  // COMPONENT CLEANUP
  // ------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      stopSpeaking();
    };
  }, []);

  // ------------------------------------------------
  // PROCESS QUESTION
  // ------------------------------------------------

  async function ask(text: string): Promise<void> {
    const query = text.trim();

    // Ignore empty or overlapping submissions.
    if (!query || requestInProgressRef.current) {
      return;
    }

    // Lock synchronously before starting asynchronous work.
    requestInProgressRef.current = true;

    if (mountedRef.current) {
      setBusy(true);
      setError(null);
      setQuestion(query);
      setAnswer(null);
    }

    // Stop previously playing speech.
    stopSpeaking();

    try {
      // ----------------------------------------------
      // STEP 1: CLASSIFY QUESTION
      // ----------------------------------------------

      const classified = classifyQuery(query);

      // ----------------------------------------------
      // STEP 2: LOG QUESTION
      // ----------------------------------------------

      // Logging runs independently so that a logging
      // failure does not prevent answer generation.
      const logPromise = (async (): Promise<boolean> => {
        try {
          const { error: logError } = await supabase
            .from('voice_queries')
            .insert({
              worker_id: worker.id,
              language,
              intent: classified.intent,
              topic_id: classified.topicId,
              raw_text: query,
            });

          if (logError) {
            console.error(
              'Voice query logging failed:',
              logError
            );
            return true;
          }

          return false;
        } catch (logError) {
          console.error(
            'Unexpected voice query logging error:',
            logError
          );

          return true;
        }
      })();

      // ----------------------------------------------
      // STEP 3: GENERATE ANSWER
      // ----------------------------------------------

      const answerPromise = buildAskAnswer(
        query,
        worker
      );

      // Wait for both operations.
      const [loggingFailed, result] = await Promise.all([
        logPromise,
        answerPromise,
      ]);

      if (!mountedRef.current) {
        return;
      }

      // ----------------------------------------------
      // STEP 4: HANDLE ANSWER ERRORS
      // ----------------------------------------------

      if (!result.ok) {
        setError(t(language, 'saveFailed'));
        return;
      }

      // ----------------------------------------------
      // STEP 5: DISPLAY ANSWER
      // ----------------------------------------------

      setAnswer(result.data);

      // ----------------------------------------------
      // STEP 6: SPEAK ANSWER
      // ----------------------------------------------

      if (result.data.spoken.trim()) {
        speakText(
          result.data.spoken,
          language
        );
      }

      // ----------------------------------------------
      // STEP 7: HANDLE LOGGING ERRORS
      // ----------------------------------------------

      if (loggingFailed) {
        setError(t(language, 'saveFailed'));
      }

    } catch (requestError) {
      console.error(
        'Question processing failed:',
        requestError
      );

      if (mountedRef.current) {
        setError(t(language, 'saveFailed'));
      }

    } finally {
      requestInProgressRef.current = false;

      if (mountedRef.current) {
        setBusy(false);
      }
    }
  }

  // ------------------------------------------------
  // HANDLE TEXT SUBMISSION
  // ------------------------------------------------

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ): void {
    event.preventDefault();

    const query = draft.trim();

    if (!query || requestInProgressRef.current) {
      return;
    }

    setDraft('');

    void ask(query);
  }

  // ------------------------------------------------
  // HANDLE VOICE INPUT
  // ------------------------------------------------

  function handleVoiceText(text: string): void {
    if (requestInProgressRef.current) {
      return;
    }

    void ask(text);
  }

  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------

  return (
    <div className="space-y-6">

      {/* ==========================================
          PAGE HEADER
      =========================================== */}

      <header className="animate-fade-up space-y-2">

        <div className="flex items-center gap-2">
          <span className="
            flex h-9 w-9 items-center
            justify-center rounded-xl
            bg-brand-100 text-brand-800
          ">
            <MessageCircle
              className="h-5 w-5"
              aria-hidden="true"
            />
          </span>

          <span className="
            text-xs font-bold uppercase
            tracking-wider text-brand-700
          ">
            Factory Assistant
          </span>
        </div>

        <h1 className="
          text-2xl font-bold
          leading-tight text-slate-900
          sm:text-3xl
        ">
          {t(language, 'askTitle')}
        </h1>

        <p className="text-sm leading-6 text-slate-600">
          {t(language, 'askIntro')}
        </p>

      </header>

      {/* ==========================================
          VOICE INPUT
      =========================================== */}

      <section
        aria-label={t(language, 'holdToSpeak')}
        className="
          animate-fade-up
          rounded-3xl border
          border-slate-200 bg-white
          p-6 shadow-sm
        "
        style={{ animationDelay: '60ms' }}
      >
        <div className="mb-5 text-center">

          <h2 className="text-base font-bold text-slate-900">
            Ask using your voice
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Speak naturally in your selected language.
          </p>

        </div>

        <MicButton
          language={language}
          onText={handleVoiceText}
        />

      </section>

      {/* ==========================================
          TEXT INPUT
      =========================================== */}

      <form
        onSubmit={handleSubmit}
        className="space-y-2"
      >

        <label
          htmlFor="ask-question-input"
          className="block text-sm font-semibold text-slate-700"
        >
          Or type your question
        </label>

        <div className="flex items-center gap-2">

          <input
            id="ask-question-input"
            type="text"
            value={draft}
            onChange={(event) =>
              setDraft(event.target.value)
            }
            placeholder={t(language, 'askPlaceholder')}
            autoComplete="off"
            maxLength={1000}
            disabled={busy}
            className="
              min-h-[52px] min-w-0
              flex-1 rounded-2xl
              border border-slate-300
              bg-white px-4 py-3
              text-base text-slate-900
              placeholder:text-slate-400
              transition-colors
              focus:border-brand-600
              focus:outline-none
              focus:ring-2
              focus:ring-brand-200
              disabled:cursor-not-allowed
              disabled:bg-slate-100
            "
          />

          <button
            type="submit"
            disabled={busy || !draft.trim()}
            aria-label={t(language, 'send')}
            title={t(language, 'send')}
            className="
              flex h-[52px] w-[52px]
              shrink-0 items-center
              justify-center rounded-2xl
              bg-brand-700 text-white
              shadow-sm transition-colors
              hover:bg-brand-800
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-brand-600
              focus-visible:ring-offset-2
              active:scale-95
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {busy ? (
              <LoaderCircle
                className="h-5 w-5 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Send
                className="h-5 w-5"
                aria-hidden="true"
              />
            )}
          </button>

        </div>

        <p className="text-right text-xs text-slate-400">
          {draft.length}/1000
        </p>

      </form>

      {/* ==========================================
          ERROR MESSAGE
      =========================================== */}

      {error && (
        <div
          role="alert"
          className="
            flex items-start gap-3
            rounded-2xl border border-rose-200
            bg-rose-50 p-4
          "
        >
          <AlertCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-rose-600"
            aria-hidden="true"
          />

          <p className="text-sm font-medium leading-6 text-rose-800">
            {error}
          </p>

        </div>
      )}

      {/* ==========================================
          QUESTION AND ANSWER
      =========================================== */}

      {question && (
        <section
          aria-busy={busy}
          aria-label={t(language, 'answer')}
          className="
            animate-fade-up space-y-4
            rounded-3xl border
            border-slate-200 bg-white
            p-5 shadow-sm
          "
        >

          {/* USER QUESTION */}

          <div className="space-y-2">

            <p className="
              text-xs font-bold
              uppercase tracking-wide
              text-slate-500
            ">
              Your question
            </p>

            <div className="
              rounded-2xl bg-slate-100
              px-4 py-3 text-sm
              leading-6 text-slate-700
            ">
              {question}
            </div>

          </div>

          {/* LOADING STATE */}

          {busy && (
            <div
              role="status"
              aria-live="polite"
              className="
                flex items-center gap-3
                py-3 text-sm
                font-medium text-slate-500
              "
            >
              <LoaderCircle
                className="h-5 w-5 animate-spin text-brand-700"
                aria-hidden="true"
              />

              {t(language, 'loading')}
            </div>
          )}

          {/* ANSWER */}

          {answer && (
            <div className="space-y-4 border-t border-slate-100 pt-4">

              <div className="space-y-2">

                <p className="
                  text-xs font-bold
                  uppercase tracking-wide
                  text-brand-800
                ">
                  {answer.title}
                </p>

                <p
                  className="
                    whitespace-pre-line
                    break-words text-base
                    leading-7 text-slate-900
                  "
                  aria-live="polite"
                >
                  {answer.text}
                </p>

              </div>

              {/* REPLAY ANSWER */}

              <div className="border-t border-slate-100 pt-4">

                <SpeakButton
                  text={answer.spoken}
                  language={language}
                  label={t(language, 'replay')}
                />

              </div>

            </div>
          )}

        </section>
      )}

    </div>
  );
}
