const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure asset extensions
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'jpg');
config.resolver.assetExts.push('jpg', 'jpeg', 'png', 'gif', 'webp', 'svg');

// Add browser-specific fallbacks for Node.js modules
config.resolver.extraNodeModules = {
  // Core Node.js modules
  stream: require.resolve('stream-browserify'),
  https: require.resolve('https-browserify'),
  http: require.resolve('stream-http'),
  events: require.resolve('events/'),
  net: false,
  tls: false,
  crypto: require.resolve('react-native-crypto'),
  buffer: require.resolve('buffer/'),
  util: require.resolve('util/'),
  process: require.resolve('process/browser'),
  zlib: false,
  path: false,
  fs: false
  // Removed url polyfill to avoid conflict with react-native-url-polyfill
};

module.exports = config;