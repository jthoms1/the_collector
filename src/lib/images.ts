import sharp from 'sharp';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import type { ImageOrientation } from './schema';

export interface ImageSizes {
  thumb: number;   // 480px max dimension
  medium: number;  // 1024px max dimension
}

export const IMAGE_SIZES: ImageSizes = {
  thumb: 480,
  medium: 1024,
};

export const JPEG_QUALITY = 85;

export interface ProcessedImage {
  original: string;
  medium: string;
  thumb: string;
  orientation: ImageOrientation;
  width: number;
  height: number;
}

function getOrientation(width: number, height: number, exifOrientation?: number): ImageOrientation {
  // EXIF orientations 5, 6, 7, 8 swap width and height
  const rotated = exifOrientation && exifOrientation >= 5 && exifOrientation <= 8;
  const effectiveWidth = rotated ? height : width;
  const effectiveHeight = rotated ? width : height;

  const ratio = effectiveWidth / effectiveHeight;
  if (ratio > 1.1) return 'landscape';
  if (ratio < 0.9) return 'portrait';
  return 'square';
}

/**
 * Generate a resized filename
 * e.g., "1234567890-abc123.jpg" -> "1234567890-abc123_thumb.jpg"
 */
function getResizedFilename(filename: string, suffix: string): string {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  return `${base}_${suffix}${ext}`;
}

/**
 * Process an image buffer and generate thumbnail and medium versions
 */
export async function processImage(
  buffer: Buffer,
  filename: string,
  outputDir: string
): Promise<ProcessedImage> {
  // Get image metadata
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const orientation = getOrientation(width, height, metadata.orientation);

  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });

  // Save original
  const originalPath = path.join(outputDir, filename);
  await writeFile(originalPath, buffer);

  // Generate medium version (1024px max)
  const mediumFilename = getResizedFilename(filename, 'medium');
  const mediumPath = path.join(outputDir, mediumFilename);
  await sharp(buffer)
    .rotate() // Auto-rotate based on EXIF orientation
    .resize(IMAGE_SIZES.medium, IMAGE_SIZES.medium, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY })
    .toFile(mediumPath);

  // Generate thumbnail (480px max)
  const thumbFilename = getResizedFilename(filename, 'thumb');
  const thumbPath = path.join(outputDir, thumbFilename);
  await sharp(buffer)
    .rotate() // Auto-rotate based on EXIF orientation
    .resize(IMAGE_SIZES.thumb, IMAGE_SIZES.thumb, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY })
    .toFile(thumbPath);

  return {
    original: filename,
    medium: mediumFilename,
    thumb: thumbFilename,
    orientation,
    width,
    height,
  };
}

/**
 * Process an existing image file and generate thumbnails
 */
export async function processExistingImage(
  imagePath: string
): Promise<ProcessedImage | null> {
  const { readFile } = await import('fs/promises');

  try {
    const buffer = await readFile(imagePath);
    const dir = path.dirname(imagePath);
    const filename = path.basename(imagePath);

    // Skip if this is already a thumbnail or medium
    if (filename.includes('_thumb') || filename.includes('_medium')) {
      return null;
    }

    return await processImage(buffer, filename, dir);
  } catch (error) {
    console.error(`Failed to process image ${imagePath}:`, error);
    return null;
  }
}

/**
 * Get URL paths for different image sizes
 */
export function getImageUrls(imagePath: string | null): {
  original: string | null;
  medium: string | null;
  thumb: string | null;
} {
  if (!imagePath) {
    return { original: null, medium: null, thumb: null };
  }

  const ext = path.extname(imagePath);
  const base = imagePath.slice(0, -ext.length);

  return {
    original: imagePath,
    medium: `${base}_medium.jpeg`,
    thumb: `${base}_thumb.jpeg`,
  };
}

/**
 * Delete an image and its resized versions from the filesystem
 */
export async function deleteImageFiles(imagePath: string): Promise<void> {
  const { unlink } = await import('fs/promises');

  const baseDir = process.cwd();
  const fullPath = path.join(baseDir, imagePath.replace(/^\//, ''));

  // Delete original
  await unlink(fullPath).catch(() => {});

  // Delete sized versions
  const ext = path.extname(fullPath);
  const base = fullPath.slice(0, -ext.length);
  await unlink(`${base}_medium.jpeg`).catch(() => {});
  await unlink(`${base}_thumb.jpeg`).catch(() => {});
}
