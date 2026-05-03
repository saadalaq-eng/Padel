import { NextResponse } from 'next/server';
import { getPlayers } from '@/lib/firestore';

export async function GET() {
  try {
    const players = await getPlayers();
    return NextResponse.json(players);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
