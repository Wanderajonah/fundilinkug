import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScrollScreen from '../components/ScrollScreen';
import AuthButton from '../components/AuthButton';
import PhoneInput from '../components/PhoneInput';
import AppLogo from '../components/AppLogo';
import theme from '../theme';
import { getErrorMessage, handleGoogleSignInResponse } from '../../services/authApi';
import { useGoogleSignIn, fetchGoogleUser } from '../../services/googleSignIn';

export default function SignInScreen({
  role = 'client',
  onBack,
  onPhoneOtp,
  onLoggedIn,
  onCreateAccount,
  onGoogleNewUser,
}) {
  const [phone, setPhone] = useState('');
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);

  const { promptAsync, disabled: googleDisabled } = useGoogleSignIn();

  const isFundi = role === 'fundi';

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await promptAsync();
      if (result?.type === 'success' && result.authentication?.accessToken) {
        const googleUser = await fetchGoogleUser(result.authentication.accessToken);
        const data = await handleGoogleSignInResponse(
          googleUser,
          result.authentication.accessToken,
          { role },
          'signin'
        );

        const isNewUser = data?.isNewUser === true || !data?.user;

        if (isNewUser) {
          onGoogleNewUser?.({
            role,
            googleProfile: {
              firstName: googleUser?.given_name || googleUser?.firstName,
              lastName: googleUser?.family_name || googleUser?.lastName,
              email: googleUser?.email,
            },
          });
          return;
        }

        onLoggedIn?.(data);
      }
    } catch (error) {
      Alert.alert('Sign in failed', getErrorMessage(error));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePhoneContinue = async () => {
    if (!phone.trim()) {
      Alert.alert('Phone required', 'Enter your phone number.');
      return;
    }
    setOtpSending(true);
    try {
      await onPhoneOtp?.({ phone: phone.trim(), role });
    } finally {
      setOtpSending(false);
    }
  };

  return (
    <ScrollScreen keyboard contentStyle={styles.scroll} bottomPad={32}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.black} />

      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={theme.colors.white} />
        </TouchableOpacity>
        <View style={styles.spacer} />
      </View>

      <View style={styles.header}>
        <AppLogo size={64} />
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Sign in to continue as a {isFundi ? 'Fundi' : 'Client'}
        </Text>
      </View>

      <PhoneInput
        value={phone}
        onChangeText={setPhone}
        focused={phoneFocused}
        onFocus={() => setPhoneFocused(true)}
        onBlur={() => setPhoneFocused(false)}
      />

      {otpSending ? (
        <ActivityIndicator color={theme.colors.accent} style={{ marginVertical: 20 }} />
      ) : (
        <AuthButton
          variant="phone"
          label="Continue with Phone"
          onPress={handlePhoneContinue}
        />
      )}

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      <AuthButton
        variant="google"
        label={googleDisabled ? "Google (not configured)" : "Google"}
        onPress={handleGoogle}
        loading={googleLoading}
        disabled={googleDisabled}
      />

      <TouchableOpacity onPress={onCreateAccount} style={styles.createRow}>
        <Text style={styles.createText}>
          Don't have an account? <Text style={styles.createLink}>Sign up</Text>
        </Text>
      </TouchableOpacity>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 24 },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer: { flex: 1 },

  header: {
    alignItems: 'center',
    marginBottom: 32,
  },

  title: {
    color: theme.colors.white,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 20,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { color: theme.colors.mutedDark, fontSize: 12, fontWeight: '600', marginHorizontal: 12 },

  createRow: { marginTop: 24, alignItems: 'center' },
  createText: { color: theme.colors.muted, fontSize: 14 },
  createLink: { color: theme.colors.accent, fontWeight: '700' },
});