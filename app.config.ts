import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'FlowDay',
  slug: 'flowday',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './src/assets/icons/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    resizeMode: 'contain',
    backgroundColor: '#0f0f11',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.flowday.app',
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#0f0f11',
    },
    package: 'com.flowday.app',
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './src/assets/icons/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-notifications',
      {
        icon: './src/assets/icons/notification-icon.png',
        color: '#7c6aff',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  scheme: 'flowday',
});
