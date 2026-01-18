import * as SQLite from "expo-sqlite"

const db = SQLite.openDatabaseSync("verticalendar.db")

export const initDatabase = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_date TEXT NOT NULL,
      note_time TEXT,
      description TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0
    );
  `)
}

export const addItemToDB = (
  noteDate: string,
  noteTime: string | null,
  description: string,
  orderIndex: number = 0,
) => {
  const result = db.runSync(
    "INSERT INTO items (note_date, note_time, description, order_index) VALUES (?, ?, ?, ?)",
    [noteDate, noteTime, description, orderIndex],
  )
  return result.lastInsertRowId
}

export const getItemsByDate = (noteDate: string) => {
  return db.getAllSync(
    "SELECT * FROM items WHERE note_date = ? ORDER BY order_index ASC, id DESC",
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
) => {
  let query = "UPDATE items SET description = ?"
  const params: (string | number)[] = [description]

  if (noteTime !== undefined) {
    query += ", note_time = ?"
    params.push(noteTime ?? "")
  }
  if (orderIndex !== undefined) {
    query += ", order_index = ?"
    params.push(orderIndex)
  }

  query += " WHERE id = ?"
  params.push(id)

  db.runSync(query, params)
}

export const updateNoteDate = (id: number, newDate: string) => {
  db.runSync("UPDATE items SET note_date = ? WHERE id = ?", [newDate, id])
}

export default db
