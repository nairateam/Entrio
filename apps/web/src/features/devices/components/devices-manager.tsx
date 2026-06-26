'use client';

import { useState } from 'react';
import { Copy, MonitorSmartphone } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  toast,
} from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { useCreateDevice, useDevices, useRevokeDevice } from '../hooks/use-devices';
import type { CreatedDevice } from '../types';

export function DevicesManager() {
  const { data: devices, isLoading } = useDevices();
  const create = useCreateDevice();
  const revoke = useRevokeDevice();

  const [label, setLabel] = useState('');
  const [created, setCreated] = useState<CreatedDevice | null>(null);

  function addDevice() {
    if (!label.trim()) return;
    create.mutate(label.trim(), {
      onSuccess: (device) => {
        setCreated(device);
        setLabel('');
      },
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold">Add a device</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a credential for a shared check-in device. The token is shown once.
          </p>
          <div className="mt-4 flex gap-2">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Main Lobby Device"
              onKeyDown={(e) => e.key === 'Enter' && addDevice()}
            />
            <Button onClick={addDevice} isLoading={create.isPending} disabled={!label.trim()}>
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading devices…</p>
          ) : !devices?.length ? (
            <p className="p-6 text-sm text-muted-foreground">No devices yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {devices.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    <MonitorSmartphone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{d.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {formatDateTime(d.createdAt)} ·{' '}
                        {d.lastUsedAt ? `last used ${formatDateTime(d.lastUsedAt)}` : 'never used'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={d.isActive ? 'success' : 'secondary'}>
                      {d.isActive ? 'Active' : 'Revoked'}
                    </Badge>
                    {d.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revoke.mutate(d.id)}
                        isLoading={revoke.isPending && revoke.variables === d.id}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Modal open={Boolean(created)} onClose={() => setCreated(null)} size="lg">
        <ModalHeader>
          <ModalTitle>Device token — copy it now</ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <Alert variant="warning">
            This token is shown <strong>once</strong>. Store it somewhere safe — you can’t see it again.
            If lost, revoke this device and create a new one.
          </Alert>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-md border border-border bg-muted/40 p-3 text-xs">
              {created?.apiToken}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (created) {
                  void navigator.clipboard.writeText(created.apiToken);
                  toast.success('Copied');
                }
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            On the device, open <code>/setup</code> and paste this token to pair it.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => setCreated(null)}>Done</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
