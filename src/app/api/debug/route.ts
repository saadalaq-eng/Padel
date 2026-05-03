import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function GET() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const legacyKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  let decoded: Record<string, string> | null = null;
  let decodeError: string | null = null;

  if (b64) {
    try {
      const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      decoded = {
        type: json.type,
        project_id: json.project_id,
        client_email: json.client_email,
        key_starts: (json.private_key as string)?.substring(0, 30),
        key_has_newlines: String((json.private_key as string)?.includes('\n')),
      };
    } catch (e) {
      decodeError = e instanceof Error ? e.message : String(e);
    }
  }

  let firestoreTest: string;
  try {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const db = getAdminDb();
    await db.collection('players').limit(1).get();
    firestoreTest = 'SUCCESS';
  } catch (e) {
    firestoreTest = e instanceof Error ? e.message : String(e);
  }

  let anthropicTest: string;
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "ok"' }],
    });
    const block = msg.content.find((b) => b.type === 'text');
    anthropicTest = block && block.type === 'text' ? `SUCCESS: ${block.text}` : 'SUCCESS (no text block)';
  } catch (e) {
    anthropicTest = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    env: {
      HAS_BASE64: !!b64,
      BASE64_LENGTH: b64?.length ?? 0,
      HAS_LEGACY_KEY: !!legacyKey,
      HAS_LEGACY_PROJECT_ID: !!projectId,
      LEGACY_PROJECT_ID: projectId ?? null,
      HAS_ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
      ADMIN_PASSWORD_LENGTH: process.env.ADMIN_PASSWORD?.length ?? 0,
      HAS_ANTHROPIC_KEY: !!process.env.ANTHROPIC_API_KEY,
      ANTHROPIC_KEY_LENGTH: process.env.ANTHROPIC_API_KEY?.length ?? 0,
      ANTHROPIC_KEY_STARTS: process.env.ANTHROPIC_API_KEY?.substring(0, 10) ?? 'missing',
      NODE_VERSION: process.version,
    },
    decoded,
    decodeError,
    firestoreTest,
    anthropicTest,
  });
}
