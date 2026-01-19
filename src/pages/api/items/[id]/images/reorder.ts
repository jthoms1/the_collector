import type { APIRoute } from 'astro';
import { getItem, getItemImages, reorderItemImages } from '../../../../../lib/db';

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const itemId = parseInt(params.id!);
    const item = getItem(itemId);

    if (!item) {
      return new Response(JSON.stringify({ error: 'Item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as { image_ids: number[] };

    if (!body.image_ids || !Array.isArray(body.image_ids)) {
      return new Response(JSON.stringify({ error: 'image_ids array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    reorderItemImages(itemId, body.image_ids);
    const images = getItemImages(itemId);

    return new Response(JSON.stringify({ success: true, images }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error reordering images:', error);
    return new Response(JSON.stringify({ error: 'Failed to reorder images' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
