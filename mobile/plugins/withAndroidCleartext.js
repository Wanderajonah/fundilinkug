const { withAndroidManifest } = require('expo/config-plugins');

// Allow cleartext (plain http://) traffic in release builds. Release APKs block
// cleartext on Android 9+, so a standalone APK cannot reach a LAN/dev backend
// over http:// — this is exactly the "Network error" seen when sending OTP.
//
// Once a production HTTPS backend is live, rely on that URL and this flag can
// be removed (or scoped down with a networkSecurityConfig).
function withAndroidCleartext(config) {
  return withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application?.[0];
    if (app) {
      app.$['android:usesCleartextTraffic'] = 'true';
    }
    return config;
  });
}

module.exports = withAndroidCleartext;