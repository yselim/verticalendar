import { create } from "zustand"

import { getItemsByDate, updateItem, addItemToDB, deleteNoteFromDB } from "@/utils/database"
import { INote, INotesCollection } from "types/types"

interface NotesStore {
  notes: INotesCollection
  fetchNotes: (date: Date) => void
  addNote: (noteDate: string, noteTime: string | null, description: string, orderIndex?: number) => void
  updateNote: (noteId: number, updatedNote: Partial<INote>) => void
  deleteNote: (noteId: number) => void
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: {},

  fetchNotes: (date: Date) => {
    const dateKey = date.toISOString().split("T")[0]
    const noteDate = dateKey

    const items = getItemsByDate(noteDate)
    const notes: INote[] = (items as any[]).map((item) => ({
      id: item.id,
      note_date: item.note_date,
      note_time: item.note_time || null,
      description: item.description,
      order_index: item.order_index,
    }))

    set((state) => ({
      notes: {
        ...state.notes,
        [dateKey]: notes,
      },
    }))
  },

  addNote: (noteDate: string, noteTime: string | null, description: string, orderIndex: number = 0) => {
    const noteId = addItemToDB(noteDate, noteTime, description, orderIndex)

    // Add to local state
    const dateKey = noteDate
    const newNote: INote = {
      id: noteId as number,
      note_date: noteDate,
      note_time: noteTime,
      description,
      order_index: orderIndex,
    }

    set((state) => ({
      notes: {
        ...state.notes,
        [dateKey]: [newNote, ...(state.notes[dateKey] || [])],
      },
    }))
  },

  updateNote: (noteId: number, updatedNote: Partial<INote>) => {
    const { description, note_time, order_index } = updatedNote

    if (description !== undefined) {
      updateItem(noteId, description, note_time, order_index)
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
