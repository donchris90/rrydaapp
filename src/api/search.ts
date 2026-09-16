import { apiClient } from './client';
import type { FeedUser } from './types';

// search.controller.ts's GET /search/users has existed since the Search
// module shipped, just with no screen calling it yet (see SearchScreen.tsx).
export async function searchUsers(query: string): Promise<FeedUser[]> {
  const response = await apiClient.get<FeedUser[]>('/search/users', { params: { q: query } });
  return response.data;
}
