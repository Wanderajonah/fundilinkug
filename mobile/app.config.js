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
    newArchEnabled: false,
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
      '@maplibre/maplibre-react-native',
    ],
    extra: {
      eas: {
        projectId: '601438ac-0971-4343-811c-4a91c11febfe',
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
    },
    owner: 'fundilink2026',
    updates: {
      url: 'https://u.expo.dev/601438ac-0971-4343-811c-4a91c11febfe',
    },
  },
};

module.exports = config;
