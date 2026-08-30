const { withAndroidStyles, withAndroidColorsNight, withMainActivity, AndroidConfig } = require('expo/config-plugins');

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
// Additionally, Android 15 (API 35) ignores the theme attribute during edge-to-
// edge and instead applies the same "fully managed navigation bar" contrast
// protection at runtime. We also disable it on the Activity window at launch so
// the bar stays transparent on green content/dark UIs. The grey band that
// remains for the classic 3-button nav on Android 15 is enforced by the OS and
// cannot be removed by an app.
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

  // Android 15 applies the nav-bar contrast scrim at runtime too. Disable it on
  // the Activity window at launch (handled in onCreate, after setTheme).
  const RUNTIME_DISABLE =
    "\n    // Disable the system's forced nav-bar contrast scrim (edge-to-edge).\n" +
    '    window.isNavigationBarContrastEnforced = false;\n';

  config = withMainActivity(config, (config) => {
    const { modResults } = config;
    let src = modResults.contents;
    if (src && !/isNavigationBarContrastEnforced/.test(src)) {
      // Insert right after the `setTheme(R.style.AppTheme);` call in onCreate,
      // which every Expo template includes. Fall back to the onCreate opener if
      // the setTheme line is missing.
      const anchor = 'setTheme(R.style.AppTheme);';
      if (src.includes(anchor)) {
        src = src.replace(anchor, anchor + RUNTIME_DISABLE);
        modResults.contents = src;
      } else if (/fun onCreate\(savedInstanceState: Bundle\?\)[^{]*\{/.test(src)) {
        src = src.replace(
          /(fun onCreate\(savedInstanceState: Bundle\?\)[^{]*\{)/,
          '$1' + RUNTIME_DISABLE
        );
        modResults.contents = src;
      }
    }
    return config;
  });

  return config;
}

module.exports = withAndroidNavigationBarTheme;
