import { useEffect } from "react"
import * as Updates from "expo-updates"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context"

import { AppNavigator } from "./navigators/AppNavigator"
import { initDatabase } from "./utils/database"
import { requestNotificationPermissions } from "./utils/notifications"

// Create/migrate tables before anything renders: child effects (e.g. DayRow fetching notes)
// run before parent effects, so this must not live in a useEffect.
initDatabase()

/**
 * Root component. Fonts are embedded natively and the database opens synchronously,
 * so there is nothing to wait for before the first render.
 */
export function App() {
  useEffect(() => {
    async function checkForUpdates() {
      if (__DEV__) return
      try {
        const update = await Updates.checkForUpdateAsync()
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync()
          await Updates.reloadAsync()
        }
      } catch (error) {
        console.log("Error checking for updates:", error)
      }
    }
    checkForUpdates()
  }, [])

  useEffect(() => {
    requestNotificationPermissions()
  }, [])

  return (
    <GestureHandlerRootView style={$root}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const $root = { flex: 1 }
