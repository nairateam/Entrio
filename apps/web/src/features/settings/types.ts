/** System-wide configuration (PRD §2 super-admin, §4.6 overstay threshold). */
export interface SystemSettings {
  overstayThresholdHours: number;
  smsNotifications: boolean;
  emailNotifications: boolean;
}
