
import { useContext } from 'react';

import {
  WorkerContext,
  type WorkerContextValue,
} from '@/context/workerContextValue';

/**
 * Provides access to the current worker context.
 *
 * Must be used inside a WorkerProvider component.
 */
export function useWorker(): WorkerContextValue {
  const context = useContext(WorkerContext);

  if (context === null || context === undefined) {
    throw new Error(
      'useWorker must be used within a WorkerProvider. ' +
      'Make sure your component is wrapped with WorkerProvider.'
    );
  }

  return context;
}
