import type { APIRoute } from 'astro';
import { getItem, getItemImage, updateItemImage, removeItemImage } from '../../../../../lib/db';
import { deleteImageFiles } from '../../../../../lib/images';
import type { UpdateItemImageInput } from '../../../../../lib/schema';

export const GET: APIRoute = async ({ params }) => {
  try {
    const imageId = parseInt(params.imageId!);
    const image = getItemImage(imageId);

    if (!image) {
      return new Response(JSON.stringify({ error: 'Image not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(image), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const itemId = parseInt(params.id!);
    const imageId = parseInt(params.imageId!);

    const item = getItem(itemId);
    if (!item) {
      return new Response(JSON.stringify({ error: 'Item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const existing = getItemImage(imageId);
    if (!existing || existing.item_id !== itemId) {
      return new Response(JSON.stringify({ error: 'Image not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as UpdateItemImageInput;
    const image = updateItemImage(imageId, body);

    return new Response(JSON.stringify(image), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating image:', error);
    return new Response(JSON.stringify({ error: 'Failed to update image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const itemId = parseInt(params.id!);
    const imageId = parseInt(params.imageId!);

    const item = getItem(itemId);
    if (!item) {
      return new Response(JSON.stringify({ error: 'Item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const existing = getItemImage(imageId);
    if (!existing || existing.item_id !== itemId) {
      return new Response(JSON.stringify({ error: 'Image not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = removeItemImage(imageId);

    if (result.success && result.imagePath) {
      // Delete image files from filesystem
      await deleteImageFiles(result.imagePath);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
