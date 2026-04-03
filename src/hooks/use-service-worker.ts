'use client';

import { useEffect } from 'react';

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Every hour

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              // New content is available
              if (navigator.serviceWorker.controller) {
                // Optionally notify user about update
                console.log('[PWA] New content available, refresh for updates.');
              }
            }
          });
        });
      } catch (error) {
        console.warn('[PWA] Service worker registration failed:', error);
      }
    };

    registerSW();
  }, []);
}
