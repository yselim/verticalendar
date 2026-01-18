import { create } from "zustand"

import { getItemsByDate, updateItem, addItemToDB, deleteNoteFromDB } from "@/utils/database"
import { INote, INotesCollection } from "types/types"

interface NotesStore {
  notes: INotesCollection
  fetchNotes: (date: Date) => void
  addNote: (noteDateTime: string, description: string, orderIndex?: number, alarmOn?: boolean) => void
  updateNote: (noteId: number, updatedNote: Partial<INote>) => void
  deleteNote: (noteId: number) => void
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: {},

  fetchNotes: (date: Date) => {
    const dateKey = date.toISOString().split("T")[0]
    const dateTime = new Date(date)
    dateTime.setHours(0, 0, 0, 0)
    const noteDateTime = dateTime.toISOString()

    const items = getItemsByDate(noteDateTime)
    const notes: INote[] = (items as any[]).map((item) => ({
      id: item.id,
      note_date_time: item.note_date_time,
      description: item.description,
      order_index: item.order_index,
      alarm_on: Boolean(item.alarm_on),
    }))

    set((state) => ({
      notes: {
        ...state.notes,
        [dateKey]: notes,
      },
    }))
  },

  addNote: (noteDateTime: string, description: string, orderIndex: number = 0, alarmOn: boolean = false) => {
    const noteId = addItemToDB(noteDateTime, description, orderIndex, alarmOn)

    // Add to local state
    const dateKey = new Date(noteDateTime).toISOString().split("T")[0]
    const newNote: INote = {
      id: noteId as number,
      note_date_time: noteDateTime,
      description,
      order_index: orderIndex,
      alarm_on: alarmOn,
    }

    set((state) => ({
      notes: {
        ...state.notes,
        [dateKey]: [newNote, ...(state.notes[dateKey] || [])],
      },
    }))
  },

  updateNote: (noteId: number, updatedNote: Partial<INote>) => {
    const { description, order_index, alarm_on } = updatedNote

    if (description !== undefined) {
      updateItem(noteId, description, order_index, alarm_on)
    }

    // Update local state
    set((state) => {
      const updatedNotes = { ...state.notes }

      // Find and update the note in the collection
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

  deleteNote: (noteId: number) => {
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
}))
