import type { APIRoute } from 'astro';
import { searchItems } from '../../lib/db';
import type { SearchParams } from '../../lib/schema';

export const GET: APIRoute = async ({ url }) => {
  try {
    const params: SearchParams = {
      q: url.searchParams.get('q') || undefined,
      type: url.searchParams.get('type') ? parseInt(url.searchParams.get('type')!) : undefined,
      minValue: url.searchParams.get('minValue') ? parseFloat(url.searchParams.get('minValue')!) : undefined,
      maxValue: url.searchParams.get('maxValue') ? parseFloat(url.searchParams.get('maxValue')!) : undefined,
      condition: url.searchParams.get('condition') || undefined,
      year: url.searchParams.get('year') ? parseInt(url.searchParams.get('year')!) : undefined,
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 50,
      offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0,
    };

    const items = searchItems(params);

    return new Response(JSON.stringify({
      items,
      params
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error searching items:', error);
    return new Response(JSON.stringify({ error: 'Failed to search items' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
