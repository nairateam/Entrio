import { redirect } from 'next/navigation';

// Working hours now lives under Settings (PRD v1.1 §2). Keep the old link working.
export default function WorkingHoursPage() {
  redirect('/admin/settings');
}
