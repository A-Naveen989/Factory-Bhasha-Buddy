
import { speechLocaleFor } from '@/lib/i18n';
import type { Language } from '@/lib/types';

// Speech recognition type definitions

export interface RecognitionAlternative {
  transcript: string;
}

export interface RecognitionResult
  extends ArrayLike<RecognitionAlternative> {
  isFinal: boolean;
}

export interface RecognitionResultEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}

export interface RecognitionErrorEvent {
  error: string;
}

export interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;

  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;

  start(): void;
  stop(): void;
}

type RecognitionConstructor = new () => RecognitionLike;

// Detect browser speech recognition support

export function getRecognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const scope = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };

  return (
    scope.SpeechRecognition ??
    scope.webkitSpeechRecognition ??
    null
  );
}

// Create and configure a recognition instance

export function createRecognition(
  language: Language
): RecognitionLike | null {
  const Constructor = getRecognitionConstructor();

  if (!Constructor) {
    return null;
  }

  const recognition = new Constructor();

  recognition.lang = speechLocaleFor(language);
  recognition.continuous = true;
  recognition.interimResults = true;

  return recognition;
}

// Convert text into speech

export function speakText(
  text: string,
  language: Language
): void {
  if (
    typeof window === 'undefined' ||
    !('speechSynthesis' in window) ||
    typeof SpeechSynthesisUtterance === 'undefined' ||
    !text.trim()
  ) {
    return;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = speechLocaleFor(language);
    utterance.rate = 0.9;

    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('Speech synthesis failed:', error);
  }
}

// Stop ongoing speech output

export function stopSpeaking(): void {
  if (
    typeof window === 'undefined' ||
    !('speechSynthesis' in window)
  ) {
    return;
  }

  try {
    window.speechSynthesis.cancel();
  } catch (error) {
    console.error('Unable to stop speech synthesis:', error);
  }
}
