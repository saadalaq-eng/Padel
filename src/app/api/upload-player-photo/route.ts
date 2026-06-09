import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

const MAX_BYTES_AFTER_BASE64 = 500 * 1024; // 500 KB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const adminPassword = formData.get('adminPassword');
    const playerId = formData.get('playerId');
    const photo = formData.get('photo');

    if (typeof adminPassword !== 'string' || adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (typeof playerId !== 'string' || !playerId.trim()) {
      return NextResponse.json({ error: 'Missing playerId' }, { status: 400 });
    }

    if (!(photo instanceof File)) {
      return NextResponse.json({ error: 'Missing photo file' }, { status: 400 });
    }

    const arrayBuffer = await photo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    // Check size after base64 encoding
    if (base64.length > MAX_BYTES_AFTER_BASE64) {
      return NextResponse.json(
        { error: 'Photo too large, max 500KB' },
        { status: 413 }
      );
    }

    const mimeType = photo.type || 'image/jpeg';
    const photoUrl = `data:${mimeType};base64,${base64}`;

    const db = getAdminDb();
    await db.collection('players').doc(playerId).update({ photoUrl });

    return NextResponse.json({ photoUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
