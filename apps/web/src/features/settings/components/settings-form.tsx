'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Spinner,
  Switch,
  toast,
} from '@/components/ui';
import { getSettings, updateSettings } from '../api/settings-api';
import type { SystemSettings } from '../types';

export function SettingsForm() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void getSettings().then(setSettings);
  }, []);

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  const patch = (next: Partial<SystemSettings>) => setSettings({ ...settings, ...next });

  const save = async () => {
    setIsSaving(true);
    try {
      const saved = await updateSettings(settings);
      setSettings(saved);
      toast.success('Settings saved.');
    } catch {
      toast.error('Could not save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="text-base">System settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="overstay">Overstay threshold (hours)</Label>
          <Input
            id="overstay"
            type="number"
            min={1}
            max={24}
            className="w-32"
            value={settings.overstayThresholdHours}
            onChange={(e) => patch({ overstayThresholdHours: Number(e.target.value) })}
          />
          <p className="text-xs text-muted-foreground">
            Visitors still checked in past this many hours are flagged as overstays.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">SMS notifications</p>
            <p className="text-xs text-muted-foreground">Send host arrival alerts via SMS.</p>
          </div>
          <Switch
            checked={settings.smsNotifications}
            onCheckedChange={(checked) => patch({ smsNotifications: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Email notifications</p>
            <p className="text-xs text-muted-foreground">Send host arrival alerts via email.</p>
          </div>
          <Switch
            checked={settings.emailNotifications}
            onCheckedChange={(checked) => patch({ emailNotifications: checked })}
          />
        </div>

        <Button onClick={() => void save()} isLoading={isSaving}>
          Save settings
        </Button>
      </CardContent>
    </Card>
  );
}
