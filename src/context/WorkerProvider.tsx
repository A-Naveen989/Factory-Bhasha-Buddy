
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { WorkerContext } from '@/context/workerContextValue';
import { loadOrCreateWorker } from '@/lib/worker';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';

import type { Language, Worker } from '@/lib/types';

// --------------------------------------------------
// LOAD STATE
// --------------------------------------------------

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; worker: Worker };

// --------------------------------------------------
// ERROR HANDLER
// --------------------------------------------------

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}

// --------------------------------------------------
// WORKER PROVIDER
// --------------------------------------------------

export function WorkerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [load, setLoad] = useState<LoadState>({
    status: 'loading',
  });

  const [attempt, setAttempt] = useState(0);

  // --------------------------------------------------
  // INITIALIZE WORKER
  // --------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function initializeWorker() {
      try {
        const result = await loadOrCreateWorker();

        if (cancelled) {
          return;
        }

        if (result.ok) {
          setLoad({
            status: 'ready',
            worker: result.data,
          });
        } else {
          setLoad({
            status: 'error',
            message: result.error,
          });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLoad({
          status: 'error',
          message: getErrorMessage(error),
        });
      }
    }

    void initializeWorker();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // --------------------------------------------------
  // LOADING SCREEN
  // --------------------------------------------------

  if (load.status === 'loading') {
    return <FullScreenMessage text={t('en', 'loading')} />;
  }

  // --------------------------------------------------
  // ERROR SCREEN
  // --------------------------------------------------

  if (load.status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-7 w-7 text-red-600"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.8 3h14.8a2 2 0 0 0 1.8-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
              />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Unable to connect
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {t('en', 'connectError')}
          </p>

          <button
            type="button"
            onClick={() => {
              setLoad({ status: 'loading' });
              setAttempt((value) => value + 1);
            }}
            className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
          >
            {t('en', 'retry')}
          </button>

          <p className="mt-4 break-words text-xs text-slate-400">
            Error details: {load.message}
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // READY STATE
  // --------------------------------------------------

  return (
    <ReadyWorkerProvider
      initialWorker={load.worker}
    >
      {children}
    </ReadyWorkerProvider>
  );
}

// --------------------------------------------------
// FULL SCREEN LOADING COMPONENT
// --------------------------------------------------

function FullScreenMessage({
  text,
}: {
  text: string;
}) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-slate-50 px-6"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">

        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-700" />

        <p className="text-sm font-medium text-slate-600">
          {text}
        </p>

      </div>
    </div>
  );
}

// --------------------------------------------------
// READY WORKER PROVIDER
// --------------------------------------------------

function ReadyWorkerProvider({
  initialWorker,
  children,
}: {
  initialWorker: Worker;
  children: ReactNode;
}) {
  const [worker, setWorker] = useState<Worker>(initialWorker);

  const [saveError, setSaveError] = useState<string | null>(null);

  // Keep the latest successfully persisted worker.
  const persistedWorkerRef = useRef<Worker>(initialWorker);

  // Serialize database updates to prevent race conditions.
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  // Prevent state updates after unmounting.
  const mountedRef = useRef(true);

  // --------------------------------------------------
  // COMPONENT LIFECYCLE
  // --------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // --------------------------------------------------
  // SAVE WORKER PREFERENCES
  // --------------------------------------------------

  const save = useCallback(
    (
      patch: Partial<
        Pick<Worker, 'language' | 'department_id'>
      >
    ): void => {
      // Queue this update after the previous update completes.
      const saveTask = async () => {
        const previous = persistedWorkerRef.current;

        const updatedWorker: Worker = {
          ...previous,
          ...patch,
        };

        try {
          const { data, error } = await supabase
            .from('workers')
            .update(patch)
            .eq('id', previous.id)
            .select('id')
            .maybeSingle();

          if (error) {
            throw new Error(error.message);
          }

          // Detect updates that affected no visible database row.
          if (!data) {
            throw new Error(
              'Worker profile could not be updated. Check database permissions.'
            );
          }

          // Update the persisted reference only after success.
          persistedWorkerRef.current = updatedWorker;

          if (mountedRef.current) {
            setWorker(updatedWorker);
            setSaveError(null);
          }
        } catch (error) {
          console.error('Worker preference update failed:', error);

          if (mountedRef.current) {
            setSaveError(
              t(persistedWorkerRef.current.language, 'saveFailed')
            );
          }
        }
      };

      // Maintain the queue even when an earlier operation fails.
      saveQueueRef.current = saveQueueRef.current.then(
        saveTask,
        saveTask
      );
    },
    []
  );

  // --------------------------------------------------
  // UPDATE LANGUAGE
  // --------------------------------------------------

  const setLanguage = useCallback(
    (language: Language): void => {
      if (
        !['en', 'hi', 'ta', 'te'].includes(language)
      ) {
        return;
      }

      save({ language });
    },
    [save]
  );

  // --------------------------------------------------
  // UPDATE DEPARTMENT
  // --------------------------------------------------

  const setDepartment = useCallback(
    (departmentId: string | null): void => {
      save({
        department_id: departmentId,
      });
    },
    [save]
  );

  // --------------------------------------------------
  // CONTEXT VALUE
  // --------------------------------------------------

  return (
    <WorkerContext.Provider
      value={{
        worker,
        saveError,
        setLanguage,
        setDepartment,
      }}
    >
      {children}
    </WorkerContext.Provider>
  );
}
