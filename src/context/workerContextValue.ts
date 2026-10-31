
import { createContext } from 'react';

import type {
  Language,
  Worker,
} from '@/lib/types';

// --------------------------------------------------
// WORKER CONTEXT INTERFACE
// --------------------------------------------------

export interface WorkerContextValue {
  // Current worker profile.
  worker: Worker;

  // Error encountered while saving worker preferences.
  saveError: string | null;

  // Update the worker's preferred language.
  setLanguage: (language: Language) => void;

  // Update the worker's department.
  setDepartment: (departmentId: string | null) => void;
}

// --------------------------------------------------
// WORKER CONTEXT
// --------------------------------------------------

export const WorkerContext =
  createContext<WorkerContextValue | null>(null);

WorkerContext.displayName = 'WorkerContext';
