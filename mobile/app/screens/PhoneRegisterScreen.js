import React, { useState } from 'react';
import { Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import ScrollScreen from '../components/ScrollScreen';
import AuthHeader from '../components/AuthHeader';
import PrimaryButton from '../components/PrimaryButton';
import PhoneInput from '../components/PhoneInput';
import theme from '../theme';

export default function PhoneRegisterScreen({ onSend, onBack, submitting = false }) {
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
      <AuthHeader
        onBack={onBack}
        title="Verify your phone"
        subtitle="We'll send a 4-digit code to confirm your number."
      />
      <View style={styles.form}>
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
      </View>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 24 },
  form: { marginTop: 24 },
});
