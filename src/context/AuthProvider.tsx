
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { Session } from '@supabase/supabase-js';

import {
  supabase,
  setRememberSession,
} from '@/lib/supabase';

import {
  ADMIN_PASSWORD_RECOVERY_KEY,
  isSupervisorUser,
} from '@/lib/auth';

import { AuthContext } from './AuthContext';
import type { AuthContextValue } from './AuthContext';

// --------------------------------------------------
// PASSWORD RECOVERY MARKER
// --------------------------------------------------

function saveRecoveryMarker(userId: string): void {
  try {
    window.sessionStorage.setItem(
      ADMIN_PASSWORD_RECOVERY_KEY,
      JSON.stringify({
        userId,
        createdAt: Date.now(),
      })
    );
  } catch (error) {
    console.warn(
      'Unable to save password recovery state:',
      error
    );
  }
}

function clearRecoveryMarker(): void {
  try {
    window.sessionStorage.removeItem(
      ADMIN_PASSWORD_RECOVERY_KEY
    );
  } catch (error) {
    console.warn(
      'Unable to clear password recovery state:',
      error
    );
  }
}

// --------------------------------------------------
// AUTH PROVIDER
// --------------------------------------------------

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // --------------------------------------------------
  // RESTORE AND MONITOR AUTHENTICATION SESSION
  // --------------------------------------------------

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (!mounted) {
          return;
        }

        // --------------------------------------------
        // PASSWORD RECOVERY EVENT
        // --------------------------------------------

        if (event === 'PASSWORD_RECOVERY') {
          if (
            nextSession?.user &&
            isSupervisorUser(nextSession.user)
          ) {
            saveRecoveryMarker(nextSession.user.id);
          } else {
            clearRecoveryMarker();
          }
        }

        // --------------------------------------------
        // SIGN OUT EVENT
        // --------------------------------------------

        if (event === 'SIGNED_OUT') {
          clearRecoveryMarker();
        }

        // --------------------------------------------
        // UPDATE AUTHENTICATION STATE
        // --------------------------------------------

        setSession(nextSession);
        setLoading(false);
      }
    );

    // ----------------------------------------------
    // LOAD EXISTING SESSION
    // ----------------------------------------------

    async function loadInitialSession(): Promise<void> {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (mounted) {
          setSession(initialSession);
        }
      } catch (error) {
        console.error(
          'Unable to restore authentication session:',
          error
        );

        if (mounted) {
          setSession(null);
          clearRecoveryMarker();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // --------------------------------------------------
  // SIGN OUT
  // --------------------------------------------------

  const signOut = useCallback(async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    clearRecoveryMarker();

    // Reset the preference for future worker sessions.
    try {
      setRememberSession(true);
    } catch (error) {
      console.warn(
        'Unable to reset session preference:',
        error
      );
    }
  }, []);

  // --------------------------------------------------
  // DERIVED AUTHENTICATION VALUES
  // --------------------------------------------------

  const user = session?.user ?? null;

  const isAdmin = isSupervisorUser(user);

  // --------------------------------------------------
  // AUTH CONTEXT VALUE
  // --------------------------------------------------

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      isAdmin,
      signOut,
    }),
    [
      user,
      session,
      loading,
      isAdmin,
      signOut,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
