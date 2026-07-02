import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminPassword, name } = body as { adminPassword?: string; name?: string };

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }

    const playerName = name.trim();
    const id = playerName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const createdAt = new Date().toISOString();

    const db = getAdminDb();

    // Check if a player with the same name already exists
    const existing = await db.collection('players').where('name', '==', playerName).limit(1).get();
    if (!existing.empty) {
      return NextResponse.json({ error: `Player "${playerName}" already exists` }, { status: 409 });
    }

    const playerData = {
      name: playerName,
      photoUrl: null,
      createdAt,
    };

    await db.collection('players').doc(id).set(playerData);

    return NextResponse.json({ id, name: playerName, createdAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
