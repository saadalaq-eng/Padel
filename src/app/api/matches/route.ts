import { NextRequest, NextResponse } from 'next/server';
import { getMatches, getMatchesBetween } from '@/lib/firestore';

export async function GET(req: NextRequest) {
  try {
    const since = req.nextUrl.searchParams.get('since');

    const matches = since
      ? await getMatchesBetween(new Date(since), new Date())
      : await getMatches();

    return NextResponse.json(matches);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
