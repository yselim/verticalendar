import { loadString, saveString } from "@/utils/storage"

const REMINDER_SOUND_KEY = "reminder_sound_filename"

export interface ReminderSoundOption {
  filename: string
  source: number
}

export const reminderSoundOptions: ReminderSoundOption[] = [
  {
    filename: "notif_ebcrosby_notification_1.wav",
    source: require("../assets/notifications/notif_ebcrosby_notification_1.wav"),
  },
  {
    filename: "notif_jfrecords_vmax_sourcream.wav",
    source: require("../assets/notifications/notif_jfrecords_vmax_sourcream.wav"),
  },
  {
    filename: "notif_nevak36_bird_notification.mp3",
    source: require("../assets/notifications/notif_nevak36_bird_notification.mp3"),
  },
  {
    filename: "notif_nevak36_notification.mp3",
    source: require("../assets/notifications/notif_nevak36_notification.mp3"),
  },
  {
    filename: "notif_allesyt_studio_grand_notification.wav",
    source: require("../assets/notifications/notif_allesyt_studio_grand_notification.wav"),
  },
]

export function getReminderSoundFilename(): string {
  const stored = loadString(REMINDER_SOUND_KEY)
  if (stored && reminderSoundOptions.some((item) => item.filename === stored)) {
    return stored
  }
  return reminderSoundOptions[0].filename
}

export function setReminderSoundFilename(filename: string): void {
  saveString(REMINDER_SOUND_KEY, filename)
}

export function getReminderSoundByFilename(filename: string): ReminderSoundOption {
  return (
    reminderSoundOptions.find((item) => item.filename === filename) ?? reminderSoundOptions[0]
  )
}

export function getReminderSoundIndex(filename: string): number {
  const index = reminderSoundOptions.findIndex((item) => item.filename === filename)
  return index === -1 ? 1 : index + 1
}
