'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Avatar, Badge, Button, Spinner } from '@/components/ui';
import { DashboardNav } from '@/components/shared/dashboard-nav';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { NAV_BY_ROLE, ROLE_LABELS } from '@/config/navigation';
import { authApi } from '@/features/auth';
import { NotificationBell } from '@/features/notifications';
import { initials } from '@/lib/format';
import { useAuthStore } from '@/stores/auth-store';
import type { NavItem } from '@/config/navigation';
import type { User } from '@entrio/types';

function SidebarContent({
  user,
  items,
  onNavigate,
}: {
  user: User;
  items: NavItem[];
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex h-16 items-center border-b border-border px-6">
        <span className="text-lg font-semibold">Entrio</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4" onClick={onNavigate}>
        <DashboardNav items={items} />
      </div>
      <div className="flex items-center gap-3 border-t border-border p-4">
        <Avatar fallback={initials(user.fullName)} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.fullName}</p>
          <Badge variant="secondary" className="mt-0.5">
            {ROLE_LABELS[user.role]}
          </Badge>
        </div>
      </div>
    </>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const storeSignOut = useAuthStore((s) => s.signOut);
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const signOut = async () => {
    await authApi.logout();
    storeSignOut();
    router.push('/login');
  };

  // Middleware guarantees an authenticated session here; a null user means the
  // store is still hydrating from the session cookie on first load/refresh.
  if (!user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner size={28} />
      </div>
    );
  }

  const items = NAV_BY_ROLE[user.role];

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
        <SidebarContent user={user} items={items} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-card animate-fade-in">
            <SidebarContent user={user} items={items} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-2 border-b border-border px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex flex-1 items-center justify-end gap-2">
            <NotificationBell />
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
