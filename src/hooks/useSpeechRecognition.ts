
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createRecognition,
  getRecognitionConstructor,
  stopSpeaking,
  type RecognitionLike,
} from '@/lib/speech';

import type { Language } from '@/lib/types';

export function useSpeechRecognition(
  language: Language,
  onFinal: (text: string) => void
) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<RecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);
  const mountedRef = useRef(true);

  // Always use the latest callback without recreating recognition handlers.
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  // Handle component lifecycle and recognition cleanup.
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      const recognition = recognitionRef.current;
      recognitionRef.current = null;

      try {
        recognition?.stop();
      } catch {
        // Recognition may already have stopped.
      }
    };
  }, []);

  const start = useCallback(() => {
    // Prevent multiple simultaneous recognition sessions.
    if (recognitionRef.current) {
      return;
    }

    let recognition: RecognitionLike | null = null;

    try {
      recognition = createRecognition(language);

      if (!recognition) {
        setError('not-supported');
        return;
      }

      // Stop ongoing speech synthesis before listening.
      stopSpeaking();

      let finalText = '';

      recognition.onresult = (event) => {
        if (
          !mountedRef.current ||
          recognitionRef.current !== recognition
        ) {
          return;
        }

        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;

          if (result.isFinal) {
            finalText += `${transcript} `;
          } else {
            interimText += transcript;
          }
        }

        setInterim(interimText);
      };

      recognition.onerror = (event) => {
        if (
          !mountedRef.current ||
          recognitionRef.current !== recognition
        ) {
          return;
        }

        setError(event.error);
      };

      recognition.onend = () => {
        // Ignore events from an outdated recognition instance.
        if (recognitionRef.current !== recognition) {
          return;
        }

        recognitionRef.current = null;

        if (!mountedRef.current) {
          return;
        }

        setListening(false);
        setInterim('');

        // Only submit confirmed final speech.
        const text = finalText.trim();

        if (text) {
          onFinalRef.current(text);
        }
      };

      recognitionRef.current = recognition;

      setError(null);
      setInterim('');

      recognition.start();

      setListening(true);
    } catch (err) {
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }

      if (!mountedRef.current) {
        return;
      }

      setListening(false);
      setInterim('');

      setError(
        err instanceof Error
          ? err.message
          : 'speech-recognition-start-failed'
      );
    }
  }, [language]);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;

    if (!recognition) {
      return;
    }

    try {
      recognition.stop();
    } catch {
      // Ignore errors if recognition has already stopped.
    }
  }, []);

  return {
    supported: getRecognitionConstructor() !== null,
    listening,
    interim,
    error,
    start,
    stop,
  };
}
