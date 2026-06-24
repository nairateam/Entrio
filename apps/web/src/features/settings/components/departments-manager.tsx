'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Spinner,
} from '@/components/ui';
import { useAddDepartment, useDepartments, useRemoveDepartment } from '../hooks/use-departments';

export function DepartmentsManager() {
  const { data: departments = [], isLoading, isError } = useDepartments();
  const add = useAddDepartment();
  const remove = useRemoveDepartment();
  const [name, setName] = useState('');

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    add.mutate(trimmed, { onSuccess: () => setName('') });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Departments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          These options appear when inviting a user and in report filters.
        </p>

        {isError && <Alert variant="destructive">Could not load departments.</Alert>}

        {isLoading && departments.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <Spinner size={24} />
          </div>
        ) : departments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No departments yet. Add one below.</p>
        ) : (
          <ul className="space-y-2">
            {departments.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <span className="text-sm font-medium">{d.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${d.name}`}
                  onClick={() => remove.mutate(d.id)}
                  isLoading={remove.isPending && remove.variables === d.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
          <Input
            className="min-w-48 flex-1"
            placeholder="New department name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
          />
          <Button variant="outline" onClick={submit} disabled={!name.trim() || add.isPending}>
            Add department
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
