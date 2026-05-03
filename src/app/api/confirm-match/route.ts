import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { ConfirmMatchPayload, Match } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: ConfirmMatchPayload = await req.json();

    if (body.adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const matchId = `match_${Date.now()}`;

    const { adminPassword: _omit, ...matchFields } = body;

    const matchData: Match = {
      id: matchId,
      ...matchFields,
      createdAt: new Date().toISOString(),
    };

    await adminDb.collection('matches').doc(matchId).set(matchData);

    return NextResponse.json({ success: true, matchId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
