
import type {
  AnchorHTMLAttributes,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from 'react';

import { navigate } from '@/lib/router';

// --------------------------------------------------
// APP LINK PROPS
// --------------------------------------------------

interface AppLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
  children: ReactNode;
}

// --------------------------------------------------
// CHECK WHETHER SPA NAVIGATION IS APPROPRIATE
// --------------------------------------------------

function shouldHandleNavigation(
  event: ReactMouseEvent<HTMLAnchorElement>,
  to: string,
  target?: string,
  download?: string | boolean
): boolean {
  // Respect previously cancelled click events.
  if (event.defaultPrevented) {
    return false;
  }

  // Only intercept ordinary left-click navigation.
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return false;
  }

  // Preserve links intended for another browsing context.
  if (target && target.toLowerCase() !== '_self') {
    return false;
  }

  // Preserve native download behaviour.
  if (download !== undefined && download !== false) {
    return false;
  }

  // Custom navigation is only available in the browser.
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const destination = new URL(to, window.location.href);

    // Only handle same-origin HTTP/HTTPS navigation.
    return (
      destination.origin === window.location.origin &&
      ['http:', 'https:'].includes(destination.protocol)
    );
  } catch {
    // Let the browser handle URLs the custom router cannot parse.
    return false;
  }
}

// --------------------------------------------------
// APP LINK COMPONENT
// --------------------------------------------------

export function AppLink({
  to,
  onClick,
  children,
  target,
  download,
  ...rest
}: AppLinkProps) {
  // Handle user click events and custom navigation.
  const handleClick = (
    event: ReactMouseEvent<HTMLAnchorElement>
  ) => {
    // Always execute the supplied click callback first.
    onClick?.(event);

    // Preserve native browser navigation when appropriate.
    if (
      !shouldHandleNavigation(
        event,
        to,
        target,
        download
      )
    ) {
      return;
    }

    // Prevent a complete page reload.
    event.preventDefault();

    // Navigate using the application's custom router.
    navigate(to);
  };

  return (
    <a
      href={to}
      target={target}
      download={download}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </a>
  );
}
