export interface INote {
  id: number
  note_date_time: string
  description: string
  order_index: number
  alarm_on: boolean
}

export interface INotesCollection{
    [date: string]: INote[]
}