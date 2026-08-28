/**
 * Device Push / System Notification Utility
 * Supports Web Notification API and Service Worker notifications for desktop and mobile OS screens.
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && ('Notification' in window || 'serviceWorker' in navigator);
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  if ('Notification' in window) {
    return Notification.permission;
  }
  return 'default';
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';

  try {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission;
    }
  } catch (e) {
    console.warn('Error requesting notification permission:', e);
  }
  return 'denied';
}

export async function showDeviceNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    data?: any;
  }
): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  const bodyText = options?.body || '';
  const iconUrl = options?.icon || (typeof window !== 'undefined' ? window.location.origin + '/tarapti_logo_1784421680053.jpg' : '/tarapti_logo_1784421680053.jpg');
  const tagStr = options?.tag || 'tarapti-notif-' + Date.now();

  try {
    // 1. Try Service Worker registration first (works best on Mobile / Android Chrome / background)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          body: bodyText,
          icon: iconUrl,
          badge: iconUrl,
          tag: tagStr,
          data: options?.data,
          vibrate: [200, 100, 200],
          renotify: true
        } as any);
        return true;
      }
    }

    // 2. Fallback to standard Window Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const n = new Notification(title, {
        body: bodyText,
        icon: iconUrl,
        tag: tagStr
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
      return true;
    }
  } catch (err) {
    console.warn('Failed to show device notification:', err);
  }

  return false;
}
