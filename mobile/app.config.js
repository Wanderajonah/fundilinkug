/** Expo config — loads Google Maps API key from environment */

function googleIosUrlScheme() {
  if (process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME) {
    return process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
  }
  const webClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  if (!webClientId?.endsWith('.apps.googleusercontent.com')) return null;
  const prefix = webClientId.replace('.apps.googleusercontent.com', '');
  return `com.googleusercontent.apps.${prefix}`;
}

const iosUrlScheme = googleIosUrlScheme();

module.exports = {
  expo: {
    name: 'FundiLink',
    slug: 'fundilink',
    version: '1.0.1',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    scheme: 'fundilink',
    icon: './assets/icon.png',
    assetBundlePatterns: ['**/*'],
    runtimeVersion: '1.0.1',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.fundilink.uganda',
    },
    android: {
      package: 'com.fundilink.uganda',
      adaptiveIcon: {
        foregroundImage: './assets/icon.png',
        backgroundColor: '#FFFFFF',
      },
      permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
      softwareKeyboardLayoutMode: 'resize',
      navigationBar: {
        backgroundColor: '#000000',
        barStyle: 'light-content',
      },
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
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'FundiLink uses your location to find artisans near you.',
        },
      ],
      'expo-web-browser',
      'expo-video',
      '@maplibre/maplibre-react-native',
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
