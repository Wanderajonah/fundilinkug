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
import ScrollScreen from '../components/ScrollScreen';
import AuthHeader from '../components/AuthHeader';
import AuthButton from '../components/AuthButton';
import PhoneInput from '../components/PhoneInput';
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

      <AuthHeader
        onBack={onBack}
        subtitle={
          isFundi
            ? 'Sign in to your fundi dashboard'
            : 'Sign in to find and book trusted fundis'
        }
      />

      <View style={styles.form}>
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
      </View>

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

  form: { marginTop: 24 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { color: theme.colors.mutedDark, fontSize: 12, fontWeight: '600', marginHorizontal: 12 },

  createRow: { marginTop: 20, alignItems: 'center' },
  createText: { color: theme.colors.muted, fontSize: 14 },
  createLink: { color: theme.colors.accent, fontWeight: '700' },
});