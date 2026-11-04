
import { useEffect, type ReactNode } from 'react';

import { WorkerLayout } from '@/components/WorkerLayout';
import { RequireAdmin } from '@/components/RequireAdmin';

import { WorkerProvider } from '@/context/WorkerProvider';
import { useAuth } from '@/context/useAuth';

import { hasWorkerDemoAccess } from '@/lib/demoAccess';
import { navigate, usePathname } from '@/lib/router';

import { RoleSelectionPage } from '@/pages/RoleSelectionPage';

import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { AdminNoticesPage } from '@/pages/AdminNoticesPage';
import { AdminLoginPage } from '@/pages/AdminLoginPage';
import { AdminForgotPasswordPage } from '@/pages/AdminForgotPasswordPage';
import { AdminResetPasswordPage } from '@/pages/AdminResetPasswordPage';

import { AskPage } from '@/pages/AskPage';
import { HomePage } from '@/pages/HomePage';
import { NoticesPage } from '@/pages/NoticesPage';
import { QuizPage } from '@/pages/QuizPage';
import { ReportPage } from '@/pages/ReportPage';

// --------------------------------------------------
// WORKER ROUTES
// --------------------------------------------------

const WORKER_ROUTES: Record<string, () => ReactNode> = {
  '/worker': () => <HomePage />,
  '/ask': () => <AskPage />,
  '/notices': () => <NoticesPage />,
  '/quiz': () => <QuizPage />,
  '/report': () => <ReportPage />,
};

// --------------------------------------------------
// ADMIN ROUTES
// --------------------------------------------------

const ADMIN_ROUTES: Record<string, () => ReactNode> = {
  '/admin': () => <AdminDashboardPage />,
  '/admin/notices': () => <AdminNoticesPage />,
};

// --------------------------------------------------
// AUTHENTICATION ROUTES
// --------------------------------------------------

const AUTH_ROUTES: Record<string, () => ReactNode> = {
  '/admin/login': () => <AdminLoginPage />,
  '/admin/forgot-password': () => <AdminForgotPasswordPage />,
  '/admin/reset-password': () => <AdminResetPasswordPage />,
};

// --------------------------------------------------
// LOADING SCREEN
// --------------------------------------------------

function RouteLoading() {
  return (
    <main
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-slate-50"
    >
      <div className="flex flex-col items-center gap-4">

        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-700" />

        <p className="text-sm font-medium text-slate-600">
          Loading Factory Bhasha Buddy...
        </p>

      </div>
    </main>
  );
}

// --------------------------------------------------
// WORKER ROUTE ACCESS
// --------------------------------------------------

function WorkerRoute({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading, isAdmin } = useAuth();

  const hasDemoAccess = hasWorkerDemoAccess();

  useEffect(() => {
    if (loading) {
      return;
    }

    // Do not allow permanent accounts into demo worker mode.
    if (user && !user.is_anonymous) {
      navigate(isAdmin ? '/admin' : '/admin/login');
      return;
    }

    // Worker must first choose Worker Access on the landing page.
    if (!hasWorkerDemoAccess()) {
      navigate('/');
    }
  }, [user, loading, isAdmin]);

  if (
    loading ||
    (user && !user.is_anonymous) ||
    !hasDemoAccess
  ) {
    return <RouteLoading />;
  }

  return (
    <WorkerProvider>
      <WorkerLayout>
        {children}
      </WorkerLayout>
    </WorkerProvider>
  );
}

// --------------------------------------------------
// 404 PAGE
// --------------------------------------------------

function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">

      <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
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
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
      >
        Return to Welcome Page
      </a>

    </main>
  );
}

// --------------------------------------------------
// MAIN APPLICATION
// --------------------------------------------------

function App() {
  const pathname = usePathname();

  const normalizedPath =
    pathname === '/' ? '/' : pathname.replace(/\/+$/, '');

  // Opening the application shows role selection.
  if (normalizedPath === '/') {
    return <RoleSelectionPage />;
  }

  // Public supervisor authentication pages.
  const authRender = AUTH_ROUTES[normalizedPath];

  if (authRender) {
    return authRender();
  }

  // Protected supervisor pages.
  const adminRender = ADMIN_ROUTES[normalizedPath];

  if (adminRender) {
    return (
      <RequireAdmin>
        {adminRender()}
      </RequireAdmin>
    );
  }

  // Invalid administrator URLs.
  if (normalizedPath.startsWith('/admin/')) {
    return <NotFoundPage />;
  }

  // Existing worker pages.
  const workerRender = WORKER_ROUTES[normalizedPath];

  if (!workerRender) {
    return <NotFoundPage />;
  }

  return (
    <WorkerRoute>
      {workerRender()}
    </WorkerRoute>
  );
}

export default App;
