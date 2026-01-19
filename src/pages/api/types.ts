import type { APIRoute } from 'astro';
import { getCollectionTypes } from '../../lib/db';

export const GET: APIRoute = async () => {
  try {
    const types = getCollectionTypes();

    return new Response(JSON.stringify(types), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching collection types:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch collection types' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
