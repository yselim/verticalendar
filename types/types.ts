export interface INote {
  id: number
  note_date: string
  note_time: string | null
  description: string
  order_index: number
  notification_id: string | null
}

export interface INotesCollection{
    [date: string]: INote[]
}

export interface ITabNote {
  id: number
  tab_id: number
  content: string
  order_index: number
  created_at: string
  updated_at: string
}