
import { supabase } from '@/lib/supabase';

import type {
  Result,
  Worker,
} from '@/lib/types';

const WORKER_STORAGE_KEY = 'fbb_worker_id';

function createWorkerId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

export function getStoredWorkerId(): string {
  const existingId = localStorage.getItem(
    WORKER_STORAGE_KEY
  );

  if (existingId) {
    return existingId;
  }

  const newId = createWorkerId();

  localStorage.setItem(
    WORKER_STORAGE_KEY,
    newId
  );

  return newId;
}

export async function loadOrCreateWorker(): Promise<Result<Worker>> {
  try {
    // Generate or retrieve the browser's worker ID.
    const workerId = getStoredWorkerId();

    // Create the worker record if it does not exist.
    // No Supabase Auth anonymous sign-in is performed.
    const { data, error } = await supabase
      .from('workers')
      .upsert(
        {
          id: workerId,
        },
        {
          onConflict: 'id',
        }
      )
      .select('id, language, department_id')
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Unable to load worker profile.');
    }

    return {
      ok: true,
      data: data as Worker,
    };

  } catch (error) {
    console.error('Worker initialization failed:', error);

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to initialize worker profile.',
    };
  }
}
