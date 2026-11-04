
import type { User } from '@supabase/supabase-js';

export const ADMIN_PASSWORD_RECOVERY_KEY =
  'fbb_admin_password_recovery';

export function isSupervisorUser(
  user: User | null | undefined
): boolean {
  if (!user || user.is_anonymous) {
    return false;
  }

  return user.app_metadata?.role === 'admin';
}
