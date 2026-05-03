import * as admin from 'firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';

const ADMIN_APP_NAME = 'admin';

function initAdminApp(): admin.app.App {
  const existing = admin.apps.find((a) => a?.name === ADMIN_APP_NAME);
  if (existing) return existing;

  let credential: admin.credential.Credential;

  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    const serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    credential = admin.credential.cert(serviceAccount);
  } else {
    // Local dev fallback (.env.local with individual vars)
    const rawKey = process.env.FIREBASE_PRIVATE_KEY ?? '';
    const privateKey = rawKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n') || undefined;
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    });
  }

  return admin.initializeApp({ credential }, ADMIN_APP_NAME);
}

let _db: Firestore | null = null;

export function getAdminDb(): Firestore {
  if (!_db) {
    _db = initAdminApp().firestore();
  }
  return _db;
}

export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    return (getAdminDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
