import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getVisitations, type VisitationsQuery } from '../api/visitations-api';

export const visitationKeys = {
  list: (q: VisitationsQuery) => ['visitations', q] as const,
};

/** A page of visitations; keeps the previous page visible while the next loads. */
export function useVisitations(query: VisitationsQuery) {
  return useQuery({
    queryKey: visitationKeys.list(query),
    queryFn: () => getVisitations(query),
    placeholderData: keepPreviousData,
  });
}
