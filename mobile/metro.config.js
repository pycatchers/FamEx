const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require("nativewind/metro");
const nodeLibs = require('node-libs-react-native');

const path = require('path');

const config = getDefaultConfig(__dirname);

// 1. Block Metro from reading the desktop 'ws' folder entirely
config.resolver.blockList = [
  /node_modules\/@supabase\/realtime-js\/node_modules\/ws\/.*/
];

// Map some Node core modules to browser-compatible polyfills.
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = Object.assign({}, config.resolver.extraNodeModules, {
  ...nodeLibs,
  crypto: require.resolve('expo-crypto'),
});

// Watch the project root so local packages are picked up correctly.
config.watchFolders = config.watchFolders || [];
config.watchFolders.push(path.resolve(__dirname, 'node_modules'));

module.exports = withNativeWind(config, { input: "./src/global.css" });
