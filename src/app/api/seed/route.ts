import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const PLAYERS = [
  { id: 'yazeed-m', name: 'Yazeed M' },
  { id: 'fahad-m', name: 'Fahad M' },
  { id: 'abdullah', name: 'Abdullah' },
  { id: 'saad', name: 'Saad' },
  { id: 'yazeed', name: 'Yazeed' },
  { id: 'abdulmohsen', name: 'Abdulmohsen' },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { adminPassword } = body as { adminPassword?: string };

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const createdAt = new Date().toISOString();

    await Promise.all(
      PLAYERS.map((player) =>
        adminDb
          .collection('players')
          .doc(player.id)
          .set(
            {
              name: player.name,
              photoUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(player.name)}&backgroundColor=4a0060&textColor=00ff87`,
              createdAt,
            },
            { merge: true },
          ),
      ),
    );

    return NextResponse.json({ seeded: PLAYERS.length, players: PLAYERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
