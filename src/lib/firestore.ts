/**
 * Helpers para Firestore.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  type QueryConstraint,
  type DocumentData,
  type QuerySnapshot,
} from 'firebase/firestore'
import { db } from './firebase'

export { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, limit, startAfter, serverTimestamp, Timestamp }

export function now(): Timestamp {
  return Timestamp.now()
}

export function timestampToDate(ts: Timestamp | null | undefined): string {
  if (!ts) return ''
  return ts.toDate().toISOString()
}

export function toDateString(ts: Timestamp | null | undefined): string {
  if (!ts) return ''
  return ts.toDate().toISOString().slice(0, 10)
}

export type { QueryConstraint, DocumentData, QuerySnapshot }
export { db }

export function validateNonEmpty(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object' && value !== null) return true
  return false
}

export async function documentExists(collectionName: string, id: string): Promise<boolean> {
  const docRef = doc(db, collectionName, id)
  const docSnap = await getDoc(docRef)
  return docSnap.exists()
}
