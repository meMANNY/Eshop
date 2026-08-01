import ImageKit from '@imagekit/nodejs';

/**
 * Reusable ImageKit client + helpers.
 *
 * NOTE: `@imagekit/nodejs` is the server SDK and is PRIVATE-KEY ONLY.
 * Its constructor does not accept `publicKey` or `urlEndpoint` — the private
 * key authenticates and signs everything, and `urlEndpoint` is supplied
 * per-call to `buildSrc`.
 *
 * Environment variables:
 *   IMAGEKIT_PRIVATE_KEY   - server-side private key (required)
 *   IMAGEKIT_URL_ENDPOINT  - e.g. https://ik.imagekit.io/your_id (needed for buildUrl)
 */

const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

if (!privateKey) {
  throw new Error('IMAGEKIT_PRIVATE_KEY is not set in the environment');
}

// Single shared client — reuse across the app instead of constructing per call.
export const imagekit = new ImageKit({
  privateKey,
});

export interface UploadFileOptions {
  /**
   * The file to upload. Accepts a public URL, a base64 data string, or binary
   * (Buffer). In the browser-to-backend flow, send the image as a base64 string.
   */
  file: string | Buffer;
  fileName: string;
  /** Destination folder in the media library, e.g. "/products". */
  folder?: string;
  tags?: string[];
  customMetadata?: Record<string, unknown>;
  /** Appends a random suffix to avoid name collisions. Defaults to true. */
  useUniqueFileName?: boolean;
  isPrivateFile?: boolean;
}

/**
 * Upload a single file to ImageKit and return the created File object.
 */
export const uploadFile = async ({
  file,
  fileName,
  folder,
  tags,
  customMetadata,
  useUniqueFileName = true,
  isPrivateFile = false,
}: UploadFileOptions) => {
  return imagekit.files.upload({
    file: file as string,
    fileName,
    folder,
    tags,
    customMetadata,
    useUniqueFileName,
    isPrivateFile,
  });
};

/**
 * Delete a single file by its ImageKit fileId.
 */
export const deleteFile = async (fileId: string): Promise<void> => {
  await imagekit.files.delete(fileId);
};

/**
 * Delete many files at once (max 100 per ImageKit bulk request; chunk beyond that).
 */
export const deleteFiles = async (fileIds: string[]) => {
  return imagekit.files.bulk.delete({ fileIds });
};

export interface BuildUrlOptions {
  /** File path within the endpoint, e.g. "/products/img.jpg". */
  src: string;
  transformation?: ImageKit.Transformation[];
  signed?: boolean;
  expiresIn?: number;
}

/**
 * Build a (optionally transformed / signed) delivery URL for a stored asset.
 */
export const buildUrl = ({
  src,
  transformation,
  signed,
  expiresIn,
}: BuildUrlOptions): string => {
  if (!urlEndpoint) {
    throw new Error('IMAGEKIT_URL_ENDPOINT is not set in the environment');
  }

  return imagekit.helper.buildSrc({
    urlEndpoint,
    src,
    transformation,
    signed,
    expiresIn,
  });
};

export default imagekit;
