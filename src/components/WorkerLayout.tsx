
import type { ReactNode } from 'react';

import {
  AlertTriangle,
  GraduationCap,
  HardHat,
  Home,
  Megaphone,
  X,
} from 'lucide-react';

import { AppLink } from '@/components/AppLink';
import { useWorker } from '@/hooks/useWorker';

import { usePathname } from '@/lib/router';
import { LANGUAGES, t } from '@/lib/i18n';

// --------------------------------------------------
// NAVIGATION CONFIGURATION
// --------------------------------------------------

function normalizePath(path: string): string {
  if (!path || path === '/') {
    return '/';
  }

  return path.replace(/\/+$/, '');
}

const NAVIGATION_ICONS = {
  home: Home,
  notices: Megaphone,
  quiz: GraduationCap,
  report: AlertTriangle,
};

// --------------------------------------------------
// ACTIVE ROUTE DETECTION
// --------------------------------------------------

function isTabActive(
  pathname: string,
  target: string
): boolean {
  const currentPath = normalizePath(pathname);
  const targetPath = normalizePath(target);

  if (targetPath === '/') {
    return currentPath === '/';
  }

  return (
    currentPath === targetPath ||
    currentPath.startsWith(`${targetPath}/`)
  );
}

// --------------------------------------------------
// WORKER LAYOUT
// --------------------------------------------------

interface WorkerLayoutProps {
  children: ReactNode;
}

export function WorkerLayout({
  children,
}: WorkerLayoutProps) {
  const { worker, saveError } = useWorker();

  const pathname = usePathname();

  const language = worker.language;

  const languageConfig = LANGUAGES.find(
    (item) => item.code === language
  );

  const languageLabel =
    languageConfig?.label ?? 'English';

  // --------------------------------------------------
  // WORKER NAVIGATION
  // --------------------------------------------------

  const tabs = [
    {
      to: '/',
      label: t(language, 'navHome'),
      icon: NAVIGATION_ICONS.home,
    },
    {
      to: '/notices',
      label: t(language, 'navNotices'),
      icon: NAVIGATION_ICONS.notices,
    },
    {
      to: '/quiz',
      label: t(language, 'navQuiz'),
      icon: NAVIGATION_ICONS.quiz,
    },
    {
      to: '/report',
      label: t(language, 'navReport'),
      icon: NAVIGATION_ICONS.report,
    },
  ];

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="
      flex min-h-screen flex-col
      bg-slate-50 text-slate-900
    ">

      {/* ==========================================
          SKIP NAVIGATION
      =========================================== */}

      <a
        href="#worker-main"
        className="
          sr-only z-[60]
          focus:not-sr-only
          focus:fixed focus:left-4 focus:top-4
          focus:rounded-xl focus:bg-white
          focus:px-5 focus:py-3
          focus:text-sm focus:font-bold
          focus:text-brand-900
          focus:shadow-lg
          focus:outline-none
          focus:ring-2 focus:ring-brand-600
        "
      >
        Skip to main content
      </a>

      {/* ==========================================
          HEADER
      =========================================== */}

      <header className="
        sticky top-0 z-30
        border-b border-slate-200
        bg-white/95 backdrop-blur-md
      ">

        <div className="
          mx-auto flex w-full max-w-md
          items-center justify-between
          gap-3 px-4 py-3
        ">

          {/* BRANDING */}

          <AppLink
            to="/"
            aria-label="Bhasha Buddy home"
            className="
              group flex min-w-0
              items-center gap-2
              rounded-xl
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-brand-600
              focus-visible:ring-offset-2
            "
          >
            <span className="
              flex h-10 w-10 shrink-0
              items-center justify-center
              rounded-xl bg-brand-700
              text-white shadow-sm
              transition-transform duration-200
              group-hover:scale-105
            ">
              <HardHat
                className="h-5 w-5"
                aria-hidden="true"
              />
            </span>

            <span className="
              truncate text-base
              font-bold tracking-tight
              text-brand-900
            ">
              Bhasha Buddy
            </span>
          </AppLink>

          {/* LANGUAGE INDICATOR */}

          <span
            lang={language}
            title={`Selected language: ${languageLabel}`}
            className="
              inline-flex shrink-0
              items-center gap-2
              rounded-full border
              border-slate-200 bg-slate-50
              px-3 py-2
              text-xs font-semibold
              text-slate-700
            "
          >
            <span
              className="
                h-2 w-2 rounded-full
                bg-success-500
              "
              aria-hidden="true"
            />

            {languageLabel}
          </span>

        </div>
      </header>

      {/* ==========================================
          SAVE ERROR NOTIFICATION
      =========================================== */}

      {saveError && (
        <div
          role="alert"
          className="
            border-b border-rose-200
            bg-rose-50 px-4 py-3
          "
        >
          <div className="
            mx-auto flex max-w-md
            items-start gap-3
          ">
            <AlertTriangle
              className="
                mt-0.5 h-5 w-5
                shrink-0 text-rose-600
              "
              aria-hidden="true"
            />

            <p className="
              flex-1 text-sm
              font-medium leading-6
              text-rose-800
            ">
              {saveError}
            </p>

          </div>
        </div>
      )}

      {/* ==========================================
          MAIN CONTENT
      =========================================== */}

      <main
        id="worker-main"
        tabIndex={-1}
        className="
          mx-auto w-full max-w-md
          flex-1 px-4
          pb-32 pt-6
          outline-none
          sm:pt-8
        "
      >
        {children}
      </main>

      {/* ==========================================
          BOTTOM NAVIGATION
      =========================================== */}

      <nav
        aria-label="Worker navigation"
        className="
          fixed inset-x-0 bottom-0 z-30
          border-t border-slate-200
          bg-white/95 backdrop-blur-md
          shadow-[0_-4px_20px_rgba(15,23,42,0.05)]
          pb-[env(safe-area-inset-bottom)]
        "
      >

        <ul className="
          mx-auto grid w-full
          max-w-md grid-cols-4
          px-2 py-2
        ">

          {tabs.map((tab) => {
            const active = isTabActive(
              pathname,
              tab.to
            );

            const Icon = tab.icon;

            return (
              <li
                key={tab.to}
                className="min-w-0"
              >
                <AppLink
                  to={tab.to}
                  aria-current={
                    active ? 'page' : undefined
                  }
                  className={`
                    group flex min-h-16
                    flex-col items-center
                    justify-center gap-1
                    rounded-xl px-1 py-2
                    text-center text-xs
                    font-semibold
                    transition-colors duration-200
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-brand-600
                    focus-visible:ring-inset
                    motion-reduce:transition-none
                    ${
                      active
                        ? 'text-brand-800'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-brand-700'
                    }
                  `}
                >

                  {/* NAVIGATION ICON */}

                  <span
                    className={`
                      flex h-9 w-14
                      items-center justify-center
                      rounded-full
                      transition-colors duration-200
                      ${
                        active
                          ? 'bg-brand-100 text-brand-800'
                          : 'text-slate-500 group-hover:bg-slate-100 group-hover:text-brand-700'
                      }
                    `}
                  >
                    <Icon
                      className="h-5 w-5"
                      strokeWidth={active ? 2.5 : 2}
                      aria-hidden="true"
                    />
                  </span>

                  {/* NAVIGATION LABEL */}

                  <span className="
                    max-w-full truncate
                  ">
                    {tab.label}
                  </span>

                </AppLink>
              </li>
            );
          })}

        </ul>
      </nav>

    </div>
  );
}
