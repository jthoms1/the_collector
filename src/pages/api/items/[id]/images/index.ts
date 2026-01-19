import type { APIRoute } from 'astro';
import { getItem, getItemImages, addItemImage } from '../../../../../lib/db';
import type { CreateItemImageInput } from '../../../../../lib/schema';

export const GET: APIRoute = async ({ params }) => {
  try {
    const itemId = parseInt(params.id!);
    const item = getItem(itemId);

    if (!item) {
      return new Response(JSON.stringify({ error: 'Item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const images = getItemImages(itemId);

    return new Response(JSON.stringify({ images }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching item images:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch images' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

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

    const body = await request.json() as Omit<CreateItemImageInput, 'item_id'>;

    if (!body.image_path) {
      return new Response(JSON.stringify({ error: 'image_path is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const image = addItemImage({
      item_id: itemId,
      image_path: body.image_path,
      image_orientation: body.image_orientation,
      is_primary: body.is_primary,
      display_order: body.display_order
    });

    return new Response(JSON.stringify(image), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error adding item image:', error);
    return new Response(JSON.stringify({ error: 'Failed to add image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
