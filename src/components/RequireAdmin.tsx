
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  LoaderCircle,
  LogOut,
  ShieldAlert,
} from 'lucide-react';

import { useAuth } from '@/context/useAuth';
import { navigate } from '@/lib/router';

export function RequireAdmin({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading, isAdmin, signOut } = useAuth();

  const logoutInProgress = useRef(false);

  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  // Redirect unauthenticated users to supervisor login.
  useEffect(() => {
    if (!loading && (!user || user.is_anonymous)) {
      const currentPath =
        window.location.pathname + window.location.search;

      navigate(
        `/admin/login?next=${encodeURIComponent(currentPath)}`
      );
    }
  }, [loading, user]);

  // Handle logout.
  async function handleSignOut(): Promise<void> {
    if (logoutInProgress.current) {
      return;
    }

    logoutInProgress.current = true;
    setLogoutBusy(true);
    setLogoutError(null);

    try {
      await signOut();

      // Return to the common Worker / Supervisor page.
      navigate('/');
    } catch (error) {
      console.error('Supervisor sign-out failed:', error);

      setLogoutError(
        'Unable to sign out. Please try again.'
      );

      logoutInProgress.current = false;
      setLogoutBusy(false);
    }
  }

  // Authentication loading state.
  if (loading || !user || user.is_anonymous) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-slate-950 px-5"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-brand-400" />

          <p className="text-sm font-medium text-slate-300">
            Verifying supervisor access...
          </p>
        </div>
      </div>
    );
  }

  // Authenticated but unauthorized user.
  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10">
        <section
          className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl"
          aria-labelledby="access-denied-title"
        >
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-error-50 text-error-700">
            <ShieldAlert
              className="h-8 w-8"
              aria-hidden="true"
            />
          </span>

          <h1
            id="access-denied-title"
            className="mt-6 text-2xl font-bold tracking-tight text-slate-900"
          >
            Access restricted
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            Your account is authenticated, but it does not have
            the required supervisor permissions.
            Contact your system administrator for access.
          </p>

          {logoutError && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-error-50 p-3 text-sm text-error-700"
            >
              {logoutError}
            </p>
          )}

          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={logoutBusy}
            aria-busy={logoutBusy}
            className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {logoutBusy ? (
              <>
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                Signing out...
              </>
            ) : (
              <>
                <LogOut
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                Sign out
              </>
            )}
          </button>
        </section>
      </main>
    );
  }

  // Authorized supervisor.
  return <>{children}</>;
}
