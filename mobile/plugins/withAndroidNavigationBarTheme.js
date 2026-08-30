const { withAndroidStyles, withAndroidColorsNight, AndroidConfig } = require('expo/config-plugins');

// Goal: make the Android system navigation bar match the app's dark background
// instead of showing a light gray/white strip in production.
//
// Root cause: this app runs with edge-to-edge enabled (expo.edgeToEdgeEnabled /
// edgeToEdgeEnabled = true). Under edge-to-edge the system navigation bar is
// transparent and the app is drawn behind it. React Native's generated Android
// theme sets `android:enforceNavigationBarContrast=true`, which forces Android
// to paint a light/white scrim behind the nav-bar buttons for contrast. On a
// dark app that scrim is the gray/white strip that looks broken.
//
// Fix: set `android:enforceNavigationBarContrast=false` on AppTheme so Android
// stops forcing the light scrim and the app's own (dark) background shows
// through the transparent bar. This is applied at `values/styles.xml` which is
// the day/night fallback (this app ships no `values-night/styles.xml`, so it
// covers both the dark theme in use today and any future light variant).
//
// Note: on Android 15+ with edge-to-edge the OS owns the "fully managed
// navigation bar" and applies its own contrast scrim for the classic 3-button
// nav, which an app cannot fully override without a risky native runtime call.
// We intentionally keep this plugin to the theme attributes only — a runtime
// `window.isNavigationBarContrastEnforced = false` in MainActivity caused a
// native launch crash on some devices, so it was removed.
//
// This is the correct, non-deprecated behavior for edge-to-edge apps:
// setting `android:navigationBarColor` / `NavigationBar.setBackgroundColorAsync`
// is intentionally ignored while edge-to-edge is active (the OS owns the bar).
// Button color (light icons) is handled separately via the expo-navigation-bar
// plugin / android.navigationBar config.

function withAndroidNavigationBarTheme(config) {
  config = withAndroidStyles(config, (config) => {
    const appTheme = AndroidConfig.Styles.getStyleParent(
      config.modResults,
      AndroidConfig.Styles.getAppThemeGroup()
    );
    if (!appTheme) return config;

    AndroidConfig.Styles.assignStylesValue(config.modResults, {
      // Adding `enforceNavigationBarContrast=false` disables the forced light
      // scrim behind the nav bar so the app's dark background shows through.
      add: true,
      name: 'android:enforceNavigationBarContrast',
      value: 'false',
      targetApi: '29',
      parent: AndroidConfig.Styles.getAppThemeGroup(),
    });

    return config;
  });

  // Ensure the night variant also carries a black navigation bar color so the
  // dark theme nav bar never defaults to a system gray.
  config = withAndroidColorsNight(config, (config) => {
    config.modResults = AndroidConfig.Colors.setColorItem(
      AndroidConfig.Resources.buildResourceItem({
        name: 'navigationBarColor',
        value: '#000000',
      }),
      config.modResults
    );
    return config;
  });

  return config;
}

module.exports = withAndroidNavigationBarTheme;
