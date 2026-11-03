# VertiCalendar

A personal, offline-first planner app built with **Expo / React Native**. Everything is stored locally in SQLite on the device: there is no backend and no login. The UI language is **Turkish**, and the app is **light mode only**. It is built for personal use on one Android phone, not for store release.

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
| Framework | Expo SDK **57**, React Native **0.86**, React 19.2, New Architecture, Hermes V1, **React Compiler** |
| Navigation | `@react-navigation/native-stack` + `@react-navigation/bottom-tabs` (v7). **Not** Expo Router. |
| Storage | `expo-sqlite` (sync API) for all user data. `expo-sqlite/kv-store` for the one small preference (reminder sound). |
| State | `zustand` (`app/stores/notesStore.ts`) for day items only; the other screens read SQLite directly into local state |
| Lists and gestures | `@shopify/flash-list`, `react-native-draggable-flatlist`, `react-native-gesture-handler`, `react-native-reanimated` 4 + `react-native-worklets` |
| Date and time pickers | `@react-native-community/datetimepicker` |
| Notifications and sounds | `expo-notifications`, `expo-audio` |
| Backup | `expo-file-system/legacy`, `expo-sharing`, `expo-document-picker` |
| Icons and fonts | A few PNG icons (`assets/icons`), `@react-native-vector-icons/ionicons`, and Nunito (3 weights) embedded at build time |
| OTA updates | `expo-updates` (EAS Update) |

The project started from the [Ignite](https://github.com/infinitered/ignite) boilerplate. Its unused parts have been removed: i18n, the dark/light theme system, Reactotron, the demo components, the API client and web support.

## Getting started

Requirements: Node ≥ 20 and **pnpm 11** (the lockfile is pnpm). Use a **development build**, not Expo Go, because the app uses native modules.

```bash
pnpm install
pnpm run start              # Metro for the dev client

pnpm run android            # build and run a debug build on a device or emulator
pnpm run build:android:preview   # local EAS release build → .apk (use this for daily use)
pnpm run android:aot        # after installing an APK: compile it fully ahead-of-time (faster startup)
```

`ios/` and `android/` are **gitignored and generated** (Continuous Native Generation). After any change to native dependencies, `app.json` or `plugins/`, regenerate them:

```bash
pnpm run prebuild:clean     # npx expo prebuild --clean
```

### EAS account

EAS build scripts load `EXPO_TOKEN` from `.env.local` through `dotenv-cli`, so this project always builds under its own Expo account. Check which account is active with `pnpm run eas:whoami`.

### pnpm notes

- Project-level pnpm settings live in **`pnpm-workspace.yaml`** (`nodeLinker: hoisted`, `allowBuilds`). pnpm 11 ignores pnpm settings in `.npmrc`.
- Add or upgrade Expo-managed packages with `npx expo install <pkg>` so their versions match the SDK. Check alignment with `npx expo install --check` and `npx expo-doctor`.

## Performance setup

| Where | What |
| --- | --- |
| `app.json` → `experiments.reactCompiler` | React Compiler memoizes all components automatically. Every component currently compiles without bailouts. |
| `app.json` → `expo-build-properties` | R8 code minification/optimization (`enableMinifyInReleaseBuilds`), resource shrinking, and an **arm64-v8a-only** build |
| `app.json` → `expo-font` plugin | Nunito is embedded natively, so nothing is loaded at startup |
| `metro.config.js` | `inlineRequires: true`, so modules are evaluated lazily on first use |
| `plugins/withAndroidSystemBars.js` | Light status/navigation bar icons and no nav-bar contrast scrim, set natively with no runtime library |
| Code | Zustand **selectors** (never `useNotesStore()` without a selector), `memo` on list rows (`Note`, `DayRow`, `ToDoItemRow`), and modals mounted only while open |
| Device | `pnpm run android:aot` runs `cmd package compile -m speed` for full ahead-of-time compilation. Rerun it after each APK install. |

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm run compile` | TypeScript check (`tsc --noEmit`). It should report 0 errors. |
| `pnpm run lint` / `lint:check` | ESLint with Prettier (`printWidth: 100`, no semicolons) |
| `pnpm test` | Jest (`jest-expo` preset) |
| `pnpm run check:compiler` | Lists components React Compiler skips; it should say "All components compile." |
| `pnpm run align-deps` | `npx expo install --fix` |
| `pnpm run adb` | `adb reverse` for Metro (port 8081) |

## Project layout

```text
index.tsx                  # registers the root component
app.json                   # Expo config (plugins, build properties, React Compiler)
plugins/withAndroidSystemBars.js   # local config plugin (Android system bar styling)
assets/fonts/              # Nunito Regular/Medium/Bold (+ OFL licence), embedded by expo-font
assets/icons/, assets/images/      # PNG icons; app icon and splash images
app/
  app.tsx                  # root: initDatabase() at load, updates check, providers, AppNavigator
  navigators/
    AppNavigator.tsx       # stack + bottom tabs, notification tap → Day screen, ErrorBoundary
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
    ErrorScreen/           # ErrorBoundary + ErrorDetails
  components/
    Note.tsx               # a day item row: swipe-delete, bell/time picker, "send to date" menu
    AddEditNoteModal.tsx   # centered add/edit dialog for day items
    DayRow.tsx             # a day row in the calendar
    Screen.tsx             # screen container: background, safe area, keyboard avoidance
    Text.tsx, Icon.tsx     # app font + size/weight presets; PNG icon registry
  stores/notesStore.ts     # zustand store for day items (+ notification scheduling)
  theme/colors.ts          # color palette (single light theme)
  theme/typography.ts      # font family names
  utils/
    database.ts            # ALL SQLite schema + queries
    notifications.ts       # schedule/cancel local notifications, Android channels
    reminderSounds.ts      # bundled sounds + selected sound
    storage/index.ts       # loadString/saveString on expo-sqlite kv-store
    backup.ts              # export/import the .db file
    constants.ts           # Turkish month/day names
  assets/notifications/    # reminder sound files (also registered in the expo-notifications plugin)
types/types.ts             # INote, ITabNote, IToDoList, IToDoItem
```

## Data model (SQLite: `verticalendar.db`)

The schema is created and migrated in `initDatabase()` (`app/utils/database.ts`). It runs synchronously **on every app start**, before the first render.

| Table | Columns | Notes |
| --- | --- | --- |
| `items` | `id, note_date (YYYY-MM-DD), note_time (HH:MM \| null), description, order_index, notification_id` | Day items and reminders |
| `tab_notes` | `id, tab_id (1\|2), content, order_index, created_at, updated_at` | Notes tab |
| `todo_lists` | `id, tab_id (1\|2), title, order_index, created_at, updated_at` | Lists tab |
| `todo_items` | `id, list_id, content, completed (0\|1), order_index, created_at, updated_at` | Rows of a list |

Ordering is always `ORDER BY order_index ASC, id ASC`. Drag-and-drop rewrites `order_index` as `0..n-1` for the whole list, inside a transaction.

Dates are stored as **local** `YYYY-MM-DD` strings. Build them from `getFullYear()` / `getMonth()` / `getDate()` and never from `toISOString()`, which converts to UTC and can shift the day.

## Backlog / owner notes

- Fix the colors (per-screen palettes are hard-coded; `theme/colors.ts` is only partly used).
- When the keyboard opens automatically, empty space remains at the bottom.
- Cloud backup (in addition to the current file-based backup/restore).
- "Delete all history" button.
- Database calls are synchronous on the JS thread. That's fine at the current data size; move hot paths to the async API if lists grow large.
