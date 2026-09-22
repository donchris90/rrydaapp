import { apiClient } from './client';
import type { EffectName, FilterName, Speed } from '../video/editorConfig';

export interface EditSpecInput {
  trim?: { startMs: number; endMs: number };
  speed?: Speed;
  filter?: FilterName;
  effect?: EffectName;
  music?: { volumeOriginal: number; volumeMusic: number; startMs?: number };
}

export interface EditJob {
  id: string;
  status: 'QUEUED' | 'PROCESSING' | 'DONE' | 'FAILED';
  videoId: string | null;
  error: string | null;
}

export interface UploadGrant {
  storageKey: string;
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
}

export async function requestVideoUpload(contentType: string, sizeBytes: number): Promise<UploadGrant> {
  return (await apiClient.post<UploadGrant>('/videos/uploads', { contentType, sizeBytes })).data;
}

export async function requestEditUpload(asset: 'overlay' | 'music', contentType: string, sizeBytes: number): Promise<UploadGrant> {
  return (await apiClient.post<UploadGrant>('/videos/edits/uploads', { asset, contentType, sizeBytes })).data;
}

export async function createEdit(body: {
  sourceKey: string;
  overlayKey?: string | null;
  musicKey?: string | null;
  musicTitle?: string | null;
  spec: EditSpecInput;
  title: string;
  caption?: string;
  tag?: string;
  allowGifts?: boolean;
}): Promise<EditJob> {
  return (await apiClient.post<EditJob>('/videos/edits', body)).data;
}

export async function fetchEdit(jobId: string): Promise<EditJob> {
  return (await apiClient.get<EditJob>(`/videos/edits/${jobId}`)).data;
}

// Sends a file to a storage upload address, reporting progress (0..1). Uses the
// platform's XMLHttpRequest because plain fetch cannot report upload progress.
export async function putFile(uri: string, grant: UploadGrant, contentType: string, onProgress?: (fraction: number) => void): Promise<void> {
  const blob = await (await fetch(uri)).blob();
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(grant.method, grant.uploadUrl);
    for (const [k, v] of Object.entries(grant.headers ?? {})) xhr.setRequestHeader(k, v);
    if (!grant.headers?.['Content-Type']) xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error('Upload failed — check your connection'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));
    xhr.send(blob);
  });
}

export const fileSize = async (uri: string) => (await (await fetch(uri)).blob()).size;

// Publishes a video that was uploaded as it is (nothing to render).
export async function publishUploaded(body: { storageKey: string; title: string; caption?: string; tag?: string; allowGifts?: boolean; durationSeconds?: number }) {
  return (await apiClient.post<{ id: string }>('/videos', body)).data;
}

const VIDEO_TYPES: Record<string, string> = { mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm' };
export function videoContentType(uri: string): string {
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  return VIDEO_TYPES[ext] ?? 'video/mp4';
}

// The audio types the server accepts; a picker can report a vaguer one, so fall back to the file's extension.
const AUDIO_TYPES: Record<string, string> = { mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', wav: 'audio/wav', ogg: 'audio/ogg' };
const ACCEPTED_AUDIO = new Set(['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/ogg']);
export function audioContentType(mimeType: string | undefined, uri: string): string | null {
  if (mimeType && ACCEPTED_AUDIO.has(mimeType)) return mimeType;
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  return AUDIO_TYPES[ext] ?? null;
}
