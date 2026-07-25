import { getMatch } from '../route';

export async function GET(request, { params }) {
  const match = await getMatch(params.id);
  
  if (!match) {
    return Response.json({ error: 'Match not found' }, { status: 404 });
  }
  
  return Response.json(match);
}
