
import type { ReactNode } from 'react';

import {
  BarChart3,
  HardHat,
  Megaphone,
} from 'lucide-react';

import { AppLink } from '@/components/AppLink';
import { usePathname } from '@/lib/router';

// --------------------------------------------------
// ADMIN NAVIGATION TABS
// --------------------------------------------------

const TABS = [
  {
    to: '/admin',
    label: 'Dashboard',
    icon: BarChart3,
  },
  {
    to: '/admin/notices',
    label: 'Notices',
    icon: Megaphone,
  },
] as const;

// --------------------------------------------------
// PATH NORMALIZATION
// --------------------------------------------------

function normalizePath(path: string): string {
  if (!path || path === '/') {
    return '/';
  }

  return path.replace(/\/+$/, '');
}

// --------------------------------------------------
// ACTIVE ROUTE DETECTION
// --------------------------------------------------

function isTabActive(
  pathname: string,
  target: string
): boolean {
  const currentPath = normalizePath(pathname);
  const targetPath = normalizePath(target);

  // Dashboard should only be active on its own route.
  if (targetPath === '/admin') {
    return currentPath === '/admin';
  }

  // Support nested routes such as /admin/notices/123.
  return (
    currentPath === targetPath ||
    currentPath.startsWith(`${targetPath}/`)
  );
}

// --------------------------------------------------
// ADMIN LAYOUT
// --------------------------------------------------

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({
  children,
}: AdminLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">

      {/* ==========================================
          HEADER
      =========================================== */}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">

        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">

          {/* BRANDING */}

          <AppLink
            to="/admin"
            className="group flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
              <HardHat
                className="h-5 w-5"
                aria-hidden="true"
              />
            </span>

            <span className="min-w-0">
              <span className="block truncate text-base font-bold tracking-tight text-brand-900">
                Factory Bhasha Buddy
              </span>

              <span className="block text-xs font-medium text-slate-500">
                Supervisor Console
              </span>
            </span>
          </AppLink>

          {/* NAVIGATION */}

          <nav
            aria-label="Admin navigation"
            className="flex w-full items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:pb-0"
          >
            {TABS.map((tab) => {
              const active = isTabActive(
                pathname,
                tab.to
              );

              const Icon = tab.icon;

              return (
                <AppLink
                  key={tab.to}
                  to={tab.to}
                  aria-current={active ? 'page' : undefined}
                  className={`
                    inline-flex shrink-0 items-center justify-center gap-2
                    rounded-xl px-4 py-2.5
                    text-sm font-semibold
                    transition-colors duration-200
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-brand-600
                    focus-visible:ring-offset-2
                    ${
                      active
                        ? 'bg-brand-100 text-brand-900 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />

                  <span>{tab.label}</span>
                </AppLink>
              );
            })}
          </nav>

        </div>
      </header>

      {/* ==========================================
          MAIN CONTENT
      =========================================== */}

      <main
        id="admin-main"
        className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:py-10"
      >
        {children}
      </main>

      {/* ==========================================
          FOOTER
      =========================================== */}

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-4 text-center sm:flex-row sm:px-6 sm:text-left">
          <p className="text-xs font-medium text-slate-500">
            Factory Bhasha Buddy
          </p>

          <p className="text-xs text-slate-400">
            Supervisor Console
          </p>
        </div>
      </footer>

    </div>
  );
}
