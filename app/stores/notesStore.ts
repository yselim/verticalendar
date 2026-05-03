import { create } from "zustand"

import { getItemsByDate, updateItem, addItemToDB, deleteNoteFromDB, updateNoteDate } from "@/utils/database"
import { scheduleNoteNotification, cancelNoteNotification } from "@/utils/notifications"
import { INote, INotesCollection } from "types/types"

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
          set((state) => {
            const updatedNotes = { ...state.notes }
            const idx = updatedNotes[dateKey]?.findIndex((n) => n.id === noteId)
            if (idx !== undefined && idx !== -1) {
              updatedNotes[dateKey][idx] = { ...updatedNotes[dateKey][idx], notification_id: notificationId }
            }
            return { notes: updatedNotes }
          })
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
          cancelNoteNotification(oldNotificationId)

          if (note_time) {
            const noteDate = currentNote?.note_date
            if (noteDate) {
              scheduleNoteNotification(noteId, currentDescription, noteDate, note_time).then(
                (newNotificationId) => {
                  updateItem(noteId, currentDescription, note_time, order_index, newNotificationId)
                  set((state) => {
                    const updatedNotes = { ...state.notes }
                    Object.keys(updatedNotes).forEach((dateKey) => {
                      const idx = updatedNotes[dateKey].findIndex((n) => n.id === noteId)
                      if (idx !== -1) {
                        updatedNotes[dateKey][idx] = { ...updatedNotes[dateKey][idx], ...updatedNote, notification_id: newNotificationId }
                      }
                    })
                    return { notes: updatedNotes }
                  })
                }
              )
              // State will be updated in the async callback above
              return
            }
          } else {
            // note_time cleared — cancel notification and save null
            updateItem(noteId, currentDescription, null, order_index, null)
            set((state) => {
              const updatedNotes = { ...state.notes }
              Object.keys(updatedNotes).forEach((dateKey) => {
                const idx = updatedNotes[dateKey].findIndex((n) => n.id === noteId)
                if (idx !== -1) {
                  updatedNotes[dateKey][idx] = { ...updatedNotes[dateKey][idx], ...updatedNote, notification_id: null }
                }
              })
              return { notes: updatedNotes }
            })
            return
          }
        } else {
          updateItem(noteId, currentDescription, note_time, order_index)
        }
      }
    }

    // Update local state
    set((state) => {
      const updatedNotes = { ...state.notes }
      Object.keys(updatedNotes).forEach((dateKey) => {
        const noteIndex = updatedNotes[dateKey].findIndex((note) => note.id === noteId)
        if (noteIndex !== -1) {
          updatedNotes[dateKey][noteIndex] = {
            ...updatedNotes[dateKey][noteIndex],
            ...updatedNote,
          }
        }
      })
      return { notes: updatedNotes }
    })
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
          set((state) => {
            const updatedNotes = { ...state.notes }
            Object.keys(updatedNotes).forEach((dateKey) => {
              const idx = updatedNotes[dateKey].findIndex((n) => n.id === noteId)
              if (idx !== -1) {
                updatedNotes[dateKey][idx] = { ...updatedNotes[dateKey][idx], notification_id: newNotificationId }
              }
            })
            return { notes: updatedNotes }
          })
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
