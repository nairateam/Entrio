/** A shared self-service check-in device (PRD v2 §2.1). */
export interface Device {
  id: string;
  label: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

/** Returned only at creation — the plaintext token is shown once and never again. */
export interface CreatedDevice extends Device {
  apiToken: string;
}
