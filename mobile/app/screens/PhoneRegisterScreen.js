import React, { useState } from 'react';
import { Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import ScrollScreen from '../components/ScrollScreen';
import PrimaryButton from '../components/PrimaryButton';
import PhoneInput from '../components/PhoneInput';
import theme from '../theme';

export default function PhoneRegisterScreen({ onSend, submitting = false }) {
  const [phone, setPhone] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSend = () => {
    if (!phone.trim()) {
      Alert.alert('Phone required', 'Enter your phone number.');
      return;
    }
    onSend?.(phone.trim());
  };

  return (
    <ScrollScreen keyboard contentStyle={styles.scroll} bottomPad={32}>
      <Text style={styles.title}>Verify your phone</Text>
      <Text style={styles.subtitle}>We'll send a 4-digit code to confirm your number.</Text>
      <PhoneInput
        value={phone}
        onChangeText={setPhone}
        focused={focused}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {submitting ? (
        <ActivityIndicator color={theme.colors.accent} style={{ marginTop: 16 }} />
      ) : (
        <PrimaryButton onPress={handleSend} style={{ marginTop: 8 }}>
          Send verification code
        </PrimaryButton>
      )}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 8, paddingTop: 24 },
  title: { color: theme.colors.white, fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: theme.colors.muted, fontSize: 15, lineHeight: 22, marginBottom: 24 },
});
