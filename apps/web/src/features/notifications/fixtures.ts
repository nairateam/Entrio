import type { NotificationItem } from './types';

const now = Date.now();
const minutesAgo = (mins: number) => new Date(now - mins * 60_000).toISOString();

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    type: 'arrival',
    title: 'Visitor arrived',
    body: 'Maria Garcia has checked in for her 10:00 interview.',
    createdAt: minutesAgo(4),
    read: false,
  },
  {
    id: 'n-2',
    type: 'override',
    title: 'Override requested',
    body: 'Sam Okonkwo requested an after-hours override for Liang Wei.',
    createdAt: minutesAgo(18),
    read: false,
  },
  {
    id: 'n-3',
    type: 'overstay',
    title: 'Overstay alert',
    body: 'Liang Wei has been on site for over 4 hours.',
    createdAt: minutesAgo(65),
    read: true,
  },
];
