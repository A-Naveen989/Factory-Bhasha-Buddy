
import { useRef, type PointerEvent, type KeyboardEvent } from 'react';
import { Mic, MicOff } from 'lucide-react';

import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { t } from '@/lib/i18n';

import type { Language } from '@/lib/types';

// --------------------------------------------------
// COMPONENT PROPS
// --------------------------------------------------

interface MicButtonProps {
  language: Language;
  onText: (text: string) => void;
}

// --------------------------------------------------
// MICROPHONE BUTTON
// --------------------------------------------------

export function MicButton({
  language,
  onText,
}: MicButtonProps) {
  const {
    supported,
    listening,
    interim,
    error,
    start,
    stop,
  } = useSpeechRecognition(language, onText);

  // Track the currently active pointer.
  const activePointerRef = useRef<number | null>(null);

  // Track keyboard activation.
  const activeKeyRef = useRef<string | null>(null);

  // --------------------------------------------------
  // UNSUPPORTED BROWSER
  // --------------------------------------------------

  if (!supported) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
      >
        <MicOff
          className="h-5 w-5 shrink-0 text-amber-700"
          aria-hidden="true"
        />

        <p className="text-sm leading-6 text-amber-900">
          {t(language, 'speechUnsupported')}
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // ERROR HANDLING
  // --------------------------------------------------

  const permissionDenied =
    error === 'not-allowed' ||
    error === 'service-not-allowed';

  const errorMessage = error
    ? permissionDenied
      ? t(language, 'micDenied')
      : t(language, 'saveFailed')
    : null;

  // --------------------------------------------------
  // POINTER EVENTS
  // --------------------------------------------------

  const handlePointerDown = (
    event: PointerEvent<HTMLButtonElement>
  ) => {
    // Only respond to the primary pointer.
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      activePointerRef.current !== null
    ) {
      return;
    }

    event.preventDefault();

    activePointerRef.current = event.pointerId;

    // Keep receiving pointer events even outside the button.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Recognition can still work if pointer capture is unavailable.
    }

    start();
  };

  const handlePointerUp = (
    event: PointerEvent<HTMLButtonElement>
  ) => {
    if (activePointerRef.current !== event.pointerId) {
      return;
    }

    activePointerRef.current = null;

    stop();

    // Release pointer capture safely.
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Ignore pointer capture cleanup errors.
    }
  };

  const handlePointerCancel = (
    event: PointerEvent<HTMLButtonElement>
  ) => {
    if (activePointerRef.current !== event.pointerId) {
      return;
    }

    activePointerRef.current = null;
    stop();
  };

  const handleLostPointerCapture = (
    event: PointerEvent<HTMLButtonElement>
  ) => {
    if (activePointerRef.current !== event.pointerId) {
      return;
    }

    activePointerRef.current = null;
    stop();
  };

  // --------------------------------------------------
  // KEYBOARD EVENTS
  // --------------------------------------------------

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>
  ) => {
    const isActivationKey =
      event.key === 'Enter' ||
      event.key === ' ';

    if (!isActivationKey || event.repeat) {
      return;
    }

    if (activeKeyRef.current !== null) {
      return;
    }

    event.preventDefault();

    activeKeyRef.current = event.key;

    start();
  };

  const handleKeyUp = (
    event: KeyboardEvent<HTMLButtonElement>
  ) => {
    if (activeKeyRef.current !== event.key) {
      return;
    }

    event.preventDefault();

    activeKeyRef.current = null;

    stop();
  };

  // Stop recording when the button loses focus.
  const handleBlur = () => {
    activeKeyRef.current = null;
    activePointerRef.current = null;

    stop();
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="flex w-full flex-col items-center gap-3">

      {/* MICROPHONE BUTTON */}

      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handleLostPointerCapture}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={handleBlur}
        onContextMenu={(event) => event.preventDefault()}
        aria-label={
          listening
            ? t(language, 'listening')
            : t(language, 'holdToSpeak')
        }
        aria-pressed={listening}
        aria-describedby="mic-button-instructions"
        className={`
          relative flex h-24 w-24 touch-none select-none
          items-center justify-center rounded-full
          text-white shadow-lg
          transition-all duration-200
          focus-visible:outline-none
          focus-visible:ring-4
          focus-visible:ring-brand-300
          focus-visible:ring-offset-4
          active:scale-95
          motion-reduce:transition-none
          ${
            listening
              ? 'bg-accent-700 shadow-accent-700/30'
              : 'bg-brand-700 hover:bg-brand-800 hover:shadow-brand-700/30'
          }
        `}
      >
        {/* LISTENING ANIMATION */}

        {listening && (
          <>
            <span
              className="absolute inset-0 animate-ping rounded-full bg-accent-500/40 motion-reduce:animate-none"
              aria-hidden="true"
            />

            <span
              className="absolute inset-2 rounded-full border-2 border-white/30"
              aria-hidden="true"
            />
          </>
        )}

        {/* MICROPHONE ICON */}

        {listening ? (
          <MicOff
            className="relative z-10 h-9 w-9"
            aria-hidden="true"
          />
        ) : (
          <Mic
            className="relative z-10 h-9 w-9"
            aria-hidden="true"
          />
        )}
      </button>

      {/* MICROPHONE STATUS */}

      <p
        id="mic-button-instructions"
        role="status"
        aria-live="polite"
        className={`text-center text-sm font-semibold ${
          listening
            ? 'text-accent-700'
            : 'text-slate-700'
        }`}
      >
        {listening
          ? t(language, 'listening')
          : t(language, 'holdToSpeak')}
      </p>

      {/* INTERIM SPEECH TRANSCRIPT */}

      {interim && (
        <div
          aria-live="off"
          className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
        >
          <p className="text-center text-sm italic leading-6 text-slate-600">
            {interim}
          </p>
        </div>
      )}

      {/* ERROR MESSAGE */}

      {errorMessage && (
        <div
          role="alert"
          className="w-full max-w-md rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
        >
          <p className="text-center text-sm font-medium leading-6 text-rose-700">
            {errorMessage}
          </p>
        </div>
      )}

    </div>
  );
}
