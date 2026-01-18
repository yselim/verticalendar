import * as SQLite from 'expo-sqlite'

const db = SQLite.openDatabaseSync('verticalendar.db')

export const initDatabase = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_date_time DATETIME NOT NULL,
      description TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      alarm_on BOOLEAN NOT NULL DEFAULT 0
    );
  `)
}

export const addItemToDB = (noteDateTime: string, description: string, orderIndex: number = 0, alarmOn: boolean = false) => {
  const result = db.runSync(
    'INSERT INTO items (note_date_time, description, order_index, alarm_on) VALUES (?, ?, ?, ?)',
    [noteDateTime, description, orderIndex, alarmOn ? 1 : 0]
  )
  return result.lastInsertRowId
}

export const getItemsByDate = (noteDateTime: string) => {
  return db.getAllSync('SELECT * FROM items WHERE note_date_time = ? ORDER BY order_index ASC, id DESC', [noteDateTime])
}

export const deleteItem = (id: number) => {
  db.runSync('DELETE FROM items WHERE id = ?', [id])
}

export const updateItem = (id: number, description: string, orderIndex?: number, alarmOn?: boolean) => {
  if (orderIndex !== undefined && alarmOn !== undefined) {
    db.runSync('UPDATE items SET description = ?, order_index = ?, alarm_on = ? WHERE id = ?', [description, orderIndex, alarmOn ? 1 : 0, id])
  } else if (orderIndex !== undefined) {
    db.runSync('UPDATE items SET description = ?, order_index = ? WHERE id = ?', [description, orderIndex, id])
  } else if (alarmOn !== undefined) {
    db.runSync('UPDATE items SET description = ?, alarm_on = ? WHERE id = ?', [description, alarmOn ? 1 : 0, id])
  } else {
    db.runSync('UPDATE items SET description = ? WHERE id = ?', [description, id])
  }
}

export default db
