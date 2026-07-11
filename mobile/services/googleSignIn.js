import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

// MUST be called at module level, outside any component
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export function useGoogleSignIn() {
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const missing = [];
  if (!androidClientId) missing.push('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID');
  if (!iosClientId) missing.push('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID');
  if (!webClientId) missing.push('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');

  if (missing.length) {
    throw new Error(
      `Google sign-in client IDs are not configured. Missing: ${missing.join(
        ', '
      )}. Check your EAS/Expo environment variables (EXPO_PUBLIC_*) and rebuild.`
    );
  }

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId,
    iosClientId,
    webClientId,
  });

  return { request, response, promptAsync };
}


export async function fetchGoogleUser(accessToken) {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error('Unable to fetch Google profile information.');

  const user = await res.json();
  return {
    id: user.id,
    name: user.name || user.email || 'Google User',
    email: user.email,
    picture: user.picture,
  };
}

// Standalone helper intentionally not provided, because this file
// uses Expo's `useAuthRequest` hook which must run inside a React component.
// Callers should use `useGoogleSignIn()` and then `promptAsync()`.
export async function googleSignIn() {
  throw new Error(
    'googleSignIn() is not available here. Use the `useGoogleSignIn` hook in your component and call promptAsync().'
  );
}

export function mapGoogleSignInError(error) {
  const message = error?.message || '';
  if (message.includes('No matching browser activity found')) {
    return 'Google sign-in requires a browser app. Please install Chrome or another browser and try again.';
  }
  if (message.includes('cancelled')) {
    return 'Sign-in was cancelled.';
  }
  return message || 'Google sign-in failed.';
}

