
import { supabase } from '@/lib/supabase';

import type {
  Language,
  Result,
  Worker,
} from '@/lib/types';

// --------------------------------------------------
// STORAGE CONFIGURATION
// --------------------------------------------------

const WORKER_ID_KEY = 'fbb_worker_id';

const SUPPORTED_LANGUAGES: readonly Language[] = [
  'en',
  'hi',
  'ta',
  'te',
];

// --------------------------------------------------
// HELPER: ERROR MESSAGE
// --------------------------------------------------

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred while loading the worker profile.';
}

// --------------------------------------------------
// HELPER: GENERATE WORKER ID
// --------------------------------------------------

function createWorkerId(): string {
  if (typeof window === 'undefined') {
    throw new Error(
      'Worker identification is available only in the browser.'
    );
  }

  const cryptoApi = window.crypto;

  if (!cryptoApi) {
    throw new Error(
      'Secure browser cryptography is not available.'
    );
  }

  // Use the native UUID generator when supported.
  if (typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }

  // Fallback for browsers without randomUUID().
  if (typeof cryptoApi.getRandomValues !== 'function') {
    throw new Error(
      'Unable to generate a secure worker ID in this browser.'
    );
  }

  const bytes = new Uint8Array(16);

  cryptoApi.getRandomValues(bytes);

  // Set UUID version 4.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;

  // Set UUID variant.
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

// --------------------------------------------------
// GET OR CREATE STORED WORKER ID
// --------------------------------------------------

export function getStoredWorkerId(): string {
  if (typeof window === 'undefined') {
    throw new Error(
      'Cannot access worker storage outside the browser.'
    );
  }

  let existing: string | null;

  try {
    existing = window.localStorage.getItem(WORKER_ID_KEY);
  } catch {
    throw new Error(
      'Unable to access local storage. Please enable browser storage.'
    );
  }

  // Reuse an existing worker ID.
  if (existing?.trim()) {
    return existing.trim();
  }

  // Generate a new worker ID.
  const created = createWorkerId();

  try {
    window.localStorage.setItem(WORKER_ID_KEY, created);
  } catch {
    throw new Error(
      'Unable to save worker information. Please enable browser storage.'
    );
  }

  return created;
}

// --------------------------------------------------
// VALIDATE WORKER PROFILE
// --------------------------------------------------

function isWorker(value: unknown): value is Worker {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false;
  }

  const worker = value as Record<string, unknown>;

  const validLanguage =
    typeof worker.language === 'string' &&
    SUPPORTED_LANGUAGES.includes(worker.language as Language);

  const validDepartment =
    worker.department_id === null ||
    typeof worker.department_id === 'string';

  return (
    typeof worker.id === 'string' &&
    worker.id.length > 0 &&
    validLanguage &&
    validDepartment
  );
}

// --------------------------------------------------
// LOAD OR CREATE WORKER PROFILE
// --------------------------------------------------

export async function loadOrCreateWorker(): Promise<Result<Worker>> {
  try {
    // Retrieve the locally stored worker ID.
    const id = getStoredWorkerId();

    // Create the worker record if it does not already exist.
    // Existing records are preserved.
    const { error: createError } = await supabase
      .from('workers')
      .upsert(
        { id },
        {
          onConflict: 'id',
          ignoreDuplicates: true,
        }
      );

    if (createError) {
      return {
        ok: false,
        error: createError.message,
      };
    }

    // Fetch the worker profile.
    const { data, error } = await supabase
      .from('workers')
      .select('id, language, department_id')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        error: error.message,
      };
    }

    // Handle missing worker records.
    if (!data) {
      return {
        ok: false,
        error: 'Worker profile was not found.',
      };
    }

    // Validate database response before returning it.
    if (!isWorker(data)) {
      return {
        ok: false,
        error: 'Worker profile contains invalid data.',
      };
    }

    // Ensure the returned profile matches the requested worker.
    if (data.id !== id) {
      return {
        ok: false,
        error: 'Worker profile ID does not match.',
      };
    }

    return {
      ok: true,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error),
    };
  }
}
