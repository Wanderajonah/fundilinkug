import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScrollScreen from '../components/ScrollScreen';
import PrimaryButton from '../components/PrimaryButton';
import theme from '../theme';
import { sendOtp } from '../../services/authApi';

/** Exactly four OTP slots — do not change length without updating backend. */
const OTP_LENGTH = 4;
const OTP_INDEXES = [0, 1, 2, 3];

function emptyDigits() {
  return ['', '', '', ''];
}

export default function OtpScreen({
  phone = '+256 700 123 456',
  phoneRaw = '',
  purpose = 'register',
  expiresIn = 600,
  devCode = '',
  onBack,
  onVerify,
  onResent,
}) {
  const [digits, setDigits] = useState(emptyDigits);
  const [seconds, setSeconds] = useState(expiresIn);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [localDevCode, setLocalDevCode] = useState(devCode);
  const inputRefs = useRef([]);
  const hiddenRef = useRef(null);

  const code = digits.join('');

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setDigits(emptyDigits());
    setSeconds(expiresIn);
  }, [expiresIn, phoneRaw]);

  useEffect(() => {
    setLocalDevCode(devCode);
  }, [devCode]);

  const applyCode = useCallback(
    (raw) => {
      const chars = String(raw || '')
        .replace(/\D/g, '')
        .slice(0, OTP_LENGTH)
        .split('');
      const next = emptyDigits();
      chars.forEach((ch, i) => {
        next[i] = ch;
      });
      setDigits(next);
      return next.join('');
    },
    []
  );

  const handleVerify = async (enteredCode = code) => {
    if (enteredCode.length !== OTP_LENGTH) {
      Alert.alert('Invalid code', `Enter the full ${OTP_LENGTH}-digit code.`);
      return;
    }
    setLoading(true);
    try {
      await onVerify?.(enteredCode);
    } catch (error) {
      Alert.alert(
        'Verification failed',
        error?.response?.data?.message || 'Invalid or expired code.'
      );
    } finally {
      setLoading(false);
    }
  };

  const onCodeComplete = useCallback(
    (nextCode) => {
      if (nextCode.length === OTP_LENGTH) {
        inputRefs.current[OTP_LENGTH - 1]?.blur();
        handleVerify(nextCode);
      }
    },
    [code]
  );

  const handleChangeDigit = (raw, index) => {
    const onlyDigits = raw.replace(/\D/g, '');

    if (onlyDigits.length > 1) {
      const nextCode = applyCode(onlyDigits);
      const lastIndex = Math.min(onlyDigits.length, OTP_LENGTH) - 1;
      inputRefs.current[lastIndex]?.focus();
      if (nextCode.length === OTP_LENGTH) onCodeComplete(nextCode);
      return;
    }

    const next = [...digits];
    next[index] = onlyDigits.slice(-1);
    setDigits(next);
    const nextCode = next.join('');

    if (onlyDigits && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (nextCode.length === OTP_LENGTH) onCodeComplete(nextCode);
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
    }
  };

  const handleHiddenChange = (raw) => {
    const nextCode = applyCode(raw);
    if (nextCode.length === OTP_LENGTH) onCodeComplete(nextCode);
  };

  const handleResend = async () => {
    if (seconds > expiresIn - 60) {
      Alert.alert('Please wait', 'You can resend after the cooldown period.');
      return;
    }
    try {
      setResending(true);
      const { data } = await sendOtp(phoneRaw || phone, purpose);
      setSeconds(data.expiresIn || 600);
      if (data.devCode) setLocalDevCode(data.devCode);
      setDigits(emptyDigits());
      onResent?.(data);
    } catch (error) {
      Alert.alert('Resend failed', error?.response?.data?.message || 'Could not resend OTP.');
    } finally {
      setResending(false);
    }
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <ScrollScreen contentStyle={styles.container} bottomPad={32}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.black} />
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.white} />
      </TouchableOpacity>

      <View style={styles.phoneArt}>
        <Ionicons name="phone-portrait-outline" size={48} color={theme.colors.accent} />
      </View>

      <Text style={styles.title}>Verify your number</Text>
      <Text style={styles.sub}>
        Enter the 4-digit code sent to <Text style={styles.phone}>{phone}</Text>
      </Text>

      {localDevCode ? (
        <View style={styles.devCodeWrap}>
          <Text style={styles.devCodeLabel}>Dev code</Text>
          <Text style={styles.devCode}>{localDevCode}</Text>
        </View>
      ) : null}

      {/* Hidden field for SMS autofill — does not render visible boxes */}
      <TextInput
        ref={hiddenRef}
        value={code}
        onChangeText={handleHiddenChange}
        maxLength={OTP_LENGTH}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        importantForAutofill="yes"
        style={styles.hiddenInput}
        caretHidden
      />

      <TouchableOpacity
        activeOpacity={1}
        style={styles.otpWrap}
        onPress={() => inputRefs.current[0]?.focus()}
      >
        <View style={styles.otpRow}>
          {OTP_INDEXES.map((index) => (
            <TextInput
              key={`otp-slot-${index}`}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              style={[styles.otpBox, loading && styles.otpBoxDisabled]}
              value={digits[index]}
              maxLength={1}
              keyboardType="number-pad"
              editable={!loading}
              autoCorrect={false}
              autoCapitalize="none"
              selectTextOnFocus
              importantForAutofill="no"
              textContentType="none"
              autoComplete="off"
              onChangeText={(v) => handleChangeDigit(v, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
            />
          ))}
        </View>
      </TouchableOpacity>

      <Text style={styles.timer}>
        Code expires in <Text style={styles.timerAccent}>{mm}:{ss}</Text>
      </Text>

      {loading ? (
        <ActivityIndicator color={theme.colors.accent} style={{ marginVertical: 12 }} />
      ) : (
        <PrimaryButton onPress={() => handleVerify()}>Verify Code</PrimaryButton>
      )}

      <TouchableOpacity onPress={handleResend} disabled={resending}>
        <Text style={styles.resend}>
          Didn't receive the code?{' '}
          <Text style={styles.link}>{resending ? 'Sending…' : 'Resend'}</Text>
        </Text>
      </TouchableOpacity>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.black, paddingHorizontal: 24 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.input,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  phoneArt: {
    alignSelf: 'center',
    marginTop: 32,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,184,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: theme.colors.white,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 24,
  },
  sub: { color: theme.colors.muted, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  phone: { color: theme.colors.accent, fontWeight: '700' },
  devCodeWrap: {
    alignSelf: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,184,0,0.1)',
    borderWidth: 1,
    borderColor: theme.colors.accent,
    alignItems: 'center',
  },
  devCodeLabel: { color: theme.colors.accent, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  devCode: { color: theme.colors.white, fontSize: 28, fontWeight: '800', letterSpacing: 4 },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  otpWrap: { marginTop: 28, marginBottom: 8, alignItems: 'center' },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  otpBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.input,
    color: theme.colors.white,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  otpBoxDisabled: { opacity: 0.6 },
  timer: { textAlign: 'center', color: theme.colors.muted, marginVertical: 20, fontSize: 13 },
  timerAccent: { color: theme.colors.accent, fontWeight: '700' },
  resend: { textAlign: 'center', color: theme.colors.muted, marginTop: 16, fontSize: 14 },
  link: { color: theme.colors.accent, fontWeight: '700' },
});
