import { getMatch } from '../route';

export async function GET(request, context) {
  const { id } = await context.params;

  const match = await getMatch(id);

  if (!match) {
    return Response.json({ error: 'Match not found' }, { status: 404 });
  }

  return Response.json(match);
}
