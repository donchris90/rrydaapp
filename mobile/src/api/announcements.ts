import { apiClient } from './client';

export interface BannerItem {
  id: string;
  kind: 'CUSTOM' | 'BIG_WIN' | 'TOP_GIFT';
  text: string;
}

// The scrolling strip: messages the admin posted, plus what really just happened
// (the biggest recent game win and gift). Empty when there is nothing to say.
export async function fetchAnnouncements(): Promise<BannerItem[]> {
  const response = await apiClient.get<BannerItem[]>('/announcements');
  return response.data;
}
