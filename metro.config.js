/* eslint-env node */
const { getDefaultConfig } = require("expo/metro-config")

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

config.transformer.getTransformOptions = async () => ({
  transform: {
    // Defer module evaluation until first use: screens and heavy libraries load lazily,
    // which shortens app startup. https://reactnative.dev/docs/optimizing-javascript-loading
    inlineRequires: true,
  },
})

module.exports = config
