import { ExpoConfig, ConfigContext } from "@expo/config"

/**
 * Use tsx/cjs here so we can use TypeScript for our Config Plugins
 * and not have to compile them to JavaScript.
 *
 * See https://docs.expo.dev/config-plugins/plugins/#add-typescript-support-and-convert-to-dynamic-app-config
 */
import "tsx/cjs"

/**
 * @param config ExpoConfig coming from the static config app.json if it exists
 *
 * You can read more about Expo's Configuration Resolution Rules here:
 * https://docs.expo.dev/workflow/configuration/#configuration-resolution-rules
 */
export default ({ config }: ConfigContext): Partial<ExpoConfig> => {
  const plugins = [...(config.plugins ?? [])]

  // Add required plugins if they are not already present in app.json
  const requiredPlugins = ["expo-audio", "expo-sharing", "expo-updates"]
  
  requiredPlugins.forEach((plugin) => {
    if (!plugins.includes(plugin)) {
      plugins.push(plugin)
    }
  })

  return {
    ...config,
    plugins,
  }
}
