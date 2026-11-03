import { useEffect, useRef } from "react"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { DefaultTheme, NavigationContainer, useNavigation } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import Ionicons from "@react-native-vector-icons/ionicons"
import * as Notifications from "expo-notifications"

import { Icon } from "@/components/Icon"
import { AddEditToDoListScreen } from "@/screens/AddEditToDoListScreen"
import { AllCalendarItemsScreen } from "@/screens/AllCalendarItemsScreen"
import { CalendarScreen } from "@/screens/CalendarScreen"
import { DayScreen } from "@/screens/DayScreen"
import { ErrorBoundary } from "@/screens/ErrorScreen/ErrorBoundary"
import { NoteEditorScreen } from "@/screens/NoteEditorScreen"
import { NotesScreen } from "@/screens/NotesScreen"
import { SettingsScreen } from "@/screens/SettingsScreen"
import { ToDoScreen } from "@/screens/ToDoScreen"
import { colors } from "@/theme/colors"

import type { AppStackParamList, MainTabParamList } from "./navigationTypes"

const Stack = createNativeStackNavigator<AppStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tab.Screen
        name="Takvim"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon icon="menu" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Listeler"
        component={ToDoScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon icon="check" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Notlar"
        component={NotesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

const AppStack = () => {
  const navigation = useNavigation<any>()
  const lastNotificationResponse = Notifications.useLastNotificationResponse()
  const processedNotificationId = useRef<string | null>(null)

  // Tapping a reminder notification opens that note's day
  useEffect(() => {
    if (
      lastNotificationResponse &&
      lastNotificationResponse.notification.request.content.data?.noteDate &&
      lastNotificationResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER &&
      lastNotificationResponse.notification.request.identifier !== processedNotificationId.current
    ) {
      processedNotificationId.current = lastNotificationResponse.notification.request.identifier
      const noteDate = lastNotificationResponse.notification.request.content.data.noteDate
      // Delay slightly to ensure navigators are fully mounted if app just started
      setTimeout(() => {
        navigation.navigate("Day", { date: noteDate })
      }, 100)
    }
  }, [lastNotificationResponse, navigation])

  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Day" component={DayScreen} />
      <Stack.Screen name="AllCalendarItems" component={AllCalendarItemsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="NoteEditor" component={NoteEditorScreen} />
      <Stack.Screen name="AddEditToDoList" component={AddEditToDoListScreen} />
    </Stack.Navigator>
  )
}

export const AppNavigator = () => {
  return (
    <NavigationContainer theme={DefaultTheme}>
      <ErrorBoundary>
        <AppStack />
      </ErrorBoundary>
    </NavigationContainer>
  )
}
