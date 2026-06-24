/** System-wide configuration (PRD §2 super-admin, §4.6 overstay threshold). */
export interface SystemSettings {
  overstayThresholdHours: number;
  pushNotifications: boolean;
  emailNotifications: boolean;
}

/** An admin-managed department in the pick-list. */
export interface Department {
  id: string;
  name: string;
  createdAt: string;
}
