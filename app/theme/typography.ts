/**
 * Nunito is embedded into the native app at build time by the `expo-font` config plugin
 * (see app.json), so nothing is loaded at runtime. The file names in assets/fonts match the
 * fonts' PostScript names, so the same family name works on both Android and iOS.
 */
export const typography = {
  primary: {
    normal: "Nunito-Regular",
    medium: "Nunito-Medium",
    bold: "Nunito-Bold",
  },
} as const
