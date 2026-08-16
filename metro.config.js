const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const mapsWebShim = require.resolve('./metro-shims/react-native-maps.web.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isMapsPackage =
    moduleName === 'react-native-maps' || moduleName.startsWith('react-native-maps/');
  if (platform === 'web' && isMapsPackage) {
    return {
      type: 'sourceFile',
      filePath: mapsWebShim,
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
