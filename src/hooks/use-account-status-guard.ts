'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { toast } from '@/hooks/use-toast';

/**
 * Periodically verifies the logged-in user's account status.
 * If the user has been deactivated by an admin, they are auto-logged out
 * with a prominent notification.
 *
 * Checks 5 seconds after mount, then every 30 seconds.
 * Uses userId ref instead of user object in deps to avoid re-render loops.
 */
export function useAccountStatusGuard() {
  const userIdRef = useRef<string | null>(null);
  const logout = useStore((s) => s.logout);
  const navigate = useStore((s) => s.navigate);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasMountedRef = useRef(false);

  // Keep userId in sync without causing effect re-runs
  const user = useStore((s) => s.user);

  useEffect(() => {
    userIdRef.current = user?.id || null;
  }, [user]);

  const checkStatus = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId) return;

    try {
      const res = await fetch(`/api/auth/check?userId=${userId}`);
      if (!res.ok) {
        const data = await res.json();
        if (data.code === 'ACCOUNT_INACTIVE') {
          logout();
          toast({
            title: 'Account Deactivated',
            description: 'Your account has been deactivated by an administrator. You have been logged out.',
            variant: 'destructive',
            duration: 10000,
          });
          navigate('login');
        } else if (data.code === 'USER_NOT_FOUND') {
          logout();
          toast({
            title: 'Account Not Found',
            description: 'Your account could not be found. You have been logged out.',
            variant: 'destructive',
            duration: 10000,
          });
          navigate('login');
        }
      } else {
        const freshData = await res.json();
        if (freshData.id) {
          useStore.getState().updateUser({
            name: freshData.name,
            email: freshData.email,
            phone: freshData.phone,
            role: freshData.role,
            avatar: freshData.avatar,
            isActive: freshData.isActive,
          });
        }
      }
    } catch {
      // Network error - don't force logout, just retry next interval
    }
  }, [logout, navigate]);

  useEffect(() => {
    if (hasMountedRef.current) return;
    hasMountedRef.current = true;

    // Initial check after 5 seconds (avoid blocking initial render)
    const initialTimer = setTimeout(() => {
      checkStatus();
    }, 5000);

    // Periodic check every 30 seconds
    intervalRef.current = setInterval(checkStatus, 30000);

    return () => {
      clearTimeout(initialTimer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkStatus]);
}
