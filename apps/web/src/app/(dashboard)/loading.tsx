import { Spinner } from '@/components/ui';

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner size={28} />
    </div>
  );
}
