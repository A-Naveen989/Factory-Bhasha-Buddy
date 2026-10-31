
import { useEffect, useState } from 'react';

const NAVIGATE_EVENT = 'fbb:navigate';

// --------------------------------------------------
// HELPER: GET CURRENT PATHNAME
// --------------------------------------------------

function getPathname(): string {
  if (typeof window === 'undefined') {
    return '/';
  }

  return window.location.pathname;
}

// --------------------------------------------------
// HELPER: GET CURRENT URL
// --------------------------------------------------

function getCurrentUrl(): string {
  return (
    window.location.pathname +
    window.location.search +
    window.location.hash
  );
}

// --------------------------------------------------
// NAVIGATE TO ANOTHER PAGE
// --------------------------------------------------

export function navigate(path: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  let targetUrl: URL;

  try {
    targetUrl = new URL(path, window.location.href);
  } catch {
    throw new TypeError('Invalid navigation URL.');
  }

  // Allow only same-origin navigation.
  if (targetUrl.origin !== window.location.origin) {
    throw new Error('Navigation to external URLs is not supported.');
  }

  const nextUrl =
    targetUrl.pathname +
    targetUrl.search +
    targetUrl.hash;

  // Update browser history only when the URL changes.
  if (getCurrentUrl() !== nextUrl) {
    window.history.pushState({}, '', nextUrl);
  }

  // Notify components using the custom pathname hook.
  window.dispatchEvent(new Event(NAVIGATE_EVENT));

  // Scroll to the top after navigation.
  window.scrollTo(0, 0);
}

// --------------------------------------------------
// CUSTOM PATHNAME HOOK
// --------------------------------------------------

export function usePathname(): string {
  const [pathname, setPathname] = useState(getPathname);

  useEffect(() => {
    const syncPathname = () => {
      setPathname(getPathname());
    };

    // Synchronize the initial browser location.
    syncPathname();

    // Listen for browser back and forward navigation.
    window.addEventListener('popstate', syncPathname);

    // Listen for navigation performed through navigate().
    window.addEventListener(NAVIGATE_EVENT, syncPathname);

    return () => {
      window.removeEventListener('popstate', syncPathname);
      window.removeEventListener(NAVIGATE_EVENT, syncPathname);
    };
  }, []);

  return pathname;
}
