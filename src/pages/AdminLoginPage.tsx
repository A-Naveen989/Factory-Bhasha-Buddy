
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';

import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';

import { AdminAuthShell } from '@/components/AdminAuthShell';
import { AppLink } from '@/components/AppLink';

import { useAuth } from '@/context/useAuth';
import { isSupervisorUser } from '@/lib/auth';
import { navigate } from '@/lib/router';

import {
  setRememberSession,
  supabase,
} from '@/lib/supabase';

// --------------------------------------------------
// VALIDATION
// --------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --------------------------------------------------
// SAFE REDIRECT
// --------------------------------------------------

function getSafeRedirectPath(): string {
  const params = new URLSearchParams(window.location.search);
  const next = params.get('next');

  const allowedPaths = [
    '/admin',
    '/admin/notices',
  ];

  return next && allowedPaths.includes(next)
    ? next
    : '/admin';
}

// --------------------------------------------------
// ADMIN LOGIN PAGE
// --------------------------------------------------

export function AdminLoginPage() {
  const {
    isAdmin,
    loading: authLoading,
  } = useAuth();

  const submittingRef = useRef(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLock, setCapsLock] = useState(false);

  const [busy, setBusy] = useState(false);

  const [emailError, setEmailError] =
    useState<string | null>(null);

  const [formError, setFormError] =
    useState<string | null>(null);

  // --------------------------------------------------
  // REDIRECT AUTHENTICATED SUPERVISORS
  // --------------------------------------------------

  useEffect(() => {
    if (!authLoading && isAdmin) {
      navigate(getSafeRedirectPath());
    }
  }, [authLoading, isAdmin]);

  // --------------------------------------------------
  // EMAIL VALIDATION
  // --------------------------------------------------

  function validateEmail(value: string): boolean {
    const valid = EMAIL_REGEX.test(value.trim());

    setEmailError(
      valid ? null : 'Enter a valid email address.'
    );

    return valid;
  }

  // --------------------------------------------------
  // CAPS LOCK DETECTION
  // --------------------------------------------------

  function updateCapsLock(
    event: KeyboardEvent<HTMLInputElement>
  ) {
    setCapsLock(event.getModifierState('CapsLock'));
  }

  // --------------------------------------------------
  // LOGIN SUBMISSION
  // --------------------------------------------------

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    if (
      submittingRef.current ||
      authLoading ||
      isAdmin
    ) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!validateEmail(normalizedEmail)) {
      setFormError(null);
      return;
    }

    if (!password) {
      setFormError('Enter your password.');
      return;
    }

    submittingRef.current = true;
    setBusy(true);
    setFormError(null);

    try {
      // Configure the session storage preference.
      setRememberSession(rememberMe);

      // Authenticate using Supabase.
      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (signInError) {
        setFormError(
          'Unable to sign in. Check your email and password and try again.'
        );
        return;
      }

      // Verify the authenticated user with Supabase.
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        await supabase.auth.signOut();

        setFormError(
          'Your session could not be verified. Please sign in again.'
        );
        return;
      }

      // Authentication alone does not grant admin access.
      if (!isSupervisorUser(user)) {
        await supabase.auth.signOut();

        setFormError(
          'This account does not have supervisor access. Contact your system administrator.'
        );
        return;
      }

      // Successful supervisor login.
      navigate(getSafeRedirectPath());

    } catch (error) {
      console.error('Supervisor login failed:', error);

      setFormError(
        error instanceof Error &&
        error.message.toLowerCase().includes('storage')
          ? error.message
          : 'Something went wrong. Please try again.'
      );

    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <AdminAuthShell>

      {/* HEADER */}
      <div className="space-y-2">

        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800">
          <ShieldCheck className="h-4 w-4" />
          SUPERVISOR SIGN IN
        </span>

        <h1 className="pt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Welcome back
        </h1>

        <p className="text-sm leading-6 text-slate-500">
          Sign in to access the Factory Bhasha Buddy supervisor console.
        </p>

      </div>

      {/* LOGIN FORM */}
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="mt-8 space-y-5"
        noValidate
      >

        {/* EMAIL */}
        <div>

          <label
            htmlFor="admin-email"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Email address
          </label>

          <div className="relative">

            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => {
                const value = event.target.value;

                setEmail(value);
                setFormError(null);

                if (emailError) {
                  validateEmail(value);
                }
              }}
              onBlur={() => {
                if (email.trim()) {
                  validateEmail(email);
                }
              }}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="email"
              placeholder="name@company.com"
              required
              aria-invalid={Boolean(emailError)}
              aria-describedby={
                emailError
                  ? 'admin-email-error'
                  : undefined
              }
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
            />

          </div>

          {emailError && (
            <p
              id="admin-email-error"
              className="mt-2 text-xs font-medium text-error-700"
            >
              {emailError}
            </p>
          )}

        </div>

        {/* PASSWORD */}
        <div>

          <div className="mb-2 flex items-center justify-between gap-3">

            <label
              htmlFor="admin-password"
              className="text-sm font-semibold text-slate-700"
            >
              Password
            </label>

            <AppLink
              to="/admin/forgot-password"
              className="text-xs font-semibold text-brand-700 transition hover:text-brand-900 hover:underline"
            >
              Forgot password?
            </AppLink>

          </div>

          <div className="relative">

            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setFormError(null);
              }}
              onKeyDown={updateCapsLock}
              onKeyUp={updateCapsLock}
              onBlur={() => setCapsLock(false)}
              autoComplete="current-password"
              placeholder="Enter your password"
              required
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
            />

            {/* SHOW / HIDE PASSWORD */}
            <button
              type="button"
              onClick={() =>
                setShowPassword((value) => !value)
              }
              aria-label={
                showPassword
                  ? 'Hide password'
                  : 'Show password'
              }
              aria-pressed={showPassword}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>

          </div>

          {/* CAPS LOCK WARNING */}
          {capsLock && (
            <p
              role="status"
              className="mt-2 text-xs font-semibold text-warning-800"
            >
              Caps Lock is on.
            </p>
          )}

        </div>

        {/* REMEMBER ME */}
        <label className="flex cursor-pointer items-center gap-3">

          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) =>
              setRememberMe(event.target.checked)
            }
            className="h-4 w-4 rounded border-slate-300 accent-brand-700 focus:ring-brand-500"
          />

          <span className="text-sm text-slate-600">
            Remember me on this device
          </span>

        </label>

        {/* LOGIN ERROR */}
        {formError && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-start gap-3 rounded-xl border border-error-100 bg-error-50 p-4"
          >

            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error-700" />

            <p className="text-sm leading-6 text-error-800">
              {formError}
            </p>

          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={
            busy ||
            authLoading ||
            isAdmin ||
            !email.trim() ||
            !password
          }
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-700/20 transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >

          {busy ? (
            <>
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Verifying access...
            </>
          ) : (
            <>
              Sign in securely
              <ArrowRight className="h-5 w-5" />
            </>
          )}

        </button>

      </form>

      {/* FOOTER */}
      <div className="mt-7 border-t border-slate-100 pt-6">

        <p className="text-center text-xs leading-6 text-slate-500">
          Supervisor accounts are provisioned by your system administrator.
          Public registration is disabled.
        </p>

        <div className="mt-5 text-center">

          <AppLink
            to="/"
            className="text-sm font-semibold text-brand-700 hover:text-brand-900 hover:underline"
          >
            Return to worker application
          </AppLink>

        </div>

      </div>

    </AdminAuthShell>
  );
}
