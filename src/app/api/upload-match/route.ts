import { NextRequest, NextResponse } from 'next/server';
import { extractMatchFromScreenshot } from '@/lib/vision';
import { getPlayers } from '@/lib/firestore';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const screenshot = formData.get('screenshot') as File | null;
    const adminPassword = formData.get('adminPassword') as string | null;

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!screenshot) {
      return NextResponse.json({ error: 'No screenshot provided' }, { status: 400 });
    }

    const bytes = await screenshot.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    const rawType = screenshot.type;
    const mimeType: 'image/jpeg' | 'image/png' | 'image/webp' =
      rawType === 'image/png' ? 'image/png'
      : rawType === 'image/webp' ? 'image/webp'
      : 'image/jpeg';

    // Fetch all registered players so the AI can match names from the screenshot
    const allPlayers = await getPlayers();
    const playerNames = allPlayers.map((p) => p.name);

    const todayISO = new Date().toISOString().slice(0, 10); // e.g. "2026-06-09"
    const extractedData = await extractMatchFromScreenshot(base64, playerNames, mimeType, todayISO);

    return NextResponse.json(extractedData);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `AI analysis failed: ${message}` }, { status: 500 });
  }
}
