import type { APIRoute } from 'astro';
import path from 'path';
import { processImage } from '../../lib/images';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const collectionType = formData.get('type') as string || 'Cards';

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({
        error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(JSON.stringify({
        error: 'File too large. Maximum size is 10MB'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique filename
    const ext = path.extname(file.name) || '.jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${random}${ext}`;

    // Determine upload directory
    const folder = collectionType.toLowerCase() === 'comics' ? 'Comics' : 'Cards';
    const uploadDir = path.join(process.cwd(), folder);

    // Process image and generate thumbnails
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await processImage(buffer, filename, uploadDir);

    return new Response(JSON.stringify({
      success: true,
      filename: result.original,
      path: `/${folder}/${result.original}`,
      thumbPath: `/${folder}/${result.thumb}`,
      mediumPath: `/${folder}/${result.medium}`,
      orientation: result.orientation,
      width: result.width,
      height: result.height
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return new Response(JSON.stringify({ error: 'Failed to upload file' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
