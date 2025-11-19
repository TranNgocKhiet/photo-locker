"use client";

import { useState, useCallback, useEffect } from 'react';

const LOCKER_KEY = 'photoLockerUnlocked';

function getInitialUnlockedStatus(): boolean {
    if (typeof window !== 'undefined') {
        const status = sessionStorage.getItem(LOCKER_KEY);
        return status === 'true';
    }
    return false;
} 

function setLockerCookie(value: boolean) {
    if (typeof document !== 'undefined') {
        document.cookie = `lockerStatus=${value}; path=/; max-age=3600; secure=true; sameSite=strict`;
    }
}

export function useLockerState() {
    const [isUnlocked, setIsUnlocked] = useState(getInitialUnlockedStatus);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleUpdate = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail && typeof detail.isUnlocked === 'boolean') {
                setIsUnlocked(detail.isUnlocked);
                return;
            }

            setIsUnlocked(getInitialUnlockedStatus());
        };

        window.addEventListener('locker:update', handleUpdate);
        return () => window.removeEventListener('locker:update', handleUpdate);
    }, []);

  const createSyncPromise = (callback: () => void) => {
      return new Promise<void>(resolve => {
          callback();
          resolve();
      });
  };

  const unlockLocker = useCallback(() => {
    return createSyncPromise(() => {
        sessionStorage.setItem(LOCKER_KEY, 'true');
        setIsUnlocked(true);
        setLockerCookie(true); 
        console.log("HOOK LOG: Trạng thái Locker được đặt là TRUE (Mở khóa)");
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('locker:update', { detail: { isUnlocked: true } }));
        }
    });
  }, []);

  const lockLocker = useCallback(() => {
    return createSyncPromise(() => {
        sessionStorage.setItem(LOCKER_KEY, 'false');
        setIsUnlocked(false);
        setLockerCookie(false);
        console.log("HOOK LOG: Trạng thái Locker được đặt là FALSE (Khóa)");
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('locker:update', { detail: { isUnlocked: false } }));
        }
    });
  }, []);

  return { isUnlocked, unlockLocker, lockLocker };
}