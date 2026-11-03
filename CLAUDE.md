# CLAUDE.md: guide for AI agents

Read `README.md` first for the feature overview, stack, layout and data model. This file lists the rules and pitfalls that matter when you change code.

## Commands

```bash
pnpm install                  # pnpm 11; settings live in pnpm-workspace.yaml (hoisted linker)
npx expo install <pkg>        # add/upgrade any Expo/RN native package (keeps SDK-compatible versions)
npx expo install --check      # verify versions match the SDK
npx expo-doctor               # project health (currently 21/21 checks pass)
pnpm run compile              # tsc; must stay at 0 errors
pnpm test                     # jest
pnpm run check:compiler       # every component must compile with React Compiler
npx expo export -p android --output-dir <tmp>   # quick "does it bundle" check without a device
```

Run with `CI=true` when calling pnpm or expo non-interactively, because pnpm otherwise may wait on a prompt. With `CI=true`, pnpm uses a frozen lockfile, so pass `--no-frozen-lockfile` after changing package.json.
`ios/` and `android/` are generated (gitignored). Never hand-edit them; change `app.json` / `plugins/` and run `npx expo prebuild --clean`.

## Keep it lightweight

The project was deliberately pruned for speed and size. Don't reintroduce what was removed without a real need:

- No i18n library. UI strings are inline Turkish.
- No theme provider or dark mode. Import `colors` from `@/theme/colors`; `userInterfaceStyle` is `"light"`.
- No MMKV or AsyncStorage. Use `@/utils/storage` (expo-sqlite kv-store) for small preferences and `@/utils/database` for data.
- No runtime font loading. Fonts are embedded by the `expo-font` plugin. To add a weight, copy the `.ttf` into `assets/fonts/` named after its PostScript name and add it to the plugin and to `theme/typography.ts`.
- No web target, Reactotron, keyboard-controller, edge-to-edge library or date-fns.
- Icons: use `Icon` (PNG registry) or `@react-native-vector-icons/ionicons`. Don't add another icon font.

## Architecture rules

- **Navigation is React Navigation v7** (native-stack + bottom-tabs), not Expo Router. Add routes in `app/navigators/navigationTypes.ts` and `AppNavigator.tsx`.
- **All SQL lives in `app/utils/database.ts`.** Screens call its functions; don't open the DB elsewhere. The API is synchronous (`runSync`, `getAllSync`, …).
- `initDatabase()` is called at module load in `app/app.tsx`, before the first render, because child effects run before parent effects. It runs on **every launch**, so migrations must be idempotent. **Never add data backfills that match normal values** (for example `WHERE order_index = 0`). Such a backfill once silently reset the user's drag-drop order on every restart. If you need a one-time migration, gate it with `PRAGMA user_version`.
- Reorders write `order_index = 0..n-1` for the full list in one `db.withTransactionSync`.
- Day items go through `useNotesStore` (zustand), because it also schedules and cancels notifications. **Always use selectors**, e.g. `useNotesStore((s) => s.notes[dateKey])` or `useNotesStore((s) => s.updateNote)`, and never `useNotesStore()` without a selector, because that re-renders on every store change. **Update state immutably** with the `patchNote` helper, and only replace the arrays of days that actually changed, so other days' rows keep their references and don't re-render.
- Lists and notes screens keep data in local `useState` and reload from SQLite in `useFocusEffect`.
- Dates are local `YYYY-MM-DD` strings and times are `HH:MM` (24h). Don't use `toISOString()` to build date keys.

## Performance rules

- **React Compiler is on** (`experiments.reactCompiler`). Write code it can compile:
  - Reanimated shared values use `.get()` / `.set()`, never `.value =`. Writing `.value` makes the compiler skip the component.
  - Don't use `try { } finally { }` without a `catch`. The compiler can't handle it and skips the component.
  - Check with `pnpm run check:compiler`. It lists any skipped component and exits 1.
- List rows (`Note`, `DayRow`, `ToDoItemRow`) are wrapped in `memo`. Pass them stable callbacks.
- Mount `<Modal>`s only while open (`{open && <Modal visible …/>}`), especially inside list rows.
- Release Android builds use R8 (minify and resource shrinking) and are arm64-only. If a new native library crashes only in release builds, it probably needs ProGuard keep rules (`expo-build-properties` → `android.extraProguardRules`).

## UI conventions

- UI strings are inline **Turkish** (for example "Kaydet", "İptal", "Sil", "Vazgeç").
- Styles are module-level `const $name: ViewStyle = {…}` objects. Per-screen color palettes are hard-coded at the top of the screen (`toDoPalette`, `notesPalette`).
- **Text input dialogs are centered** (`justifyContent: "center"`) with a bottom reserve of `windowHeight * 0.3` so they sit above the keyboard. Do **not** wrap them in `KeyboardAvoidingView`, because that makes the dialog jump after the keyboard opens. See `AddEditNoteModal.tsx` and `AddEditToDoListScreen.tsx`.
- **Date/time pickers:** on **Android**, open them imperatively with `DateTimePickerAndroid.open(...)`. Never mount `<DateTimePicker>` inside an RN `<Modal>` on Android, because the native dialog can render behind the modal and block all touches. On **iOS**, use the `spinner` display inside a `<Modal>` with explicit buttons. See `app/components/Note.tsx`.
- Swipe-to-delete rows use a `Gesture.Pan()` + Reanimated `translateX`; drag-to-reorder uses `react-native-draggable-flatlist` with `onLongPress={drag}`.

## Formatting

Prettier config: `printWidth: 100`, `semi: false`, double quotes, trailing commas. Many existing files are **not** Prettier-formatted, so don't run Prettier or `eslint --fix` on whole files you only touch lightly. The reformat noise hides the real diff. Pre-existing lint errors (import order, inline styles) are known.

## Verification checklist after changes

1. `pnpm run compile` reports 0 errors.
2. `pnpm test`
3. `npx expo export -p android --output-dir <tmp>` must bundle.
4. Native, plugin or `app.json` changes need `npx expo prebuild --clean` and a new build (`cd android && ./gradlew assembleRelease` to verify R8 locally). JS-only changes can ship via EAS Update.
