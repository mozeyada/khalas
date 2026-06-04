'use client';

import {useEffect} from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Delay by 1s so it doesn't race with initial hydration
    const timer = setTimeout(() => {
      navigator.serviceWorker
        .register('/sw.js', {scope: '/'})
        .then((registration) => {
          // Check for updates on each page load
          void registration.update();
        })
        .catch((err) => {
          // Non-fatal — app works without SW, just loses offline/PWA benefits
          console.warn('[SW] Registration failed:', err);
        });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
