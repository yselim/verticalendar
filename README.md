# VertiCalendar

A personal, offline-first planner app built with **Expo / React Native**. Everything is stored locally in SQLite on the device: there is no backend and no login. The UI language is **Turkish**.

The app has three bottom tabs:

| Tab (route name) | Screen | What it does |
| --- | --- | --- |
| **Takvim** (Calendar) | `CalendarScreen` | Infinite vertical list of days (`FlashList`). Tap a day to open `DayScreen`. |
| **Listeler** (Lists) | `ToDoScreen` | Checklists, split across two tabs ("1" / "2"). Tap a list to open `AddEditToDoListScreen`. |
| **Notlar** (Notes) | `NotesScreen` | Free-text notes, split across two tabs ("1" / "2"). Tap one to open `NoteEditorScreen`. |

Other stack screens: `DayScreen` (the day's items), `AllCalendarItemsScreen` (past and future reminders), `SettingsScreen` (reminder sound, backup and restore).

## Features

- **Day items** (`items` table, `Note` component): add, edit, swipe to delete, drag to reorder. Each item can be sent to today, tomorrow or a chosen date.
- **Reminders**: tap the bell on an item to set a time. A local notification is scheduled with `expo-notifications`. Tap the time badge again to change or remove it ("Sil"). Tapping a notification opens that day.
- **Lists**: create lists, add, edit, check, swipe-delete and drag-reorder rows. Lists can be moved to the other tab or copied.
- **Notes**: plain-text notes. The title is the first line. Notes can be reordered, moved or copied.
- **Settings**: choose one of 5 bundled reminder sounds. Back up the raw SQLite file through the share sheet or a save-to-device action, and restore it from a `.db` file.

## Tech stack

| Concern | Library |
| --- | --- |
| Framework | Expo SDK **57** (`expo@~57.0.31`), React Native **0.86**, React 19.2, New Architecture, Hermes V1 |
| Navigation | `@react-navigation/native-stack` + `@react-navigation/bottom-tabs` (v7). **Not** Expo Router. |
| Storage | `expo-sqlite` (sync API) for all user data; `react-native-mmkv` for small preferences |
| State | `zustand` (`app/stores/notesStore.ts`) for day items only; the other screens read SQLite directly into local state |
| Lists and gestures | `react-native-draggable-flatlist`, `react-native-gesture-handler`, `react-native-reanimated` 4 + `react-native-worklets` |
| Date and time pickers | `@react-native-community/datetimepicker` |
| Notifications and sounds | `expo-notifications`, `expo-audio` |
| Backup | `expo-file-system/legacy`, `expo-sharing`, `expo-document-picker` |
| OTA updates | `expo-updates` (EAS Update) |
| Boilerplate | [Ignite](https://github.com/infinitered/ignite) v11. Leftover boilerplate (themes, i18n, `Screen`, `Text`, …) is still present. |

## Getting started

Requirements: Node ≥ 20 and **pnpm 11** (the lockfile is pnpm). Use a **development build**, not Expo Go, because the app uses native modules such as MMKV and SQLite.

```bash
pnpm install
pnpm run start            # Metro for the dev client

# Build and run natively (regenerates ios/ and android/ when missing)
pnpm run android
pnpm run ios

# EAS local builds
pnpm run build:android:device
pnpm run build:ios:sim
```

`ios/` and `android/` are **gitignored and generated** (Continuous Native Generation). After any change to native dependencies or `app.json` plugins, regenerate them:

```bash
pnpm run prebuild:clean   # npx expo prebuild --clean
```

### pnpm notes

- Project-level pnpm settings live in **`pnpm-workspace.yaml`** (`nodeLinker: hoisted`, `allowBuilds`). pnpm 11 ignores pnpm settings in `.npmrc`.
- To add or upgrade Expo-managed packages, use `npx expo install <pkg>` so versions match the SDK. Check alignment with `npx expo install --check` and `npx expo-doctor`.

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm run compile` | TypeScript check (`tsc --noEmit`). There are some pre-existing errors in unused Ignite leftovers. |
| `pnpm run lint` / `lint:check` | ESLint with Prettier (`printWidth: 100`, no semicolons) |
| `pnpm test` | Jest (`jest-expo` preset) |
| `pnpm run align-deps` | `npx expo install --fix` |
| `pnpm run depcruise-run` | Dependency-cruiser rules |

## Project layout

```text
index.tsx                  # registers the root component
app.json / app.config.ts   # Expo config (app.config.ts adds expo-audio, expo-sharing, expo-updates plugins)
app/
  app.tsx                  # root: fonts, theme, safe area, keyboard provider, AppNavigator
  navigators/
    AppNavigator.tsx       # stack + bottom tabs, notification tap → Day screen, calls initDatabase()
    navigationTypes.ts     # AppStackParamList / MainTabParamList (route params live here)
  screens/
    CalendarScreen.tsx     # infinite day list
    DayScreen.tsx          # items of one day (DraggableFlatList of <Note>)
    AllCalendarItemsScreen.tsx
    ToDoScreen.tsx         # lists overview (2 tabs)
    AddEditToDoListScreen.tsx  # one list: title + rows, centered input dialogs
    NotesScreen.tsx        # notes overview (2 tabs)
    NoteEditorScreen.tsx   # full-screen note editor
    SettingsScreen.tsx     # reminder sound, backup/restore
    AddEditItemScreen.tsx  # UNUSED legacy screen (not registered in the navigator)
  components/
    Note.tsx               # a day item row: swipe-delete, bell/time picker, "send to date" menu
    AddEditNoteModal.tsx   # centered add/edit dialog for day items
    DayRow.tsx             # a day row in the calendar
    Screen.tsx, Text.tsx, Icon.tsx, …   # Ignite UI primitives
  stores/notesStore.ts     # zustand store for day items (+ notification scheduling)
  utils/
    database.ts            # ALL SQLite schema + queries
    notifications.ts       # schedule/cancel local notifications, Android channels
    reminderSounds.ts      # bundled sounds + selected sound (MMKV)
    backup.ts              # export/import the .db file
    constants.ts           # Turkish month/day names
  theme/, i18n/, config/   # Ignite theme, translations (mostly unused; UI strings are inline Turkish)
  assets/notifications/    # reminder sound files (also registered in the expo-notifications plugin)
types/types.ts             # INote, ITabNote, IToDoList, IToDoItem
components/, app/day.tsx, "app/navigators/AppNavigator.tsx (or similar)"   # stray leftovers, not used
```

## Data model (SQLite: `verticalendar.db`)

The schema is created and migrated in `initDatabase()` (`app/utils/database.ts`), which runs **on every app start**.

| Table | Columns | Notes |
| --- | --- | --- |
| `items` | `id, note_date (YYYY-MM-DD), note_time (HH:MM \| null), description, order_index, notification_id` | Day items and reminders |
| `tab_notes` | `id, tab_id (1\|2), content, order_index, created_at, updated_at` | Notes tab |
| `todo_lists` | `id, tab_id (1\|2), title, order_index, created_at, updated_at` | Lists tab |
| `todo_items` | `id, list_id, content, completed (0\|1), order_index, created_at, updated_at` | Rows of a list |

Ordering is always `ORDER BY order_index ASC, id ASC`. Drag-and-drop rewrites `order_index` as `0..n-1` for the whole list, inside a transaction.

Dates are stored as **local** `YYYY-MM-DD` strings. Build them from `getFullYear()` / `getMonth()` / `getDate()` and never from `toISOString()`, which converts to UTC and can shift the day.

## Backlog / owner notes

- Fix the colors (theme is a mix of Ignite palette and per-screen hard-coded palettes).
- When the keyboard opens automatically, empty space remains at the bottom.
- Cloud backup (in addition to the current file-based backup/restore).
- "Delete all history" button.
- `react-native-edge-to-edge` is flagged as unmaintained by `expo-doctor`. It is used by `Screen.tsx` (`SystemBars`); consider replacing it with `expo-status-bar` / `expo-navigation-bar`.
- Remove Ignite leftovers that cause `tsc` errors (`app/app.tsx` linking config, `AddEditItemScreen.tsx`, root `components/`, `app/day.tsx`).
