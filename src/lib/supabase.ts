
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();

const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const REMEMBER_SESSION_KEY = 'fbb_remember_session';

function getAuthStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const remember =
      window.localStorage.getItem(REMEMBER_SESSION_KEY) !== 'false';

    return remember ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

const authStorage = {
  getItem(key: string): string | null {
    return getAuthStorage()?.getItem(key) ?? null;
  },

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') {
      throw new Error('Browser storage is unavailable.');
    }

    const primary = getAuthStorage();

    if (!primary) {
      throw new Error('Please enable browser storage to sign in.');
    }

    const secondary =
      primary === window.localStorage
        ? window.sessionStorage
        : window.localStorage;

    primary.setItem(key, value);
    secondary.removeItem(key);
  },

  removeItem(key: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {
      // Both storage locations are best-effort cleanup.
    }
  },
};

export function setRememberSession(remember: boolean): void {
  if (typeof window === 'undefined') {
    throw new Error('Session preference is only available in a browser.');
  }

  try {
    window.localStorage.setItem(
      REMEMBER_SESSION_KEY,
      String(remember)
    );
  } catch {
    throw new Error('Unable to save your session preference.');
  }
}

if (!supabaseUrl) {
  throw new Error(
    'Missing VITE_SUPABASE_URL. Check your .env configuration.'
  );
}

if (!supabaseKey) {
  throw new Error(
    'Missing Supabase publishable or anon key.'
  );
}

try {
  const parsedUrl = new URL(supabaseUrl);

  if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
    throw new Error('Invalid protocol');
  }

  if (
    parsedUrl.protocol === 'http:' &&
    !['localhost', '127.0.0.1'].includes(parsedUrl.hostname)
  ) {
    throw new Error('Production Supabase URLs must use HTTPS.');
  }
} catch {
  throw new Error(
    'Invalid VITE_SUPABASE_URL. Provide a valid Supabase project URL.'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: authStorage,
    },
  }
);
