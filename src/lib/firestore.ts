import { Match, Player } from '@/types';
import { adminDb } from './firebase-admin';

export async function getPlayers(): Promise<Player[]> {
  const snapshot = await adminDb.collection('players').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Player);
}

export async function getMatches(): Promise<Match[]> {
  const snapshot = await adminDb.collection('matches').orderBy('date', 'desc').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Match);
}

export async function getMatchesBefore(date: Date): Promise<Match[]> {
  const isoDate = date.toISOString();
  const snapshot = await adminDb
    .collection('matches')
    .where('date', '<', isoDate)
    .orderBy('date', 'desc')
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Match);
}

export async function getMatchesBetween(start: Date, end: Date): Promise<Match[]> {
  const isoStart = start.toISOString();
  const isoEnd = end.toISOString();
  const snapshot = await adminDb
    .collection('matches')
    .where('date', '>=', isoStart)
    .where('date', '<=', isoEnd)
    .orderBy('date', 'desc')
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Match);
}
