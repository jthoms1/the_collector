/**
 * Script to process existing images and generate thumbnails
 * Run with: npx tsx scripts/process-images.ts
 */

import sharp from 'sharp';
import path from 'path';
import { readdir, readFile, writeFile, stat } from 'fs/promises';
import Database from 'better-sqlite3';

const IMAGE_SIZES = {
  thumb: 480,
  medium: 1024,
};

const JPEG_QUALITY = 85;

type ImageOrientation = 'portrait' | 'landscape' | 'square';

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

function getResizedFilename(filename: string, suffix: string): string {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  return `${base}_${suffix}.jpeg`;
}

async function processImage(imagePath: string): Promise<{
  orientation: ImageOrientation;
  width: number;
  height: number;
  thumbCreated: boolean;
  mediumCreated: boolean;
} | null> {
  const filename = path.basename(imagePath);
  const dir = path.dirname(imagePath);

  // Skip if already a thumbnail or medium
  if (filename.includes('_thumb') || filename.includes('_medium')) {
    return null;
  }

  try {
    const buffer = await readFile(imagePath);
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    const orientation = getOrientation(width, height, metadata.orientation);

    let thumbCreated = false;
    let mediumCreated = false;

    // Generate medium version (always regenerate to ensure correct rotation)
    const mediumFilename = getResizedFilename(filename, 'medium');
    const mediumPath = path.join(dir, mediumFilename);
    await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF orientation
      .resize(IMAGE_SIZES.medium, IMAGE_SIZES.medium, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY })
      .toFile(mediumPath);
    mediumCreated = true;

    // Generate thumbnail (always regenerate to ensure correct rotation)
    const thumbFilename = getResizedFilename(filename, 'thumb');
    const thumbPath = path.join(dir, thumbFilename);
    await sharp(buffer)
      .rotate() // Auto-rotate based on EXIF orientation
      .resize(IMAGE_SIZES.thumb, IMAGE_SIZES.thumb, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY })
      .toFile(thumbPath);
    thumbCreated = true;

    return { orientation, width, height, thumbCreated, mediumCreated };
  } catch (error) {
    console.error(`Error processing ${imagePath}:`, error);
    return null;
  }
}

async function getAllImages(dir: string): Promise<string[]> {
  const images: string[] = [];
  const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const subImages = await getAllImages(fullPath);
        images.push(...subImages);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext) && !entry.name.includes('_thumb') && !entry.name.includes('_medium')) {
          images.push(fullPath);
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist
  }

  return images;
}

async function updateDatabase(
  db: Database.Database,
  imagePath: string,
  orientation: ImageOrientation
): Promise<boolean> {
  // Convert full path to relative URL path
  const cwd = process.cwd();
  let relativePath = imagePath.replace(cwd, '');

  // Normalize path separators and ensure it starts with /
  relativePath = relativePath.replace(/\\/g, '/');
  if (!relativePath.startsWith('/')) {
    relativePath = '/' + relativePath;
  }

  // Handle public folder - images served from /item_images/ not /public/item_images/
  if (relativePath.startsWith('/public/')) {
    relativePath = relativePath.replace('/public', '');
  }

  const result = db.prepare(
    'UPDATE items SET image_orientation = ? WHERE image_path = ?'
  ).run(orientation, relativePath);

  return result.changes > 0;
}

async function main() {
  console.log('Processing existing images...\n');

  // Find all images in public/item_images and Cards/Comics folders
  const imageDirs = [
    path.join(process.cwd(), 'public', 'item_images'),
    path.join(process.cwd(), 'Cards'),
    path.join(process.cwd(), 'Comics'),
  ];

  let allImages: string[] = [];
  for (const dir of imageDirs) {
    const images = await getAllImages(dir);
    allImages.push(...images);
  }

  console.log(`Found ${allImages.length} images to process.\n`);

  if (allImages.length === 0) {
    console.log('No images found.');
    return;
  }

  // Open database connection
  const dbPath = path.join(process.cwd(), 'collection.db');
  const db = new Database(dbPath);

  let processed = 0;
  let thumbsCreated = 0;
  let mediumsCreated = 0;
  let dbUpdated = 0;
  let errors = 0;

  for (const imagePath of allImages) {
    const filename = path.basename(imagePath);
    process.stdout.write(`Processing ${filename}...`);

    const result = await processImage(imagePath);
    if (result) {
      processed++;
      if (result.thumbCreated) thumbsCreated++;
      if (result.mediumCreated) mediumsCreated++;

      // Update database
      const updated = await updateDatabase(db, imagePath, result.orientation);
      if (updated) {
        dbUpdated++;
        console.log(` ${result.orientation} (${result.width}x${result.height}) - DB updated`);
      } else {
        console.log(` ${result.orientation} (${result.width}x${result.height})`);
      }
    } else {
      errors++;
      console.log(' skipped');
    }
  }

  db.close();

  console.log('\n--- Summary ---');
  console.log(`Images processed: ${processed}`);
  console.log(`Thumbnails created: ${thumbsCreated}`);
  console.log(`Medium images created: ${mediumsCreated}`);
  console.log(`Database records updated: ${dbUpdated}`);
  console.log(`Errors/skipped: ${errors}`);
}

main().catch(console.error);
