
import { useEffect, useState } from 'react';

import {
  AlertTriangle,
  Clock,
  Megaphone,
  ShieldCheck,
  HardHat,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';

import { AppLink } from '@/components/AppLink';
import { LanguageSelector } from '@/components/LanguageSelector';
import { SpeakButton } from '@/components/SpeakButton';

import { useWorker } from '@/hooks/useWorker';

import { supabase } from '@/lib/supabase';
import { t, type UiText } from '@/lib/i18n';

import type { Department } from '@/lib/types';

// --------------------------------------------------
// FEATURE CARD CONFIGURATION
// --------------------------------------------------

interface FeatureCard {
  to: string;
  title: UiText;
  hint: UiText;
  icon: LucideIcon;
  tone: string;
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    to: '/ask',
    title: 'cardAsk',
    hint: 'cardAskHint',
    icon: Clock,
    tone: 'bg-brand-100 text-brand-800',
  },
  {
    to: '/notices',
    title: 'cardNotices',
    hint: 'cardNoticesHint',
    icon: Megaphone,
    tone: 'bg-accent-100 text-accent-800',
  },
  {
    to: '/quiz',
    title: 'cardQuiz',
    hint: 'cardQuizHint',
    icon: ShieldCheck,
    tone: 'bg-success-100 text-success-800',
  },
  {
    to: '/report',
    title: 'cardReport',
    hint: 'cardReportHint',
    icon: AlertTriangle,
    tone: 'bg-error-100 text-error-800',
  },
];

// --------------------------------------------------
// HOME PAGE
// --------------------------------------------------

export function HomePage() {
  // ------------------------------------------------
  // WORKER CONTEXT
  // ------------------------------------------------

  const {
    worker,
    saveError,
    setLanguage,
    setDepartment,
  } = useWorker();

  const language = worker.language;

  // ------------------------------------------------
  // DEPARTMENT STATE
  // ------------------------------------------------

  const [departments, setDepartments] = useState<Department[]>([]);

  const [departmentsLoading, setDepartmentsLoading] = useState(true);

  const [departmentError, setDepartmentError] = useState(false);

  const [retryCount, setRetryCount] = useState(0);

  // ------------------------------------------------
  // LOAD DEPARTMENTS
  // ------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadDepartments() {
      setDepartmentsLoading(true);
      setDepartmentError(false);

      try {
        const { data, error } = await supabase
          .from('departments')
          .select('id, name')
          .order('name', { ascending: true });

        if (error) {
          throw new Error(error.message);
        }

        if (cancelled) {
          return;
        }

        setDepartments((data ?? []) as Department[]);
      } catch (error) {
        console.error(
          'Failed to load departments:',
          error
        );

        if (!cancelled) {
          setDepartmentError(true);
        }
      } finally {
        if (!cancelled) {
          setDepartmentsLoading(false);
        }
      }
    }

    void loadDepartments();

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  // ------------------------------------------------
  // RETRY DEPARTMENT LOADING
  // ------------------------------------------------

  function retryDepartments() {
    setRetryCount((current) => current + 1);
  }

  // ------------------------------------------------
  // HANDLE DEPARTMENT SELECTION
  // ------------------------------------------------

  function handleDepartmentChange(
    departmentId: string
  ) {
    setDepartment(departmentId || null);
  }

  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------

  return (
    <div className="space-y-6 sm:space-y-7">

      {/* ==========================================
          WELCOME HERO SECTION
      =========================================== */}

      <section
        lang={language}
        className="
          relative isolate
          animate-fade-up overflow-hidden
          rounded-3xl
          bg-gradient-to-br
          from-brand-700 via-brand-800
          to-brand-950
          p-5 text-white
          shadow-lg shadow-brand-900/10
          sm:p-7
        "
      >

        {/* BACKGROUND DECORATION */}

        <div
          className="
            pointer-events-none absolute
            -right-16 -top-16
            h-48 w-48 rounded-full
            bg-white/5 blur-2xl
          "
          aria-hidden="true"
        />

        <div
          className="
            pointer-events-none absolute
            -bottom-20 -left-12
            h-48 w-48 rounded-full
            bg-brand-400/10 blur-2xl
          "
          aria-hidden="true"
        />

        {/* HERO CONTENT */}

        <div className="relative z-10 space-y-4">

          {/* BRAND LABEL */}

          <div className="flex items-center gap-2">

            <span className="
              flex h-9 w-9
              items-center justify-center
              rounded-xl bg-white/15
              backdrop-blur-sm
            ">
              <HardHat
                className="h-5 w-5"
                aria-hidden="true"
              />
            </span>

            <p className="
              text-xs font-bold uppercase
              tracking-[0.15em]
              text-brand-100
            ">
              Factory Bhasha Buddy
            </p>

          </div>

          {/* WELCOME TITLE */}

          <div className="space-y-2">

            <h1 className="
              text-2xl font-extrabold
              leading-tight tracking-tight
              sm:text-3xl
            ">
              {t(language, 'tagline')}
            </h1>

            <p className="
              max-w-md text-sm
              leading-7 text-brand-50
            ">
              {t(language, 'welcome')}
            </p>

          </div>

          {/* WELCOME SPEECH BUTTON */}

          <div className="pt-1">

            <SpeakButton
              text={t(language, 'welcome')}
              language={language}
              label={t(language, 'listenWelcome')}
              className="
                min-h-11
                border-white/30
                bg-white/10
                text-white
                shadow-none
                hover:border-white/50
                hover:bg-white/20
                hover:text-white
                focus-visible:ring-white
                focus-visible:ring-offset-brand-800
              "
            />

          </div>

        </div>
      </section>

      {/* ==========================================
          WORKER PREFERENCES
      =========================================== */}

      <section
        className="
          animate-fade-up
          space-y-5 rounded-3xl
          border border-slate-200
          bg-white p-5 shadow-sm
          sm:p-6
        "
        style={{ animationDelay: '80ms' }}
      >

        {/* SECTION HEADER */}

        <div className="space-y-1">

          <h2 className="
            text-lg font-bold
            tracking-tight text-slate-900
          ">
            Your preferences
          </h2>

          <p className="text-xs leading-5 text-slate-500">
            Choose the language and department for your worker account.
          </p>

        </div>

        {/* ========================================
            LANGUAGE SELECTION
        ========================================= */}

        <div className="space-y-3">

          <div className="flex items-center gap-2">

            <span className="
              flex h-8 w-8
              items-center justify-center
              rounded-lg bg-brand-50
              text-brand-700
            ">
              <Megaphone
                className="h-4 w-4"
                aria-hidden="true"
              />
            </span>

            <h3 className="text-sm font-semibold text-slate-700">
              {t(language, 'chooseLanguage')}
            </h3>

          </div>

          <LanguageSelector
            value={language}
            onChange={setLanguage}
          />

        </div>

        {/* DIVIDER */}

        <div className="border-t border-slate-100" />

        {/* ========================================
            DEPARTMENT SELECTION
        ========================================= */}

        <div className="space-y-3">

          <div className="flex items-center gap-2">

            <span className="
              flex h-8 w-8
              items-center justify-center
              rounded-lg bg-accent-100
              text-accent-800
            ">
              <HardHat
                className="h-4 w-4"
                aria-hidden="true"
              />
            </span>

            <label
              htmlFor="worker-department"
              className="text-sm font-semibold text-slate-700"
              lang={language}
            >
              {t(language, 'yourDepartment')}
            </label>

          </div>

          {/* LOADING STATE */}

          {departmentsLoading && (
            <div
              role="status"
              aria-live="polite"
              className="
                flex items-center gap-2
                rounded-xl bg-slate-50
                px-4 py-3
                text-sm text-slate-500
              "
            >
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />

              {t(language, 'loading')}
            </div>
          )}

          {/* DEPARTMENT SELECT */}

          {!departmentsLoading && !departmentError && (
            <select
              id="worker-department"
              value={worker.department_id ?? ''}
              onChange={(event) =>
                handleDepartmentChange(event.target.value)
              }
              aria-label={t(language, 'yourDepartment')}
              className="
                min-h-12 w-full
                rounded-2xl border
                border-slate-300
                bg-white px-4 py-3
                text-base text-slate-900
                transition-colors
                focus:border-brand-600
                focus:outline-none
                focus:ring-2
                focus:ring-brand-200
              "
            >
              <option value="">
                {t(language, 'chooseDepartment')}
              </option>

              {departments.map((department) => (
                <option
                  key={department.id}
                  value={department.id}
                >
                  {department.name}
                </option>
              ))}

            </select>
          )}

          {/* DEPARTMENT LOADING ERROR */}

          {departmentError && (
            <div
              role="alert"
              className="
                space-y-3 rounded-xl
                border border-rose-200
                bg-rose-50 p-4
              "
            >

              <div className="flex items-start gap-2">

                <AlertTriangle
                  className="
                    mt-0.5 h-5 w-5
                    shrink-0 text-rose-600
                  "
                  aria-hidden="true"
                />

                <p className="text-sm leading-6 text-rose-800">
                  {t(language, 'connectError')}
                </p>

              </div>

              <button
                type="button"
                onClick={retryDepartments}
                className="
                  inline-flex items-center
                  gap-2 text-sm font-bold
                  text-rose-800 underline
                  underline-offset-4
                "
              >
                <RefreshCw
                  className="h-4 w-4"
                  aria-hidden="true"
                />

                {t(language, 'retry')}
              </button>

            </div>
          )}

          {/* WORKER PREFERENCE SAVE ERROR */}

          {saveError && (
            <div
              role="alert"
              className="
                flex items-start gap-2
                rounded-xl border
                border-rose-200
                bg-rose-50 p-3
              "
            >
              <AlertTriangle
                className="
                  mt-0.5 h-4 w-4
                  shrink-0 text-rose-600
                "
                aria-hidden="true"
              />

              <p className="text-sm leading-6 text-rose-800">
                {saveError}
              </p>

            </div>
          )}

          {/* SELECTED DEPARTMENT */}

          {worker.department_id && (
            <p className="text-xs font-medium text-success-700">
              Your department preference is saved when the database update succeeds.
            </p>
          )}

        </div>

      </section>

      {/* ==========================================
          MAIN FEATURE CARDS
      =========================================== */}

      <section
        aria-label="Application features"
        className="space-y-4"
      >

        {/* FEATURE SECTION HEADER */}

        <div className="space-y-1">

          <h2 className="text-lg font-bold text-slate-900">
            Explore features
          </h2>

          <p className="text-xs text-slate-500">
            Choose what you need help with.
          </p>

        </div>

        {/* FEATURE LIST */}

        <div className="grid grid-cols-1 gap-3">

          {FEATURE_CARDS.map((card, index) => {
            const Icon = card.icon;

            const title = t(language, card.title);
            const hint = t(language, card.hint);

            return (
              <AppLink
                key={card.to}
                to={card.to}
                aria-label={`${title}. ${hint}`}
                style={{
                  animationDelay: `${120 + index * 60}ms`,
                }}
                className="
                  group animate-fade-up
                  flex min-h-24
                  items-center gap-4
                  rounded-3xl border
                  border-slate-200
                  bg-white p-4 shadow-sm
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:border-brand-300
                  hover:shadow-md
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-brand-600
                  focus-visible:ring-offset-2
                  active:scale-[0.99]
                  motion-reduce:animate-none
                  motion-reduce:transform-none
                  sm:p-5
                "
              >

                {/* FEATURE ICON */}

                <span className={`
                  flex h-14 w-14
                  shrink-0 items-center
                  justify-center rounded-2xl
                  transition-transform duration-200
                  group-hover:scale-105
                  ${card.tone}
                `}>
                  <Icon
                    className="h-7 w-7"
                    aria-hidden="true"
                  />
                </span>

                {/* FEATURE DESCRIPTION */}

                <span className="min-w-0 flex-1">

                  <span className="
                    block text-base
                    font-bold text-slate-900
                    transition-colors
                    group-hover:text-brand-800
                  ">
                    {title}
                  </span>

                  <span className="
                    mt-1 block text-sm
                    leading-5 text-slate-600
                  ">
                    {hint}
                  </span>

                </span>

                {/* NAVIGATION ARROW */}

                <span className="
                  flex h-9 w-9
                  shrink-0 items-center
                  justify-center
                  rounded-full text-slate-400
                  transition-all duration-200
                  group-hover:translate-x-1
                  group-hover:bg-brand-50
                  group-hover:text-brand-700
                ">
                  <ChevronRight
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </span>

              </AppLink>
            );
          })}

        </div>
      </section>

    </div>
  );
}
