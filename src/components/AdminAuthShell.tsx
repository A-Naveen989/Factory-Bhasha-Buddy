
import type { ReactNode } from 'react';

import {
  HardHat,
  Languages,
  Mic,
  ShieldCheck,
} from 'lucide-react';

export function AdminAuthShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-950 via-slate-950 to-slate-900"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl"
      />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(380px,460px)] lg:gap-16">
        {/* BRANDING PANEL */}
        <aside className="hidden text-white lg:flex lg:flex-col lg:justify-center">
          <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
              <HardHat className="h-6 w-6" />
            </span>

            <span>
              <span className="block text-lg font-bold">
                Factory Bhasha Buddy
              </span>
              <span className="block text-xs text-slate-400">
                Supervisor workspace
              </span>
            </span>
          </div>

          <div className="mt-12 inline-flex w-fit items-center gap-2 rounded-full border border-brand-400/20 bg-brand-400/10 px-4 py-2 text-xs font-semibold tracking-wide text-brand-200">
            <ShieldCheck className="h-4 w-4" />
            SECURE ADMINISTRATION
          </div>

          <h1 className="mt-7 max-w-xl text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            Clear communication.
            <span className="block text-brand-300">
              Safer factory floors.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-8 text-slate-300">
            Manage factory notices, review workplace concerns and
            understand worker engagement from one centralized console.
          </p>

          <div className="mt-10 space-y-5">
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-brand-200">
                <Languages className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">
                  Multilingual communication
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  English, Hindi, Tamil and Telugu
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-brand-200">
                <Mic className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">
                  Voice-first worker support
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Make workplace information easier to understand
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-brand-200">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">
                  Protected supervisor access
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Restricted administrative operations
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* AUTHENTICATION CARD */}
        <section className="mx-auto w-full max-w-md">
          <div className="rounded-[2rem] border border-white/10 bg-white p-7 shadow-2xl shadow-black/30 sm:p-9">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 text-white">
                <HardHat className="h-6 w-6" />
              </span>

              <span>
                <span className="block text-base font-bold text-slate-900">
                  Factory Bhasha Buddy
                </span>
                <span className="block text-xs text-slate-500">
                  Supervisor workspace
                </span>
              </span>
            </div>

            {children}
          </div>

          <p className="mt-6 text-center text-xs leading-6 text-slate-400">
            Protected supervisor access · Factory Bhasha Buddy
          </p>
        </section>
      </div>
    </main>
  );
}
