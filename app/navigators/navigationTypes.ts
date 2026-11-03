import { BottomTabScreenProps } from "@react-navigation/bottom-tabs"
import { CompositeScreenProps, NavigatorScreenParams } from "@react-navigation/native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"

// Main Tab Navigator types
export type MainTabParamList = {
  Takvim: undefined
  Listeler: undefined
  Notlar: undefined
}

// App Stack Navigator types
export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>
  Day: { date: string }
  AllCalendarItems: undefined
  Settings: undefined
  NoteEditor: { tabId: number; noteId?: number }
  AddEditToDoList: { listId?: number; tabId: number }
}

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  AppStackScreenProps<keyof AppStackParamList>
>
