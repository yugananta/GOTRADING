import { showDeviceNotification, requestNotificationPermission as reqPerm } from '../utils/pushNotification';

export const requestNotificationPermission = async () => {
  try {
    const perm = await reqPerm();
    return perm === 'granted';
  } catch (err) {
    console.warn("Could not request notification permission:", err);
  }
  return false;
};

export const showNotification = (title: string, body: string, icon?: string) => {
  const defaultIcon = typeof window !== 'undefined' ? window.location.origin + '/tarapti_logo_1784421680053.jpg' : '/tarapti_logo_1784421680053.jpg';
  showDeviceNotification(title, {
    body,
    icon: icon || defaultIcon,
    tag: "tarapti-push-" + Date.now()
  });
};
