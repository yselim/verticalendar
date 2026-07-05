import * as SQLite from "expo-sqlite"

const db = SQLite.openDatabaseSync("verticalendar.db")

export const initDatabase = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_date TEXT NOT NULL,
      note_time TEXT,
      description TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      notification_id TEXT
    );
  `)

  db.execSync(`
    CREATE TABLE IF NOT EXISTS tab_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tab_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Migration: add notification_id column if it doesn't exist yet
  try {
    db.execSync(`ALTER TABLE items ADD COLUMN notification_id TEXT;`)
  } catch {
    // Column already exists — ignore
  }

  try {
    db.execSync(`ALTER TABLE tab_notes ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0;`)
  } catch {
    // Column already exists — ignore
  }

  // Backfill order indexes for older rows so drag-drop has stable persisted ordering.
  db.execSync(`UPDATE tab_notes SET order_index = id WHERE order_index = 0;`)
}

export const addItemToDB = (
  noteDate: string,
  noteTime: string | null,
  description: string,
  orderIndex: number = 0,
  notificationId: string | null = null,
) => {
  const result = db.runSync(
    "INSERT INTO items (note_date, note_time, description, order_index, notification_id) VALUES (?, ?, ?, ?, ?)",
    [noteDate, noteTime, description, orderIndex, notificationId],
  )
  return result.lastInsertRowId
}

export const getItemsByDate = (noteDate: string) => {
  return db.getAllSync(
    "SELECT * FROM items WHERE note_date = ? ORDER BY order_index ASC, id ASC",
    [noteDate],
  )
}

export const deleteNoteFromDB = (id: number) => {
  db.runSync("DELETE FROM items WHERE id = ?", [id])
}

export const updateItem = (
  id: number,
  description: string,
  noteTime?: string | null,
  orderIndex?: number,
  notificationId?: string | null,
) => {
  let query = "UPDATE items SET description = ?"
  const params: (string | number | null)[] = [description]

  if (noteTime !== undefined) {
    query += ", note_time = ?"
    params.push(noteTime ?? null)
  }
  if (orderIndex !== undefined) {
    query += ", order_index = ?"
    params.push(orderIndex)
  }
  if (notificationId !== undefined) {
    query += ", notification_id = ?"
    params.push(notificationId ?? null)
  }

  query += " WHERE id = ?"
  params.push(id)

  db.runSync(query, params)
}

export const updateNoteDate = (id: number, newDate: string) => {
  db.runSync("UPDATE items SET note_date = ? WHERE id = ?", [newDate, id])
}

export const addTabNoteToDB = (tabId: number, content: string, orderIndex?: number) => {
  const maxRow = db.getFirstSync("SELECT MAX(order_index) as max_order FROM tab_notes WHERE tab_id = ?", [
    tabId,
  ]) as { max_order?: number | null } | null
  const nextOrderIndex =
    orderIndex !== undefined ? orderIndex : (maxRow?.max_order ?? -1) + 1

  const result = db.runSync(
    "INSERT INTO tab_notes (tab_id, content, order_index) VALUES (?, ?, ?)",
    [tabId, content, nextOrderIndex],
  )
  return result.lastInsertRowId
}

export const updateTabNoteInDB = (id: number, content: string) => {
  db.runSync("UPDATE tab_notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [
    content,
    id,
  ])
}

export const getTabNotesByTabId = (tabId: number) => {
  return db.getAllSync(
    "SELECT id, tab_id, content, order_index, created_at, updated_at FROM tab_notes WHERE tab_id = ? ORDER BY order_index ASC, id ASC",
    [tabId],
  )
}

export const getTabNoteById = (id: number) => {
  return db.getFirstSync(
    "SELECT id, tab_id, content, order_index, created_at, updated_at FROM tab_notes WHERE id = ?",
    [id],
  )
}

export const deleteTabNoteFromDB = (id: number) => {
  db.runSync("DELETE FROM tab_notes WHERE id = ?", [id])
}

export const reorderTabNotesInDB = (tabId: number, notes: { id: number }[]) => {
  notes.forEach((note, index) => {
    db.runSync("UPDATE tab_notes SET order_index = ? WHERE id = ? AND tab_id = ?", [index, note.id, tabId])
  })
}

export const moveTabNoteToTabInDB = (id: number, targetTabId: number) => {
  const maxRow = db.getFirstSync("SELECT MAX(order_index) as max_order FROM tab_notes WHERE tab_id = ?", [
    targetTabId,
  ]) as { max_order?: number | null } | null
  const nextOrderIndex = (maxRow?.max_order ?? -1) + 1

  db.runSync(
    "UPDATE tab_notes SET tab_id = ?, order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [targetTabId, nextOrderIndex, id],
  )
}

export default db
