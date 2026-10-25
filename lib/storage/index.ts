import "server-only";
import { localStorageDriver } from "./local";

/**
 * Image storage behind one interface. Development writes to /public/uploads; a Cloudinary or
 * UploadThing driver can implement the same interface and be selected with STORAGE_DRIVER.
 */
export interface ImageStorage {
  save(file: File): Promise<{ url: string }>;
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export function getStorage(): ImageStorage {
  switch (process.env.STORAGE_DRIVER ?? "local") {
    case "local":
      return localStorageDriver;
    default:
      throw new Error(`Unknown STORAGE_DRIVER "${process.env.STORAGE_DRIVER}"`);
  }
}
