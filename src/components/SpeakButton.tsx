
import { Volume2 } from 'lucide-react';

import { speakText } from '@/lib/speech';
import type { Language } from '@/lib/types';

// --------------------------------------------------
// COMPONENT PROPS
// --------------------------------------------------

interface SpeakButtonProps {
  text: string;
  language: Language;
  label: string;
  className?: string;
}

// --------------------------------------------------
// SPEAK BUTTON
// --------------------------------------------------

export function SpeakButton({
  text,
  language,
  label,
  className = '',
}: SpeakButtonProps) {
  // Remove unnecessary whitespace before playback.
  const spokenText = text.trim();

  // --------------------------------------------------
  // HANDLE SPEECH PLAYBACK
  // --------------------------------------------------

  function handleSpeak(): void {
    if (!spokenText) {
      return;
    }

    speakText(spokenText, language);
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <button
      type="button"
      onClick={handleSpeak}
      disabled={!spokenText}
      className={`
        inline-flex min-h-11
        items-center justify-center gap-2
        rounded-full border border-brand-200
        bg-white px-4 py-2
        text-sm font-semibold text-brand-800
        shadow-sm
        transition-colors duration-200
        hover:border-brand-400
        hover:bg-brand-50
        hover:text-brand-900
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-brand-600
        focus-visible:ring-offset-2
        active:scale-[0.98]
        motion-reduce:transition-none
        motion-reduce:transform-none
        disabled:cursor-not-allowed
        disabled:opacity-50
        disabled:shadow-none
        ${className}
      `}
    >
      <Volume2
        className="h-4 w-4 shrink-0"
        aria-hidden="true"
      />

      <span>{label}</span>
    </button>
  );
}
