# CLAUDE.md: guide for AI agents

Read `README.md` first for the feature overview, stack, layout and data model. This file lists the rules and pitfalls that matter when you change code.

## Commands

```bash
pnpm install                  # pnpm 11; settings live in pnpm-workspace.yaml (hoisted linker)
npx expo install <pkg>        # add/upgrade any Expo/RN native package (keeps SDK-compatible versions)
npx expo install --check      # verify versions match the SDK
npx expo-doctor               # project health
pnpm run compile              # tsc (54 pre-existing errors in Ignite leftovers/test globals; don't add new ones)
pnpm test                     # jest
npx expo export -p android    # quick "does it bundle" check without a device
```

Run with `CI=true` when calling pnpm or expo non-interactively, because pnpm otherwise may wait on a prompt.
`ios/` and `android/` are generated (gitignored). Never hand-edit them; change `app.json` / `app.config.ts` and run `npx expo prebuild --clean`.

## Architecture rules

- **Navigation is React Navigation v7** (native-stack + bottom-tabs), not Expo Router. Add routes in `app/navigators/navigationTypes.ts` and `AppNavigator.tsx`.
- **All SQL lives in `app/utils/database.ts`.** Screens call its functions; don't open the DB elsewhere. The API is synchronous (`runSync`, `getAllSync`, …).
- `initDatabase()` runs on **every launch**. Migrations must be idempotent. **Never add data backfills that match normal values** (for example `WHERE order_index = 0`). Such a backfill once silently reset the user's drag-drop order on every restart. If you need a one-time migration, gate it with `PRAGMA user_version`.
- Reorders write `order_index = 0..n-1` for the full list in one `db.withTransactionSync`.
- Day items go through `useNotesStore` (zustand), because it also schedules and cancels notifications. **Update state immutably.** Use the `patchNote` helper and never assign into `state.notes[date][i]`, because lists only re-render when the array reference changes.
- Lists and notes screens keep data in local `useState` and reload from SQLite in `useFocusEffect`.
- Dates are local `YYYY-MM-DD` strings and times are `HH:MM` (24h). Don't use `toISOString()` to build date keys.

## UI conventions

- UI strings are inline **Turkish** (for example "Kaydet", "İptal", "Sil", "Vazgeç"). The Ignite i18n setup exists but is not used for app screens.
- Styles are module-level `const $name: ViewStyle = {…}` objects (Ignite convention). Per-screen color palettes are hard-coded at the top of the screen (`toDoPalette`, `notesPalette`).
- **Text input dialogs are centered** (`justifyContent: "center"`) with a bottom reserve of `windowHeight * 0.3` so they sit above the keyboard. Do **not** wrap them in `KeyboardAvoidingView`, because that makes the dialog jump after the keyboard opens. See `AddEditNoteModal.tsx` and `AddEditToDoListScreen.tsx`.
- **Date/time pickers:** on **Android**, open them imperatively with `DateTimePickerAndroid.open(...)`. Never mount `<DateTimePicker>` inside an RN `<Modal>` on Android, because the native dialog can render behind the modal and block all touches. On **iOS**, use the `spinner` display inside a `<Modal>` with explicit buttons. See `app/components/Note.tsx`.
- Swipe-to-delete rows use a `Gesture.Pan()` + Reanimated `translateX`; drag-to-reorder uses `react-native-draggable-flatlist` with `onLongPress={drag}`.

## Formatting

Prettier config: `printWidth: 100`, `semi: false`, double quotes, trailing commas. Many existing files are **not** Prettier-formatted, so don't run Prettier or `eslint --fix` on whole files you only touch lightly. The reformat noise hides the real diff. Pre-existing lint errors (import order, inline styles) are known.

## Verification checklist after changes

1. `pnpm run compile`: error count must not increase, and there must be no errors in files you touched.
2. `pnpm test`
3. `npx expo export -p android --output-dir <tmp>` must bundle.
4. Native or plugin changes need `npx expo prebuild --clean` and a new dev build. JS-only changes can ship via EAS Update.
