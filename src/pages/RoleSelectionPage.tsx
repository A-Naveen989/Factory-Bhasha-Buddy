
import { useRef, useState } from 'react';

import {
  ArrowRight,
  Building2,
  HardHat,
  Languages,
  LoaderCircle,
  Mic,
  ShieldCheck,
} from 'lucide-react';

import { AppLink } from '@/components/AppLink';
import { grantWorkerDemoAccess } from '@/lib/demoAccess';
import { navigate } from '@/lib/router';

export function RoleSelectionPage() {
  const enteringRef = useRef(false);

  const [enteringWorker, setEnteringWorker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleWorkerAccess(): void {
    if (enteringRef.current) {
      return;
    }

    enteringRef.current = true;
    setEnteringWorker(true);
    setError(null);

    try {
      grantWorkerDemoAccess();
      navigate('/worker');
    } catch (error) {
      console.error('Worker demo access failed:', error);

      setError(
        'Unable to start worker mode. Please enable browser storage and try again.'
      );

      enteringRef.current = false;
      setEnteringWorker(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 sm:px-6">

      {/* BACKGROUND EFFECTS */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent-500/10 blur-3xl"
      />

      <section className="relative w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl shadow-black/30">

        <div className="grid lg:grid-cols-2">

          {/* LEFT BRANDING PANEL */}
          <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-slate-950 p-7 text-white sm:p-10 lg:p-12">

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 top-20 h-64 w-64 rounded-full border border-white/10"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full border border-white/10"
            />

            {/* BRAND */}
            <div className="relative">

              <div className="flex items-center gap-3">

                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
                  <HardHat className="h-7 w-7" />
                </span>

                <div>
                  <p className="text-lg font-bold tracking-tight">
                    Factory Bhasha Buddy
                  </p>

                  <p className="text-xs text-brand-100">
                    Multilingual Worker Assistance
                  </p>
                </div>

              </div>

              <div className="mt-12 max-w-md lg:mt-20">

                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-brand-50">
                  <Building2 className="h-4 w-4" />
                  SMART FACTORY SUPPORT
                </span>

                <h1 className="mt-6 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl xl:text-5xl">
                  A safer workplace starts with better communication.
                </h1>

                <p className="mt-5 max-w-md text-sm leading-7 text-brand-100 sm:text-base">
                  Get factory information, safety guidance and
                  workplace assistance in the language you understand.
                </p>

              </div>

            </div>

            {/* FEATURE HIGHLIGHTS */}
            <div className="relative mt-12 grid grid-cols-2 gap-3 lg:mt-16">

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <Languages className="h-6 w-6 text-brand-200" />

                <p className="mt-3 text-sm font-bold">
                  Four languages
                </p>

                <p className="mt-1 text-xs text-brand-100">
                  English, Hindi, Tamil and Telugu
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <Mic className="h-6 w-6 text-brand-200" />

                <p className="mt-3 text-sm font-bold">
                  Voice assistance
                </p>

                <p className="mt-1 text-xs text-brand-100">
                  Simple voice-first interaction
                </p>
              </div>

            </div>

          </div>

          {/* RIGHT ROLE SELECTION PANEL */}
          <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">

            <div className="mb-8">

              <p className="text-xs font-bold uppercase tracking-widest text-brand-700">
                GET STARTED
              </p>

              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Select your role to continue to Factory Bhasha Buddy.
              </p>

            </div>

            <div className="space-y-4">

              {/* WORKER ACCESS */}
              <article className="group rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-900/5 sm:p-6">

                <div className="flex items-start gap-4">

                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-100">
                    <HardHat className="h-6 w-6" />
                  </span>

                  <div className="min-w-0 flex-1">

                    <h3 className="font-bold text-slate-900">
                      Worker access
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Access shifts, factory notices, safety quizzes
                      and complaint assistance.
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={handleWorkerAccess}
                  disabled={enteringWorker}
                  className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {enteringWorker ? (
                    <>
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                      Opening worker application...
                    </>
                  ) : (
                    <>
                      Continue as Worker
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}

                </button>

                <p className="mt-3 text-center text-xs text-slate-400">
                  Demo access · No email or password required
                </p>

              </article>

              {/* SUPERVISOR ACCESS */}
              <article className="group rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-success-300 hover:shadow-lg hover:shadow-slate-900/5 sm:p-6">

                <div className="flex items-start gap-4">

                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success-50 text-success-700 transition group-hover:bg-success-100">
                    <ShieldCheck className="h-6 w-6" />
                  </span>

                  <div className="min-w-0 flex-1">

                    <h3 className="font-bold text-slate-900">
                      Supervisor access
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Manage factory notices, review complaints
                      and monitor worker activity.
                    </p>

                  </div>

                </div>

                <AppLink
                  to="/admin/login"
                  className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 transition hover:border-success-500 hover:bg-success-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-success-100"
                >
                  Supervisor Login
                  <ArrowRight className="h-4 w-4" />
                </AppLink>

                <p className="mt-3 text-center text-xs text-slate-400">
                  Authorized supervisor accounts only
                </p>

              </article>

            </div>

            {/* ERROR */}
            {error && (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-error-100 bg-error-50 p-3 text-sm text-error-800"
              >
                {error}
              </p>
            )}

            {/* FOOTER */}
            <div className="mt-8 border-t border-slate-100 pt-5">

              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4" />
                Factory Bhasha Buddy
              </div>

              <p className="mt-2 text-center text-xs leading-5 text-slate-400">
                Worker entry is for demonstration and does not verify
                employee identity.
              </p>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}
