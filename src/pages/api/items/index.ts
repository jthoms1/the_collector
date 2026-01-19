import type { APIRoute } from 'astro';
import { getItems, createItem, countItems } from '../../../lib/db';
import type { CreateItemInput } from '../../../lib/schema';

export const GET: APIRoute = async ({ url }) => {
  try {
    const typeId = url.searchParams.get('type');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const items = getItems(typeId ? parseInt(typeId) : undefined, limit, offset);
    const total = countItems(typeId ? parseInt(typeId) : undefined);

    return new Response(JSON.stringify({
      items,
      total,
      limit,
      offset
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch items' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as CreateItemInput;

    // Validate required fields
    if (!body.collection_type_id || !body.name) {
      return new Response(JSON.stringify({
        error: 'collection_type_id and name are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const item = createItem(body);

    return new Response(JSON.stringify(item), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating item:', error);
    return new Response(JSON.stringify({ error: 'Failed to create item' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
