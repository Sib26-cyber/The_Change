const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// react-native-linear-gradient is a native module not bundled in Expo Go.
// Alias it to expo-linear-gradient which has a compatible API and is included in Expo Go.
config.resolver.extraNodeModules = {
  "react-native-linear-gradient": require.resolve("expo-linear-gradient"),
};

module.exports = config;
