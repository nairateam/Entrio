/** In-app notification (PRD §3 notifications: arrival, override, overstay). */
export interface NotificationItem {
  id: string;
  type: 'arrival' | 'override' | 'overstay' | 'response';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}
