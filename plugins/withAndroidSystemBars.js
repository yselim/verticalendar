/* eslint-env node */
const { withAndroidStyles } = require("expo/config-plugins")

/**
 * The app is light-only. Android is always edge-to-edge (SDK 54+), so this only:
 * - draws dark status/navigation bar icons on the light background
 * - disables the translucent scrim Android adds behind the 3-button navigation bar
 * Replaces the unmaintained react-native-edge-to-edge library (and its runtime SystemBars).
 */
const ITEMS = {
  "android:windowLightStatusBar": "true",
  "android:windowLightNavigationBar": "true",
  "android:enforceNavigationBarContrast": "false",
}

module.exports = function withAndroidSystemBars(config) {
  return withAndroidStyles(config, (config) => {
    const resources = config.modResults.resources
    resources.$ = { ...resources.$, "xmlns:tools": "http://schemas.android.com/tools" }
    const appTheme = resources.style?.find((style) => style.$.name === "AppTheme")
    if (appTheme) {
      appTheme.item = (appTheme.item ?? []).filter((item) => !(item.$.name in ITEMS))
      for (const [name, value] of Object.entries(ITEMS)) {
        // windowLightNavigationBar / enforceNavigationBarContrast need API 27 / 29; older devices ignore them
        appTheme.item.push({ $: { name, "tools:targetApi": "29" }, _: value })
      }
    }
    return config
  })
}
