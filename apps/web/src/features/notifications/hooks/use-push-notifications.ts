'use client';

import { useEffect, useState } from 'react';
import { toast } from '@/components/ui';
import { getPushPublicKey, subscribePush } from '../api/push-api';

/** Convert a base64url VAPID key to the ArrayBuffer the Push API expects. */
function vapidKeyToBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) view[i] = raw.charCodeAt(i);
  return buffer;
}

type PermissionState = NotificationPermission | 'unsupported';

/**
 * Manages this browser's Web Push subscription: registers the service worker,
 * requests permission, subscribes via the Push API, and saves it to the API.
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<PermissionState>('default');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const supported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  useEffect(() => {
    setPermission(supported ? Notification.permission : 'unsupported');
  }, [supported]);

  const subscribe = async () => {
    if (!supported) {
      toast.error('Push notifications are not supported in this browser.');
      return;
    }
    setIsSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');

      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        toast.error('Notifications are blocked. Enable them in your browser settings.');
        return;
      }

      const { publicKey } = await getPushPublicKey();
      if (!publicKey) {
        toast.error('Push notifications are not configured on the server.');
        return;
      }

      const ready = await navigator.serviceWorker.ready.catch(() => registration);
      const existing = await ready.pushManager.getSubscription();
      const subscription =
        existing ??
        (await ready.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKeyToBuffer(publicKey),
        }));

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error('Incomplete subscription');
      }
      await subscribePush({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });

      toast.success('Push notifications enabled on this device.');
    } catch {
      toast.error('Could not enable push notifications.');
    } finally {
      setIsSubscribing(false);
    }
  };

  return { supported, permission, isSubscribing, subscribe };
}
