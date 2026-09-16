import { IMGBB_API_KEY } from '../config';

// ImgBB's real REST API — POST the image as base64 form data, get back a
// real, permanent (or expiring, if you pass an expiration param — not
// used here, so these are permanent) hosted URL. No SDK needed, it's a
// plain HTTP endpoint.
export async function uploadImageToImgBB(base64: string): Promise<string> {
  if (!IMGBB_API_KEY) {
    throw new Error("ImgBB API key is not configured — set app.json's expo.extra.imgbbApiKey");
  }

  const formData = new FormData();
  formData.append('image', base64);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData,
  });

  const json = await response.json();
  if (!response.ok || !json?.data?.url) {
    throw new Error(json?.error?.message ?? 'Image upload failed');
  }
  return json.data.url as string;
}
