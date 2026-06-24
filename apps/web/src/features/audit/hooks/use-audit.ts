import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getAuditLog, type AuditQuery } from '../api/audit-api';

export const auditKeys = {
  list: (query: AuditQuery) => ['audit', query] as const,
};

/** A page of audit entries; keeps the previous page while the next loads. */
export function useAuditLog(query: AuditQuery) {
  return useQuery({
    queryKey: auditKeys.list(query),
    queryFn: () => getAuditLog(query),
    placeholderData: keepPreviousData,
  });
}
