// Deprecated shim. Image uploads now go through the backend (see ./uploads),
// which holds the image host's API key — it is no longer bundled into the app.
// Nothing should import this file any more; it is kept only so an old import
// can't break the build. Safe to delete.
export { uploadImage as uploadImageToImgBB } from './uploads';
