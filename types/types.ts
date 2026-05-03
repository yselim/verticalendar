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