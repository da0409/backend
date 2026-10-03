// src/db/index.ts
// 依据 docs/TECHNICAL.md 第 7 节封装 IndexedDB 访问。
// 只暴露通用读写工具；具体实体的持久化由 services/mock 里的 Adapter 调用。

import {
  DB_NAME,
  DB_VERSION,
  ALL_STORES,
  upgradeSchema,
  type StoreName,
} from './schema'
import { storageError } from '../services/contracts/errors'

let dbPromise: Promise<IDBDatabase> | null = null

/** 打开数据库，缓存连接 */
export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(storageError('当前环境不支持 IndexedDB'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      upgradeSchema(request.result)
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(storageError('无法打开本地数据库'))
    }

    request.onblocked = () => {
      reject(storageError('本地数据库被其他页面占用，请关闭其他标签后重试'))
    }
  })

  return dbPromise
}

/** 关闭连接（reset 时可用） */
export async function closeDb(): Promise<void> {
  if (!dbPromise) return
  const db = await dbPromise
  db.close()
  dbPromise = null
}

function wrapRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(storageError('IndexedDB 操作失败'))
  })
}

function completeWrite(tx: IDBTransaction, enqueue: () => void): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(storageError('IndexedDB 写入失败'))
    tx.onabort = () => reject(storageError('IndexedDB 写入被中止'))
    try {
      enqueue()
    } catch {
      tx.abort()
      reject(storageError('IndexedDB 写入失败'))
    }
  })
}

/** 读一条记录 */
export async function getOne<T>(
  store: StoreName,
  key: IDBValidKey,
): Promise<T | undefined> {
  const db = await openDb()
  const tx = db.transaction(store, 'readonly')
  const result = await wrapRequest<T | undefined>(tx.objectStore(store).get(key))
  return result
}

/** 写一条记录 */
export async function putOne<T>(store: StoreName, value: T): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(store, 'readwrite')
  await completeWrite(tx, () => {
    tx.objectStore(store).put(value as unknown as any)
  })
}

/** 写多条记录（同事务） */
export async function putMany<T>(store: StoreName, values: T[]): Promise<void> {
  if (values.length === 0) return
  const db = await openDb()
  const tx = db.transaction(store, 'readwrite')
  await completeWrite(tx, () => {
    const os = tx.objectStore(store)
    for (const value of values) os.put(value as unknown as any)
  })
}

/** 删除一条 */
export async function deleteOne(
  store: StoreName,
  key: IDBValidKey,
): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(store, 'readwrite')
  await completeWrite(tx, () => {
    tx.objectStore(store).delete(key)
  })
}

/** 读全部 */
export async function getAll<T>(store: StoreName): Promise<T[]> {
  const db = await openDb()
  const tx = db.transaction(store, 'readonly')
  return wrapRequest<T[]>(tx.objectStore(store).getAll())
}

/** 按索引读全部 */
export async function getAllByIndex<T>(
  store: StoreName,
  indexName: string,
  key: IDBValidKey,
): Promise<T[]> {
  const db = await openDb()
  const tx = db.transaction(store, 'readonly')
  const index = tx.objectStore(store).index(indexName)
  return wrapRequest<T[]>(index.getAll(key))
}

/** 统计条数 */
export async function count(store: StoreName): Promise<number> {
  const db = await openDb()
  const tx = db.transaction(store, 'readonly')
  return wrapRequest<number>(tx.objectStore(store).count())
}

/** 清空所有 store（reset 使用） */
export async function clearAll(): Promise<void> {
  const db = await openDb()
  const stores = Array.from(ALL_STORES)
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(stores, 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(storageError('清空本地数据库失败'))
    tx.onabort = () => reject(storageError('清空本地数据库被中止'))
    for (const name of stores) {
      tx.objectStore(name).clear()
    }
  })
}
