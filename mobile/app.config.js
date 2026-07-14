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
    assetBundlePatterns: ['**/*'],
    runtimeVersion: '1.0.1',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.fundilink.uganda',
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
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
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
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
    ],
    extra: {
      eas: {
        projectId: 'a1bbe60a-a9d4-4dc8-95d1-92e8a6fe7cba',
      },
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
    owner: '2300813409',
    updates: {
      url: 'https://u.expo.dev/a1bbe60a-a9d4-4dc8-95d1-92e8a6fe7cba',
    },
  },
};
