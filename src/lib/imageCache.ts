import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'midad-image-cache';
const STORE_NAME = 'image-blobs';

let dbPromise: Promise<IDBPDatabase> | null = null;

const initDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
};

export const saveImageToCache = async (key: string, blob: Blob) => {
  try {
    const db = await initDB();
    await db.put(STORE_NAME, blob, key);
  } catch (error) {
    console.error('Failed to save image to cache:', error);
  }
};

export const getImageFromCache = async (key: string): Promise<Blob | null> => {
  try {
    const db = await initDB();
    return await db.get(STORE_NAME, key);
  } catch (error) {
    console.error('Failed to get image from cache:', error);
    return null;
  }
};

export const clearImageCache = async () => {
  try {
    const db = await initDB();
    await db.clear(STORE_NAME);
  } catch (error) {
    console.error('Failed to clear image cache:', error);
  }
};
