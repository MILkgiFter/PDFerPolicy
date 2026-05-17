import { openDB } from 'idb'

const DB_NAME = 'pdfer-history-v1'
const STORE = 'outputs'
const MAX_ITEMS = 50

export type HistoryRecord = {
  id: string
  title: string
  mime: string
  createdAt: number
  size: number
  blob: Blob
}

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    },
  })
}

async function prune(db: Awaited<ReturnType<typeof getDb>>): Promise<void> {
  const all = (await db.getAll(STORE)) as HistoryRecord[]
  if (all.length <= MAX_ITEMS) return
  all.sort((a, b) => b.createdAt - a.createdAt)
  const stale = all.slice(MAX_ITEMS)
  await Promise.all(stale.map((r) => db.delete(STORE, r.id)))
}

export async function addHistoryRecord(entry: {
  title: string
  mime: string
  blob: Blob
  id?: string
}): Promise<string> {
  const db = await getDb()
  const id = entry.id ?? crypto.randomUUID()
  const row: HistoryRecord = {
    id,
    title: entry.title,
    mime: entry.mime,
    size: entry.blob.size,
    createdAt: Date.now(),
    blob: entry.blob,
  }
  await db.put(STORE, row)
  await prune(db)
  return id
}

export async function listHistory(): Promise<HistoryRecord[]> {
  const db = await getDb()
  const all = (await db.getAll(STORE)) as HistoryRecord[]
  return all.sort((a, b) => b.createdAt - a.createdAt)
}

export async function getHistoryRecord(id: string): Promise<HistoryRecord | undefined> {
  const db = await getDb()
  return db.get(STORE, id) as Promise<HistoryRecord | undefined>
}

export async function deleteHistoryRecord(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE, id)
}

export async function clearHistory(): Promise<void> {
  const db = await getDb()
  const keys = await db.getAllKeys(STORE)
  await Promise.all(keys.map((k) => db.delete(STORE, k as string)))
}
