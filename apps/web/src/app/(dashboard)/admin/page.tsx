'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { BarChart3, Ban, Flag, ScrollText, type LucideIcon } from 'lucide-react';
import { Card, CardContent, Spinner } from '@/components/ui';
import { SummaryCards, useReportsStore } from '@/features/reports';

const QUICK_LINKS: Array<{ href: string; icon: LucideIcon; title: string; description: string }> = [
  { href: '/admin/reports', icon: BarChart3, title: 'Reports', description: 'Activity, filters, export' },
  { href: '/admin/blocklist', icon: Ban, title: 'Blocklist', description: 'Building-wide denials' },
  { href: '/admin/flagged', icon: Flag, title: 'Flagged', description: 'Visitors to review' },
  { href: '/admin/audit', icon: ScrollText, title: 'Audit log', description: 'Every action, logged' },
];

export default function AdminOverviewPage() {
  const data = useReportsStore((s) => s.data);
  const init = useReportsStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Activity for the last 10 days. Jump into a management area below.
        </p>
      </div>

      {data ? (
        <SummaryCards summary={data.summary} />
      ) : (
        <div className="flex items-center justify-center py-12">
          <Spinner size={28} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {QUICK_LINKS.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href} className="group">
            <Card className="h-full transition-colors group-hover:border-primary">
              <CardContent className="space-y-2 p-4">
                <Icon className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
