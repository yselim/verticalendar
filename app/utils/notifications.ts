import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import { getReminderSoundFilename } from "@/utils/reminderSounds"

// Configure how notifications are shown when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  if (existingStatus === "granted") return true

  const { status } = await Notifications.requestPermissionsAsync()
  return status === "granted"
}

/**
 * Schedules a local notification for the given note.
 * Returns the notification identifier, or null if not scheduled
 * (e.g. if date-time is in the past or permission denied).
 */
export async function scheduleNoteNotification(
  noteId: number,
  description: string,
  noteDate: string, // "YYYY-MM-DD"
  noteTime: string, // "HH:MM"
): Promise<string | null> {
  const [year, month, day] = noteDate.split("-").map(Number)
  const [hours, minutes] = noteTime.split(":").map(Number)

  const scheduledDate = new Date(year, month - 1, day, hours, minutes, 0, 0)

  // Do not schedule if the date-time is in the past
  if (scheduledDate.getTime() <= Date.now()) {
    return null
  }

  const granted = await requestNotificationPermissions()
  if (!granted) return null

  const soundFilename = getReminderSoundFilename()
  let channelId: string | undefined

  if (Platform.OS === "android") {
    channelId = `reminder-${soundFilename.replace(/[^a-zA-Z0-9]/g, "")}`
    await Notifications.setNotificationChannelAsync(channelId, {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
      sound: soundFilename,
    })
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "VertiCalendar",
      body: description,
      sound: soundFilename,
      ...(channelId ? { channelId } : {}),
      data: {
        noteDate,
        noteId
      }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: scheduledDate,
    },
  })

  return identifier
}

/**
 * Cancels a previously scheduled notification by its identifier.
 */
export async function cancelNoteNotification(notificationId: string | null): Promise<void> {
  if (!notificationId) return
  await Notifications.cancelScheduledNotificationAsync(notificationId)
}
