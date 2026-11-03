import { create } from "zustand"

import { getItemsByDate, updateItem, addItemToDB, deleteNoteFromDB, updateNoteDate } from "@/utils/database"
import { scheduleNoteNotification, cancelNoteNotification } from "@/utils/notifications"
import { INote, INotesCollection } from "types/types"

/** Returns a new collection with `patch` applied to the note, replacing (not mutating) the affected array. */
const patchNote = (notes: INotesCollection, noteId: number, patch: Partial<INote>): INotesCollection => {
  const updatedNotes: INotesCollection = {}
  Object.keys(notes).forEach((dateKey) => {
    const list = notes[dateKey]
    updatedNotes[dateKey] = list.some((n) => n.id === noteId)
      ? list.map((n) => (n.id === noteId ? { ...n, ...patch } : n))
      : list
  })
  return updatedNotes
}

interface NotesStore {
  notes: INotesCollection
  fetchNotes: (date: Date) => void
  addNote: (noteDate: string, noteTime: string | null, description: string, orderIndex?: number) => void
  updateNote: (noteId: number, updatedNote: Partial<INote>) => void
  deleteNote: (noteId: number) => void
  moveNoteToDate: (noteId: number, newDate: string) => void
  reorderNotes: (dateKey: string, reorderedNotes: INote[]) => void
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: {},

  fetchNotes: (date: Date) => {
    // Use local date to avoid timezone issues
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateKey = `${year}-${month}-${day}`
    const noteDate = dateKey

    const items = getItemsByDate(noteDate)
    const notes: INote[] = (items as any[]).map((item) => ({
      id: item.id,
      note_date: item.note_date,
      note_time: item.note_time || null,
      description: item.description,
      order_index: item.order_index,
      notification_id: item.notification_id || null,
    }))

    set((state) => ({
      notes: {
        ...state.notes,
        [dateKey]: notes,
      },
    }))
  },

  addNote: (noteDate: string, noteTime: string | null, description: string, orderIndex?: number) => {
    const dateKey = noteDate
    const existingNotes = get().notes[dateKey] || []

    // Place new note at the end by using max order_index + 1
    const nextOrderIndex = orderIndex !== undefined
      ? orderIndex
      : existingNotes.length > 0
        ? Math.max(...existingNotes.map((n) => n.order_index)) + 1
        : 0

    const noteId = addItemToDB(noteDate, noteTime, description, nextOrderIndex)

    // Schedule notification if noteTime is provided
    if (noteTime) {
      scheduleNoteNotification(noteId as number, description, noteDate, noteTime).then(
        (notificationId) => {
          updateItem(noteId as number, description, noteTime, undefined, notificationId)
          set((state) => ({ notes: patchNote(state.notes, noteId as number, { notification_id: notificationId }) }))
        }
      )
    }

    // Add to local state
    const newNote: INote = {
      id: noteId as number,
      note_date: noteDate,
      note_time: noteTime,
      description,
      order_index: nextOrderIndex,
      notification_id: null,
    }

    set((state) => ({
      notes: {
        ...state.notes,
        [dateKey]: [...(state.notes[dateKey] || []), newNote],
      },
    }))
  },

  updateNote: (noteId: number, updatedNote: Partial<INote>) => {
    const { description, note_time, order_index } = updatedNote

    if (description !== undefined || note_time !== undefined || order_index !== undefined) {
      // Fetch current note if fields are missing
      const allNotes = get().notes
      let currentNote: INote | undefined
      for (const dateKey of Object.keys(allNotes)) {
        const found = allNotes[dateKey].find((n) => n.id === noteId)
        if (found) { currentNote = found; break }
      }

      const currentDescription = description ?? currentNote?.description
      if (currentDescription !== undefined) {
        // Handle notification: note_time is being updated
        if (note_time !== undefined) {
          const oldNotificationId = currentNote?.notification_id ?? null
          // Cancel old notification regardless
          cancelNoteNotification(oldNotificationId).catch(() => {})

          // Persist the time immediately so the UI never depends on notification scheduling succeeding
          updateItem(noteId, currentDescription, note_time ?? null, order_index, null)
          set((state) => ({ notes: patchNote(state.notes, noteId, { ...updatedNote, notification_id: null }) }))

          const noteDate = currentNote?.note_date
          if (note_time && noteDate) {
            scheduleNoteNotification(noteId, currentDescription, noteDate, note_time)
              .catch(() => null)
              .then((newNotificationId) => {
                if (!newNotificationId) return
                // The time may have been changed or removed while scheduling; drop the stale notification
                const latest = Object.values(get().notes).flat().find((n) => n.id === noteId)
                if (latest?.note_time !== note_time) {
                  cancelNoteNotification(newNotificationId).catch(() => {})
                  return
                }
                updateItem(noteId, latest.description, note_time, undefined, newNotificationId)
                set((state) => ({ notes: patchNote(state.notes, noteId, { notification_id: newNotificationId }) }))
              })
          }
          return
        } else {
          updateItem(noteId, currentDescription, note_time, order_index)
        }
      }
    }

    // Update local state
    set((state) => ({ notes: patchNote(state.notes, noteId, updatedNote) }))
  },

  reorderNotes: (dateKey: string, reorderedNotes: INote[]) => {
    // 1. Update in database
    reorderedNotes.forEach((note, index) => {
      updateItem(note.id, note.description, note.note_time, index)
    })

    // 2. Update local state
    set((state) => {
      const updatedNotes = { ...state.notes }
      updatedNotes[dateKey] = reorderedNotes.map((n, idx) => ({ ...n, order_index: idx }))
      return { notes: updatedNotes }
    })
  },

  deleteNote: (noteId: number) => {
    // Cancel any scheduled notification
    const allNotes = get().notes
    for (const dateKey of Object.keys(allNotes)) {
      const found = allNotes[dateKey].find((n) => n.id === noteId)
      if (found) {
        cancelNoteNotification(found.notification_id)
        break
      }
    }

    // Delete from database
    deleteNoteFromDB(noteId)

    // Remove from local state
    set((state) => {
      const updatedNotes = { ...state.notes }

      // Find and remove the note from the collection
      Object.keys(updatedNotes).forEach((dateKey) => {
        updatedNotes[dateKey] = updatedNotes[dateKey].filter((note) => note.id !== noteId)
      })

      return { notes: updatedNotes }
    })
  },

  moveNoteToDate: (noteId: number, newDate: string) => {
    // Update in database
    updateNoteDate(noteId, newDate)

    // Handle notification: reschedule for new date if note has a time
    const allNotes = get().notes
    let noteToMove: INote | undefined
    for (const dateKey of Object.keys(allNotes)) {
      const found = allNotes[dateKey].find((n) => n.id === noteId)
      if (found) { noteToMove = found; break }
    }
    if (noteToMove?.note_time) {
      cancelNoteNotification(noteToMove.notification_id)
      scheduleNoteNotification(noteId, noteToMove.description, newDate, noteToMove.note_time).then(
        (newNotificationId) => {
          updateItem(noteId, noteToMove!.description, noteToMove!.note_time, undefined, newNotificationId)
          set((state) => ({ notes: patchNote(state.notes, noteId, { notification_id: newNotificationId }) }))
        }
      )
    } else if (noteToMove?.notification_id) {
      // No time but had a notification — cancel it
      cancelNoteNotification(noteToMove.notification_id)
      updateItem(noteId, noteToMove.description, null, undefined, null)
    }

    // Update local state - remove from old date and add to new date
    set((state) => {
      const updatedNotes = { ...state.notes }
      let movedNote: INote | null = null

      // Find and remove the note from its current date
      Object.keys(updatedNotes).forEach((dateKey) => {
        const noteIndex = updatedNotes[dateKey].findIndex((note) => note.id === noteId)
        if (noteIndex !== -1) {
          movedNote = { ...updatedNotes[dateKey][noteIndex], note_date: newDate }
          updatedNotes[dateKey] = updatedNotes[dateKey].filter((note) => note.id !== noteId)
        }
      })

      // Add to new date if we found the note
      if (movedNote) {
        if (!updatedNotes[newDate]) {
          updatedNotes[newDate] = []
        }
        updatedNotes[newDate] = [movedNote, ...updatedNotes[newDate]]
      }

      return { notes: updatedNotes }
    })
  },
}))
