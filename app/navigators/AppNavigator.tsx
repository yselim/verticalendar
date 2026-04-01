/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { useEffect } from "react"

import Config from "@/config"
import { ErrorBoundary } from "@/screens/ErrorScreen/ErrorBoundary"
import { CalendarScreen } from "@/screens/CalendarScreen"
import { DayScreen } from "@/screens/DayScreen"
import { ToDoScreen } from "@/screens/ToDoScreen"
import { NotesScreen } from "@/screens/NotesScreen"
import { initDatabase } from "@/utils/database"
import { useAppTheme } from "@/theme/context"
import { Icon } from "@/components/Icon"
import Ionicons from "@expo/vector-icons/Ionicons"

import type { AppStackParamList, MainTabParamList, NavigationProps } from "./navigationTypes"
import { navigationRef, useBackButtonHandler } from "./navigationUtilities"

/**
 * This is a list of all the route names that will exit the app if the back button
 * is pressed while in that screen. Only affects Android.
 */
const exitRoutes = Config.exitRoutes

// Documentation: https://reactnavigation.org/docs/stack-navigator/
const Stack = createNativeStackNavigator<AppStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()

const MainTabs = () => {
  const {
    theme: { colors },
  } = useAppTheme()

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
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  )
}

const AppStack = () => {
  const {
    theme: { colors },
  } = useAppTheme()

  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Day" component={DayScreen} />
      {/** 🔥 Your screens go here */}
      {/* IGNITE_GENERATOR_ANCHOR_APP_STACK_SCREENS */}
    </Stack.Navigator>
  )
}

export const AppNavigator = (props: NavigationProps) => {
  const { navigationTheme } = useAppTheme()

  useBackButtonHandler((routeName) => exitRoutes.includes(routeName))

  useEffect(() => {
    initDatabase()
  }, [])

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} {...props}>
      <ErrorBoundary catchErrors={Config.catchErrors}>
        <AppStack />
      </ErrorBoundary>
    </NavigationContainer>
  )
}
