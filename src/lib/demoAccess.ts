
const WORKER_DEMO_ACCESS_KEY = 'fbb_worker_demo_access';

export function grantWorkerDemoAccess(): void {
  if (typeof window === 'undefined') {
    throw new Error('Browser access is unavailable.');
  }

  window.sessionStorage.setItem(
    WORKER_DEMO_ACCESS_KEY,
    'granted'
  );
}

export function hasWorkerDemoAccess(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return (
      window.sessionStorage.getItem(
        WORKER_DEMO_ACCESS_KEY
      ) === 'granted'
    );
  } catch {
    return false;
  }
}

export function clearWorkerDemoAccess(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.removeItem(
      WORKER_DEMO_ACCESS_KEY
    );
  } catch {
    // Ignore unavailable storage.
  }
}
