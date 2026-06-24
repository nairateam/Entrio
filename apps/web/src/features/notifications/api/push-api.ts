import { apiFetch } from '@/lib/api/client';

/** Web Push subscription data access layer. */

export function getPushPublicKey(): Promise<{ publicKey: string | null }> {
  return apiFetch<{ publicKey: string | null }>('/api/notifications/push/public-key');
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export function subscribePush(subscription: PushSubscriptionPayload): Promise<void> {
  return apiFetch<void>('/api/notifications/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
  });
}

export function unsubscribePush(endpoint: string): Promise<void> {
  return apiFetch<void>('/api/notifications/push/unsubscribe', {
    method: 'POST',
    body: JSON.stringify({ endpoint }),
  });
}
