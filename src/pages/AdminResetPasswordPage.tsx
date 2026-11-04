
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';

import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
} from 'lucide-react';

import { AdminAuthShell } from '@/components/AdminAuthShell';
import { AppLink } from '@/components/AppLink';

import { useAuth } from '@/context/useAuth';

import {
  ADMIN_PASSWORD_RECOVERY_KEY,
  isSupervisorUser,
} from '@/lib/auth';

import { supabase } from '@/lib/supabase';

const MIN_PASSWORD_LENGTH = 10;
const MAX_RECOVERY_AGE = 30 * 60 * 1000;

interface RecoveryMarker {
  userId: string;
  createdAt: number;
}

function readRecoveryMarker(): RecoveryMarker | null {
  try {
    const raw = window.sessionStorage.getItem(
      ADMIN_PASSWORD_RECOVERY_KEY
    );

    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('userId' in parsed) ||
      !('createdAt' in parsed)
    ) {
      return null;
    }

    const marker = parsed as RecoveryMarker;

    if (
      typeof marker.userId !== 'string' ||
      typeof marker.createdAt !== 'number'
    ) {
      return null;
    }

    const age = Date.now() - marker.createdAt;

    if (
      age < 0 ||
      age > MAX_RECOVERY_AGE
    ) {
      return null;
    }

    return marker;
  } catch {
    return null;
  }
}

function clearRecoveryMarker(): void {
  try {
    window.sessionStorage.removeItem(
      ADMIN_PASSWORD_RECOVERY_KEY
    );
  } catch {
    // Ignore unavailable storage.
  }
}

function getPasswordStrength(password: string): number {
  let score = 0;

  if (password.length >= 10) score++;
  if (password.length >= 14) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return score;
}

export function AdminResetPasswordPage() {
  const {
    session,
    loading: authLoading,
    signOut,
  } = useAuth();

  const submittingRef = useRef(false);

  const [checking, setChecking] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --------------------------------------------------
  // VERIFY PASSWORD RECOVERY SESSION
  // --------------------------------------------------

  useEffect(() => {
    if (authLoading) {
      return;
    }

    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        if (
          event !== 'PASSWORD_RECOVERY' ||
          !nextSession?.user
        ) {
          return;
        }

        if (!isSupervisorUser(nextSession.user)) {
          setRecoveryReady(false);
          setError(
            'This account does not have supervisor access.'
          );
          setChecking(false);
          return;
        }

        try {
          window.sessionStorage.setItem(
            ADMIN_PASSWORD_RECOVERY_KEY,
            JSON.stringify({
              userId: nextSession.user.id,
              createdAt: Date.now(),
            })
          );

          setRecoveryReady(true);
          setError(null);
          setChecking(false);
        } catch {
          setRecoveryReady(false);
          setError(
            'Browser storage is unavailable. Request a new recovery link.'
          );
          setChecking(false);
        }
      }
    );

    async function verifyExistingRecovery(): Promise<void> {
      try {
        const marker = readRecoveryMarker();
        const currentUser = session?.user;

        if (
          !marker ||
          !currentUser ||
          marker.userId !== currentUser.id ||
          !isSupervisorUser(currentUser)
        ) {
          clearRecoveryMarker();

          if (mounted) {
            setRecoveryReady(false);
          }

          return;
        }

        // Confirm the user with the Supabase Auth server.
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user || !mounted) {
          clearRecoveryMarker();
          return;
        }

        if (
          user.id !== marker.userId ||
          !isSupervisorUser(user)
        ) {
          clearRecoveryMarker();

          if (mounted) {
            setRecoveryReady(false);
          }

          return;
        }

        setRecoveryReady(true);
      } catch (error) {
        console.error(
          'Recovery session verification failed:',
          error
        );

        if (mounted) {
          setRecoveryReady(false);
        }
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    }

    void verifyExistingRecovery();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [authLoading, session?.user?.id]);

  // --------------------------------------------------
  // PASSWORD VALIDATION
  // --------------------------------------------------

  const passwordStrength = getPasswordStrength(password);

  const passwordStrengthLabel =
    passwordStrength <= 2
      ? 'Weak'
      : passwordStrength <= 4
        ? 'Moderate'
        : 'Strong';

  const passwordStrengthColor =
    passwordStrength <= 2
      ? 'bg-error-500'
      : passwordStrength <= 4
        ? 'bg-warning-500'
        : 'bg-success-500';

  // --------------------------------------------------
  // SUBMIT NEW PASSWORD
  // --------------------------------------------------

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    if (submittingRef.current || !recoveryReady) {
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(
        `Your password must contain at least ${MIN_PASSWORD_LENGTH} characters.`
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    submittingRef.current = true;
    setBusy(true);
    setError(null);

    try {
      // Revalidate the account through Supabase.
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (
        userError ||
        !user ||
        !isSupervisorUser(user)
      ) {
        throw new Error('Invalid recovery authorization.');
      }

      // Update the password through Supabase Auth.
      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        throw updateError;
      }

      clearRecoveryMarker();

      // End the recovery session and require a new login.
      try {
        await signOut();
      } catch (signOutError) {
        console.error(
          'Password changed, but sign-out failed:',
          signOutError
        );
      }

      setUpdated(true);

      setPassword('');
      setConfirmPassword('');

    } catch (error) {
      console.error('Password update failed:', error);

      setError(
        'Unable to update your password. Your recovery link may have expired. Request a new one and try again.'
      );
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (authLoading || checking) {
    return (
      <AdminAuthShell>
        <div
          role="status"
          aria-live="polite"
          className="flex min-h-48 flex-col items-center justify-center gap-4"
        >
          <LoaderCircle className="h-9 w-9 animate-spin text-brand-700" />

          <p className="text-sm text-slate-600">
            Verifying your recovery link...
          </p>
        </div>
      </AdminAuthShell>
    );
  }

  // --------------------------------------------------
  // INVALID RECOVERY LINK
  // --------------------------------------------------

  if (
    !recoveryReady ||
    !session?.user ||
    !isSupervisorUser(session.user)
  ) {
    return (
      <AdminAuthShell>
        <div className="space-y-5 text-center">

          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-error-50 text-error-700">
            <AlertCircle className="h-8 w-8" />
          </span>

          <h1 className="text-2xl font-bold text-slate-900">
            Recovery link unavailable
          </h1>

          <p className="text-sm leading-7 text-slate-600">
            This recovery link is invalid, expired or has already
            been used. Request a new password recovery link.
          </p>

          <AppLink
            to="/admin/forgot-password"
            className="flex min-h-12 items-center justify-center rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white hover:bg-brand-800"
          >
            Request another link
          </AppLink>

        </div>
      </AdminAuthShell>
    );
  }

  // --------------------------------------------------
  // PASSWORD UPDATED
  // --------------------------------------------------

  if (updated) {
    return (
      <AdminAuthShell>
        <div className="space-y-5 text-center">

          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success-50 text-success-700">
            <CheckCircle2 className="h-8 w-8" />
          </span>

          <h1 className="text-2xl font-bold text-slate-900">
            Password updated
          </h1>

          <p className="text-sm leading-7 text-slate-600">
            Your password has been changed successfully.
            Sign in with your new password to continue.
          </p>

          <AppLink
            to="/admin/login"
            className="flex min-h-12 items-center justify-center rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white hover:bg-brand-800"
          >
            Return to supervisor sign in
          </AppLink>

        </div>
      </AdminAuthShell>
    );
  }

  // --------------------------------------------------
  // RESET PASSWORD FORM
  // --------------------------------------------------

  return (
    <AdminAuthShell>

      <div className="space-y-3">

        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <KeyRound className="h-6 w-6" />
        </span>

        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-success-700">
          <ShieldCheck className="h-4 w-4" />
          Verified recovery session
        </span>

        <h1 className="text-2xl font-bold text-slate-900">
          Create a new password
        </h1>

        <p className="text-sm leading-7 text-slate-500">
          Choose a strong password with at least {MIN_PASSWORD_LENGTH} characters.
        </p>

      </div>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="mt-8 space-y-5"
      >

        {/* NEW PASSWORD */}
        <div>

          <label
            htmlFor="new-password"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            New password
          </label>

          <div className="relative">

            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError(null);
              }}
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword((value) => !value)
              }
              aria-label={
                showPassword ? 'Hide password' : 'Show password'
              }
              aria-pressed={showPassword}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>

          </div>

          {/* PASSWORD STRENGTH */}
          {password && (
            <div className="mt-3 space-y-2">

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Password strength
                </span>

                <span className="text-xs font-semibold text-slate-700">
                  {passwordStrengthLabel}
                </span>
              </div>

              <div
                className="h-1.5 overflow-hidden rounded-full bg-slate-200"
                role="meter"
                aria-label="Password strength"
                aria-valuemin={0}
                aria-valuemax={6}
                aria-valuenow={passwordStrength}
              >
                <div
                  className={`h-full rounded-full transition-all duration-300 ${passwordStrengthColor}`}
                  style={{
                    width: `${(passwordStrength / 6) * 100}%`,
                  }}
                />
              </div>

              <p className="text-xs text-slate-500">
                Use a mix of uppercase letters, lowercase letters,
                numbers and symbols.
              </p>

            </div>
          )}

        </div>

        {/* CONFIRM PASSWORD */}
        <div>

          <label
            htmlFor="confirm-password"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Confirm password
          </label>

          <input
            id="confirm-password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setError(null);
            }}
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
          />

        </div>

        {/* ERROR */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-2 rounded-xl border border-error-100 bg-error-50 p-3 text-sm text-error-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <p>{error}</p>
          </div>
        )}

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={
            busy ||
            !password ||
            !confirmPassword ||
            password.length < MIN_PASSWORD_LENGTH
          }
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <>
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Updating password...
            </>
          ) : (
            'Update password'
          )}
        </button>

      </form>

    </AdminAuthShell>
  );
}
