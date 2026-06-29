import { describe, it, expect } from 'vitest';
import { VisitStatus } from '@entrio/types';
import { filterVisits, insideVisits } from './utils';
import type { BoardVisit } from './types';

function visit(overrides: Partial<BoardVisit>): BoardVisit {
  return {
    id: 'v',
    visitorId: 'vis-v',
    visitorName: 'Test Visitor',
    visitorPhone: '+1 555 0000',
    photoUrl: null,
    hostName: 'Test Host',
    requestedHostName: null,
    purpose: null,
    status: VisitStatus.CHECKED_IN,
    checkInTime: null,
    checkOutTime: null,
    expectedTime: null,
    hostResponse: null,
    ...overrides,
  };
}

const visits: BoardVisit[] = [
  visit({ id: '1', visitorName: 'Maria Garcia', status: VisitStatus.CHECKED_IN }),
  visit({ id: '2', visitorName: 'John Smith', status: VisitStatus.CHECKED_OUT }),
  visit({ id: '3', visitorName: 'Liang Wei', hostName: 'Priya Patel', status: VisitStatus.CHECKED_IN }),
  visit({ id: '4', visitorName: 'Carlos Mendez', status: VisitStatus.EXPECTED }),
];

describe('insideVisits', () => {
  it('returns only checked-in visitors', () => {
    expect(insideVisits(visits).map((v) => v.id)).toEqual(['1', '3']);
  });
});

describe('filterVisits', () => {
  it('filters by status', () => {
    const result = filterVisits(visits, '', VisitStatus.CHECKED_OUT);
    expect(result.map((v) => v.id)).toEqual(['2']);
  });

  it('matches the query against visitor name', () => {
    const result = filterVisits(visits, 'maria', 'all');
    expect(result.map((v) => v.id)).toEqual(['1']);
  });

  it('matches the query against host name', () => {
    const result = filterVisits(visits, 'priya', 'all');
    expect(result.map((v) => v.id)).toEqual(['3']);
  });

  it('combines status and query filters', () => {
    const result = filterVisits(visits, 'liang', VisitStatus.CHECKED_IN);
    expect(result.map((v) => v.id)).toEqual(['3']);
  });

  it('returns everything with no filters', () => {
    expect(filterVisits(visits, '', 'all')).toHaveLength(4);
  });
});
