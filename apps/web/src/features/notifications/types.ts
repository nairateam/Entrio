/** In-app notification (PRD §3 + v2 self-service exception). */
export interface NotificationItem {
  id: string;
  type: 'arrival' | 'override' | 'overstay' | 'response' | 'exception' | 'assignment';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}
