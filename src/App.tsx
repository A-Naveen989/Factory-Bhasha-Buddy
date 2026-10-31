
import type { ReactNode } from 'react';

import { WorkerLayout } from '@/components/WorkerLayout';
import { WorkerProvider } from '@/context/WorkerProvider';
import { usePathname } from '@/lib/router';

import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { AdminNoticesPage } from '@/pages/AdminNoticesPage';
import { AskPage } from '@/pages/AskPage';
import { HomePage } from '@/pages/HomePage';
import { NoticesPage } from '@/pages/NoticesPage';
import { QuizPage } from '@/pages/QuizPage';
import { ReportPage } from '@/pages/ReportPage';

const WORKER_ROUTES: Record<string, () => ReactNode> = {
  '/': () => <HomePage />,
  '/ask': () => <AskPage />,
  '/notices': () => <NoticesPage />,
  '/quiz': () => <QuizPage />,
  '/report': () => <ReportPage />,
};

const ADMIN_ROUTES: Record<string, () => ReactNode> = {
  '/admin': () => <AdminDashboardPage />,
  '/admin/notices': () => <AdminNoticesPage />,
};

function NotFoundPage() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
        Error 404
      </p>

      <h1 className="mt-3 text-3xl font-bold text-slate-900">
        Page not found
      </h1>

      <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
        The page you are looking for does not exist or may have been moved.
      </p>

      <a
        href="/"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Return to Home
      </a>
    </main>
  );
}

function App() {
  const pathname = usePathname();

  // Treat /notices and /notices/ as the same route.
  const normalizedPath =
    pathname === '/' ? '/' : pathname.replace(/\/+$/, '');

  // Admin pages are rendered separately from the worker layout.
  const adminRender = ADMIN_ROUTES[normalizedPath];

  if (adminRender) {
    return adminRender();
  }

  // Do not accidentally render a worker page for an invalid admin URL.
  if (normalizedPath.startsWith('/admin/')) {
    return <NotFoundPage />;
  }

  const workerRender = WORKER_ROUTES[normalizedPath];

  // Unknown routes should not initialize the worker unnecessarily.
  if (!workerRender) {
    return <NotFoundPage />;
  }

  return (
    <WorkerProvider>
      <WorkerLayout>
        {workerRender()}
      </WorkerLayout>
    </WorkerProvider>
  );
}

export default App;
