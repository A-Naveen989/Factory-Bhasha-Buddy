
import { useState, type FormEvent } from 'react';

import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Mail,
} from 'lucide-react';

import { AdminAuthShell } from '@/components/AdminAuthShell';
import { AppLink } from '@/components/AppLink';

import { supabase } from '@/lib/supabase';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          normalizedEmail,
          {
            redirectTo: `${window.location.origin}/admin/reset-password`,
          }
        );

      if (resetError) {
        throw resetError;
      }

      // Deliberately use the same response whether or not the
      // address belongs to an account.
      setSent(true);
    } catch (error) {
      console.error('Password recovery request failed:', error);

      setError(
        'We could not process your request right now. Please wait and try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminAuthShell>
      {sent ? (
        <div className="space-y-5 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success-50 text-success-700">
            <CheckCircle2 className="h-8 w-8" />
          </span>

          <h1 className="text-2xl font-bold text-slate-900">
            Check your email
          </h1>

          <p className="text-sm leading-7 text-slate-600">
            If an account matches the address you entered, a password
            recovery link will be sent. Follow that link to create a
            new password.
          </p>

          <p className="break-all rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
            {email.trim()}
          </p>

          <AppLink
            to="/admin/login"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </AppLink>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Mail className="h-6 w-6" />
            </span>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Forgot your password?
            </h1>

            <p className="text-sm leading-7 text-slate-500">
              Enter your supervisor email address. We will send a
              recovery link when an account matches that address.
            </p>
          </div>

          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="mt-8 space-y-5"
          >
            <div>
              <label
                htmlFor="recovery-email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email address
              </label>

              <input
                id="recovery-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(null);
                }}
                autoComplete="email"
                required
                placeholder="name@company.com"
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-error-100 bg-error-50 p-3 text-sm text-error-800"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || !email.trim()}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  Sending request...
                </>
              ) : (
                'Send recovery link'
              )}
            </button>

            <AppLink
              to="/admin/login"
              className="flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </AppLink>
          </form>
        </>
      )}
    </AdminAuthShell>
  );
}
