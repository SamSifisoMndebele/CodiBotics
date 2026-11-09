import { useState, useEffect } from 'react';

export interface OfflinePWAStatus {
  isOnline: boolean;
  offlineReady: boolean;
  lastSavedAt: string | null;
}

export function useOfflinePWA() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [offlineReady, setOfflineReady] = useState<boolean>(true);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setOfflineReady(true);
      }).catch(() => {
        setOfflineReady(true);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const markSaved = () => {
    const now = new Date();
    setLastSavedAt(
      now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
  };

  return {
    isOnline,
    offlineReady,
    lastSavedAt,
    markSaved,
  };
}
