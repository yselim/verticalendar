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

export interface IToDoList {
  id: number
  tab_id: number
  order_index: number
  created_at: string
  updated_at: string
  first_item: string | null
  item_count: number
}

export interface IToDoItem {
  id: number
  list_id: number
  content: string
  completed: number
  order_index: number
  created_at: string
  updated_at: string
}