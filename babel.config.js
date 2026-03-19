module.exports = function (api) {
  api.cache(true);
  let plugins = [];

  // Safely add worklets plugin only if available
  try {
    require.resolve("react-native-worklets/plugin");
    plugins.push("react-native-worklets/plugin");
  } catch {
    // Plugin not available, skip
  }
  // IMPORTANT: react-native-reanimated/plugin must be listed LAST
  plugins.push("react-native-reanimated/plugin");

  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }]],
    plugins,
  };
};
