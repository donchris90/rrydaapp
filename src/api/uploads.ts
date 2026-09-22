import { apiClient } from './client';

// Uploads an image through the backend, which holds the image host's API key.
// (The key used to be bundled into the app itself, where anyone could pull it
// out of the APK.) `base64` is the raw base64 an ImagePicker asset gives you
// with `base64: true`; JPEG, PNG, GIF or WebP up to 5 MB. Returns the hosted URL.
export async function uploadImage(base64: string): Promise<string> {
  const response = await apiClient.post<{ url: string }>('/uploads/image', { base64 });
  return response.data.url;
}
