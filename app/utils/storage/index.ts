import Storage from "expo-sqlite/kv-store"

/**
 * Small key-value preferences (e.g. the selected reminder sound).
 * Backed by expo-sqlite's kv-store (a separate "ExpoSQLiteStorage" database), so no extra
 * native storage library is needed. User data lives in verticalendar.db (see utils/database.ts).
 */
export function loadString(key: string): string | null {
  try {
    return Storage.getItemSync(key)
  } catch {
    return null
  }
}

export function saveString(key: string, value: string): boolean {
  try {
    Storage.setItemSync(key, value)
    return true
  } catch {
    return false
  }
}
