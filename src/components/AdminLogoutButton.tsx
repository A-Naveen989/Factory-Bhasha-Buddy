
import { useRef, useState } from 'react';

import {
  LoaderCircle,
  LogOut,
} from 'lucide-react';

import { useAuth } from '@/context/useAuth';
import { navigate } from '@/lib/router';

export function AdminLogoutButton() {
  const { signOut } = useAuth();

  const logoutInProgress = useRef(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout(): Promise<void> {
    if (logoutInProgress.current) {
      return;
    }

    logoutInProgress.current = true;
    setBusy(true);
    setError(null);

    try {
      await signOut();

      // Return to Worker / Supervisor selection page.
      navigate('/');
    } catch (error) {
      console.error('Supervisor logout failed:', error);

      setError('Unable to sign out. Please try again.');

      logoutInProgress.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={() => void handleLogout()}
        disabled={busy}
        aria-busy={busy}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-error-200 hover:bg-error-50 hover:text-error-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? (
          <LoaderCircle
            className="h-4 w-4 animate-spin"
            aria-hidden="true"
          />
        ) : (
          <LogOut
            className="h-4 w-4"
            aria-hidden="true"
          />
        )}

        <span>
          {busy ? 'Signing out...' : 'Sign out'}
        </span>
      </button>

      {error && (
        <p
          role="alert"
          className="mt-2 max-w-48 text-xs leading-5 text-error-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
