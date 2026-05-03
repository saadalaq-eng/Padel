import * as admin from 'firebase-admin';
import type { Firestore } from 'firebase-admin/firestore';

const ADMIN_APP_NAME = 'admin';

function initAdminApp(): admin.app.App {
  const existing = admin.apps.find((a) => a?.name === ADMIN_APP_NAME);
  if (existing) return existing;

  const rawKey = process.env.FIREBASE_PRIVATE_KEY ?? '';
  const privateKey = rawKey
    // strip surrounding quotes if user pasted them: "-----BEGIN..." → -----BEGIN...
    .replace(/^["']|["']$/g, '')
    // convert literal \n sequences to real newlines
    .replace(/\\n/g, '\n') || undefined;

  return admin.initializeApp(
    {
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    },
    ADMIN_APP_NAME,
  );
}

let _db: Firestore | null = null;

export function getAdminDb(): Firestore {
  if (!_db) {
    _db = initAdminApp().firestore();
  }
  return _db;
}

// Convenience re-export — resolves on first access
export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    return (getAdminDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
