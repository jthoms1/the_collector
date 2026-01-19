import { defineMiddleware } from 'astro:middleware';
import fs from 'fs';
import path from 'path';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Serve images from Cards and Comics directories
  if (pathname.startsWith('/Cards/') || pathname.startsWith('/Comics/')) {
    const filePath = path.join(process.cwd(), pathname);

    try {
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
          };
          const contentType = mimeTypes[ext] || 'application/octet-stream';
          const fileContent = fs.readFileSync(filePath);

          return new Response(fileContent, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000'
            }
          });
        }
      }
    } catch (error) {
      console.error('Error serving image:', error);
    }
  }

  return next();
});
