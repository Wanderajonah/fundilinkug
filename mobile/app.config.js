const config = {
  expo: {
    name: 'FundiLink',
    slug: 'fundilink',
    version: '1.0.1',
    orientation: 'portrait',
    icon: './assets/icon.png',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#000000',
    },
    userInterfaceStyle: 'dark',
    scheme: 'fundilink',
    assetBundlePatterns: ['**/*'],
    runtimeVersion: '1.0.1',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.fundilink.uganda',
    },
    android: {
      package: 'com.fundilink.uganda',
      permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: 'https', host: '*.expo.dev' }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      bundler: 'metro',
      output: 'single',
    },
    plugins: [
      'expo-build-properties',
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'FundiLink uses your location to find artisans near you.',
        },
      ],
      'expo-font',
      'expo-web-browser',
      'expo-video',
      // Uncomment for production builds (EAS Build) — not compatible with Expo Go
      // '@maplibre/maplibre-react-native',
    ],
    extra: {
      eas: {
        projectId: 'b75918f7-f03a-4f72-8367-2c014bec8215',
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
    },
    owner: 'finalyear2026',
    updates: {
      url: 'https://u.expo.dev/b75918f7-f03a-4f72-8367-2c014bec8215',
    },
  },
};

module.exports = config;
