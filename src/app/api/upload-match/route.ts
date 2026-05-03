import { NextRequest, NextResponse } from 'next/server';
import { extractMatchFromScreenshot } from '@/lib/vision';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const screenshot = formData.get('screenshot') as File | null;
    const playersJson = formData.get('players') as string | null;
    const adminPassword = formData.get('adminPassword') as string | null;

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!screenshot) {
      return NextResponse.json({ error: 'No screenshot provided' }, { status: 400 });
    }

    if (!playersJson) {
      return NextResponse.json({ error: 'No players provided' }, { status: 400 });
    }

    const bytes = await screenshot.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = screenshot.type as 'image/jpeg' | 'image/png' | 'image/webp';

    const playerNames: string[] = JSON.parse(playersJson);

    const extractedData = await extractMatchFromScreenshot(base64, playerNames, mimeType);

    return NextResponse.json(extractedData);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
