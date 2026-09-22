import { apiClient } from './client';

export interface OwnVideo {
  id: string;
  title: string;
  caption: string | null;
  tag: string | null;
  videoUrl: string;
  durationSeconds: number | null;
  allowGifts: boolean;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  // "Song - Artist"; empty means the video's own sound.
  musicTitle: string | null;
  createdAt: string;
}

export interface FeedVideo extends OwnVideo {
  creator: { id: string; displayName: string | null; avatarUrl: string | null; followedByMe: boolean };
  likedByMe: boolean;
  commentCount: number;
  // How many gifts (tips) this video has received.
  giftCount: number;
}

export interface MyVideos {
  totals: { videos: number; views: number; likes: number };
  videos: OwnVideo[];
}

export async function fetchMyVideos(): Promise<MyVideos> {
  const response = await apiClient.get<MyVideos>('/videos/mine');
  return response.data;
}

// Newest first. Pass `before` (createdAt of the last item loaded) to page.
export type FeedTab = 'following' | 'popular' | 'hot';

// `following` pages by timestamp (`before`); `popular` and `hot` page by `offset`.
export async function fetchVideoFeed(params: { limit?: number; before?: string; tab?: FeedTab; offset?: number } = {}): Promise<FeedVideo[]> {
  const response = await apiClient.get<FeedVideo[]>('/videos', { params });
  return response.data;
}

export async function fetchVideo(id: string): Promise<FeedVideo> {
  const response = await apiClient.get<FeedVideo>(`/videos/${id}`);
  return response.data;
}

export async function updateVideo(
  id: string,
  changes: { title?: string; caption?: string; tag?: string; allowGifts?: boolean },
): Promise<OwnVideo> {
  const response = await apiClient.patch<OwnVideo>(`/videos/${id}`, changes);
  return response.data;
}

export async function deleteVideo(id: string): Promise<void> {
  await apiClient.delete(`/videos/${id}`);
}

export async function recordVideoView(id: string): Promise<void> {
  await apiClient.post(`/videos/${id}/view`);
}

export async function likeVideo(id: string): Promise<{ liked: boolean; likeCount: number }> {
  const response = await apiClient.post(`/videos/${id}/like`);
  return response.data;
}

export async function unlikeVideo(id: string): Promise<{ liked: boolean; likeCount: number }> {
  const response = await apiClient.delete(`/videos/${id}/like`);
  return response.data;
}

// ── Publishing ─────────────────────────────────────────────────────

interface UploadGrant {
  storageKey: string;
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresInSeconds: number;
}

const EXTENSION_TYPES: Record<string, string> = { mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm' };

function contentTypeOf(asset: { uri: string; mimeType?: string | null }): string {
  if (asset.mimeType && asset.mimeType.startsWith('video/')) return asset.mimeType;
  const ext = asset.uri.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_TYPES[ext] ?? 'video/mp4';
}

// The whole publish flow:
//   1. ask the backend for an upload URL (it validates type and size),
//   2. PUT the file straight to storage — video bytes never touch our API,
//   3. tell the backend the file is there so it can verify and publish it.
//
// The file is read into memory as a Blob for the PUT, which is fine for the
// short clips this targets (the backend caps uploads at 200 MB by default)
// but is the first thing to revisit — with expo-file-system's uploadAsync —
// if people start posting long videos.
export async function uploadAndPublish(params: {
  asset: { uri: string; mimeType?: string | null; duration?: number | null };
  title: string;
  caption?: string;
  tag?: string;
  allowGifts?: boolean;
}): Promise<OwnVideo> {
  const { asset } = params;
  const contentType = contentTypeOf(asset);

  const blob = await (await fetch(asset.uri)).blob();

  const grant = (await apiClient.post<UploadGrant>('/videos/uploads', { contentType, sizeBytes: blob.size })).data;

  // The dev MockStorageProvider hands out a mock:// URL nothing listens on;
  // skip the transfer so the rest of the flow can still be exercised.
  if (!grant.uploadUrl.startsWith('mock://')) {
    let lastError: unknown = null;
    let uploaded = false;
    for (let attempt = 0; attempt < 3 && !uploaded; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120_000);
        try {
          const put = await fetch(grant.uploadUrl, {
            method: grant.method,
            headers: grant.headers,
            body: blob,
            signal: controller.signal,
          });
          if (put.ok) {
            uploaded = true;
          } else {
            lastError = new Error(`Storage upload failed (${put.status})`);
            // Signed URLs can fail permanently on 4xx; retry transient storage errors.
            if (put.status >= 400 && put.status < 500) break;
          }
        } finally {
          clearTimeout(timeout);
        }
      } catch (e) {
        lastError = e;
      }
      if (!uploaded && attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
    if (!uploaded) {
      throw new Error(lastError instanceof Error ? lastError.message : 'Video upload failed. Please try again.');
    }
  }

  const response = await apiClient.post<OwnVideo>('/videos', {
    storageKey: grant.storageKey,
    title: params.title,
    caption: params.caption,
    tag: params.tag,
    allowGifts: params.allowGifts,
    // ImagePicker reports duration in milliseconds.
    durationSeconds: asset.duration != null ? Math.round(asset.duration / 1000) : undefined,
  });
  return response.data;
}

export interface VideoComment {
  id: string;
  text: string;
  createdAt: string;
  mine: boolean;
  user: { id: string; displayName: string | null; avatarUrl: string | null };
}

export async function fetchVideoComments(videoId: string, before?: string): Promise<VideoComment[]> {
  const response = await apiClient.get<VideoComment[]>(`/videos/${videoId}/comments`, { params: { limit: 30, before } });
  return response.data;
}

export async function postVideoComment(videoId: string, text: string): Promise<VideoComment> {
  const response = await apiClient.post<VideoComment>(`/videos/${videoId}/comments`, { text });
  return response.data;
}

export async function deleteVideoComment(videoId: string, commentId: string): Promise<void> {
  await apiClient.delete(`/videos/${videoId}/comments/${commentId}`);
}

export async function shareVideo(videoId: string): Promise<{ shareCount: number }> {
  const response = await apiClient.post<{ shareCount: number }>(`/videos/${videoId}/share`);
  return response.data;
}

export async function searchVideos(q: string): Promise<FeedVideo[]> {
  const response = await apiClient.get<FeedVideo[]>('/videos/search', { params: { q } });
  return response.data;
}
