import { apiClient } from './client';
import type { AgencyMembership } from './types';

// GET /agencies/me returns null when the creator isn't in an agency —
// see agencies.service.ts's myMembership().
export async function fetchMyAgency(): Promise<AgencyMembership | null> {
  const response = await apiClient.get<AgencyMembership | null>('/agencies/me');
  return response.data;
}
