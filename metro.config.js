const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for 3D model files (GLB, GLTF), video files, and audio files
config.resolver.assetExts.push('glb', 'gltf', 'bin', 'MOV', 'mov', 'mp4', 'wav', 'mp3', 'ogg', 'aac');

// Exclude nested project folders from metro bundler
config.resolver.blockList = [
  /spendtrak-cinematic-v2\/.*/,
  /cinematic-design\/.*/,
  /coverage\/.*/,
];

// Add resolver for import.meta polyfill
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'use-sync-external-store/shim/with-selector.js') {
    return {
      filePath: require.resolve('use-sync-external-store/shim/with-selector'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
