// Service Worker Registration for Offline Maps

let swRegistration: ServiceWorkerRegistration | null = null;

export async function registerOfflineMapsSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw-offline-maps.js', {
      scope: '/',
    });

    swRegistration = registration;

    registration.addEventListener('updatefound', () => {
      console.log('[SW] New service worker found');
    });

    if (registration.installing) {
      console.log('[SW] Service worker installing');
    } else if (registration.waiting) {
      console.log('[SW] Service worker installed, waiting');
    } else if (registration.active) {
      console.log('[SW] Service worker active');
    }

    return registration;
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    return null;
  }
}

export function getServiceWorker(): ServiceWorker | null {
  if (!swRegistration) return null;
  return swRegistration.active || swRegistration.waiting || swRegistration.installing;
}

export async function unregisterOfflineMapsSW(): Promise<boolean> {
  if (!swRegistration) return false;
  
  try {
    const success = await swRegistration.unregister();
    if (success) {
      swRegistration = null;
    }
    return success;
  } catch (error) {
    console.error('[SW] Unregister failed:', error);
    return false;
  }
}

// Send message to service worker
export function postMessageToSW<T = unknown>(message: { type: string; payload?: T }): void {
  const sw = getServiceWorker();
  if (sw) {
    sw.postMessage(message);
  }
}

// Listen for messages from service worker
export function addSWMessageListener(
  callback: (event: MessageEvent) => void
): () => void {
  navigator.serviceWorker.addEventListener('message', callback);
  return () => navigator.serviceWorker.removeEventListener('message', callback);
}
