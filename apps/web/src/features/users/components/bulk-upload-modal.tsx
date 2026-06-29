'use client';

import { useRef, useState } from 'react';
import { Download, FileUp } from 'lucide-react';
import {
  Alert,
  Badge,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  toast,
} from '@/components/ui';
import { useBulkInviteUsers } from '../hooks/use-users';
import type { BulkInviteResult } from '../api/users-api';
import { CSV_TEMPLATE, parseUsersCsv, type ParseResult } from '../csv';

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'entrio-users-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function BulkUploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [result, setResult] = useState<BulkInviteResult | null>(null);
  const bulk = useBulkInviteUsers();

  const reset = () => {
    setFileName('');
    setParsed(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const close = () => {
    reset();
    onClose();
  };

  const onFile = async (file: File) => {
    setResult(null);
    setFileName(file.name);
    const text = await file.text();
    setParsed(parseUsersCsv(text));
  };

  const submit = () => {
    if (!parsed?.valid.length) return;
    bulk.mutate(parsed.valid, {
      onSuccess: (res) => {
        setResult(res);
        if (res.created.length) toast.success(`Invited ${res.created.length} user(s).`);
        if (res.failed.length) toast.error(`${res.failed.length} row(s) could not be invited.`);
      },
      onError: () => toast.error('Bulk invite failed.'),
    });
  };

  if (!open) return null;

  const validCount = parsed?.valid.length ?? 0;
  const errorCount = parsed ? parsed.rows.length - validCount : 0;

  return (
    <Modal open onClose={close} size="lg" ariaLabel="Bulk upload users">
      <ModalHeader>
        <ModalTitle>Bulk upload users</ModalTitle>
      </ModalHeader>
      <ModalBody className="space-y-4">
        {result ? (
          // --- Post-submit summary ---
          <div className="space-y-3">
            <Alert variant={result.failed.length ? 'warning' : 'success'}>
              Invited {result.created.length} of {result.total}. {result.failed.length} failed.
            </Alert>
            {result.failed.length > 0 && (
              <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <tbody>
                    {result.failed.map((f) => (
                      <tr key={`${f.index}-${f.email}`} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 text-muted-foreground">{f.email || '(no email)'}</td>
                        <td className="px-3 py-2 text-destructive">{f.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-4">
              <div className="text-sm">
                <p className="font-medium">CSV format</p>
                <p className="text-muted-foreground">
                  Columns: <span className="font-mono">fullName, email, role, department</span>. Role is
                  one of <span className="font-mono">security</span>, <span className="font-mono">host</span>,
                  or <span className="font-mono">admin</span>. Department is optional.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4" />
                Template
              </Button>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onFile(file);
              }}
            />
            <Button type="button" variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
              <FileUp className="h-4 w-4" />
              {fileName || 'Choose a CSV file'}
            </Button>

            {parsed?.headerError && <Alert variant="destructive">{parsed.headerError}</Alert>}

            {parsed && !parsed.headerError && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="success">{validCount} ready</Badge>
                  {errorCount > 0 && <Badge variant="destructive">{errorCount} with errors</Badge>}
                </div>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-muted/60 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Email</th>
                        <th className="px-3 py-2 font-medium">Role</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.map((row) => (
                        <tr key={row.line} className="border-t border-border">
                          <td className="px-3 py-2">{row.raw.fullName || '—'}</td>
                          <td className="px-3 py-2 text-muted-foreground">{row.raw.email || '—'}</td>
                          <td className="px-3 py-2 text-muted-foreground">{row.raw.role || '—'}</td>
                          <td className="px-3 py-2">
                            {row.ok ? (
                              <span className="text-success">Ready</span>
                            ) : (
                              <span className="text-destructive">{row.error}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </ModalBody>
      <ModalFooter>
        {result ? (
          <Button onClick={close}>Done</Button>
        ) : (
          <>
            <Button type="button" variant="ghost" onClick={close} disabled={bulk.isPending}>
              Cancel
            </Button>
            <Button onClick={submit} isLoading={bulk.isPending} disabled={validCount === 0}>
              Invite {validCount || ''} user{validCount === 1 ? '' : 's'}
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
