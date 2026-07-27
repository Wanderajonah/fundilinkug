import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import theme from '../theme';
import ScreenWrapper from '../components/ScreenWrapper';
import PrimaryButton from '../components/PrimaryButton';
import { deposit } from '../../services/walletApi';

export default function DepositScreen({ onNavigate }) {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [method, setMethod] = useState('mtn');
  const [focusedField, setFocusedField] = useState('');
  const [loading, setLoading] = useState(false);

  const numericAmount = Number(amount.replace(/,/g, '')) || 0;
  const phoneDigits = phone.replace(/\D/g, '');
  const canSubmit = numericAmount > 0 && phoneDigits.length >= 9;

  const handleAmountChange = (value) => {
    const digits = value.replace(/\D/g, '');
    setAmount(digits ? Number(digits).toLocaleString() : '');
  };

  const handlePhoneChange = (value) => {
    const digits = value
      .replace(/\D/g, '')
      .replace(/^256/, '')
      .replace(/^0/, '')
      .slice(0, 9);
    setPhone(digits);
  };

  const handleDeposit = async () => {
    if (numericAmount <= 0) return Alert.alert('Error', 'Enter an amount');
    if (phoneDigits.length < 9) return Alert.alert('Error', 'Enter a valid mobile money number');
    setLoading(true);
    try {
      const { data } = await deposit(numericAmount, method === 'mtn' ? 'mtn_momo' : 'airtel_money', `256${phoneDigits}`);
      Alert.alert('Success', `UGX ${numericAmount.toLocaleString()} deposited successfully!`, [
        { text: 'OK', onPress: () => onNavigate?.('wallet') },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate?.('wallet')}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Deposit</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.section}>SELECT METHOD</Text>
        <TouchableOpacity
          style={[styles.methodCard, method === 'mtn' && styles.methodOn]}
          onPress={() => setMethod('mtn')}
        >
          <View style={styles.methodLeft}>
            <View style={[styles.logo, { backgroundColor: '#FFCC00' }]}>
              <Text style={styles.logoText}>MTN</Text>
            </View>
            <Text style={styles.methodName}>MTN Mobile Money</Text>
          </View>
          <View style={[styles.radio, method === 'mtn' && styles.radioOn]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.methodCard, method === 'airtel' && styles.methodOn]}
          onPress={() => setMethod('airtel')}
        >
          <View style={styles.methodLeft}>
            <View style={[styles.logo, { backgroundColor: '#E40000' }]}>
              <Text style={[styles.logoText, { color: '#fff' }]}>A</Text>
            </View>
            <Text style={styles.methodName}>Airtel Money</Text>
          </View>
          <View style={[styles.radio, method === 'airtel' && styles.radioOn]} />
        </TouchableOpacity>

        <Text style={styles.section}>AMOUNT</Text>
        <View style={[styles.field, focusedField === 'amount' && styles.fieldFocused]}>
          <View style={styles.fieldIcon}>
            <Ionicons name="cash-outline" size={18} color={theme.colors.accent} />
          </View>
          <View style={styles.fieldBody}>
            <Text style={styles.fieldLabel}>Amount to deposit</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currency}>UGX</Text>
              <TextInput
                style={styles.amountTextInput}
                value={amount}
                onChangeText={handleAmountChange}
                onFocus={() => setFocusedField('amount')}
                onBlur={() => setFocusedField('')}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={theme.colors.mutedDark}
              />
            </View>
          </View>
        </View>

        <Text style={styles.section}>MOMO NUMBER</Text>
        <View style={[styles.field, focusedField === 'phone' && styles.fieldFocused]}>
          <View style={styles.fieldIcon}>
            <Ionicons name="phone-portrait-outline" size={18} color={theme.colors.accent} />
          </View>
          <View style={styles.fieldBody}>
            <Text style={styles.fieldLabel}>{method === 'mtn' ? 'MTN' : 'Airtel'} mobile money number</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.phonePrefix}>+256</Text>
              <TextInput
                style={styles.phoneTextInput}
                value={phone}
                onChangeText={handlePhoneChange}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField('')}
                keyboardType="phone-pad"
                placeholder="7XX XXX XXX"
                placeholderTextColor={theme.colors.mutedDark}
                maxLength={9}
              />
            </View>
          </View>
        </View>
        <Text style={styles.hint}>You will receive a STK push prompt to approve payment on your phone.</Text>

        <PrimaryButton onPress={handleDeposit} disabled={loading || !canSubmit}>
          {loading ? 'Processing...' : `Deposit UGX ${numericAmount.toLocaleString()}`}
        </PrimaryButton>
        {loading ? <ActivityIndicator color={theme.colors.accent} style={{ marginTop: 12 }} /> : null}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.input, justifyContent: 'center', alignItems: 'center' },
  title: { color: theme.colors.white, fontSize: 18, fontWeight: '800' },
  section: { color: theme.colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10, marginTop: 8 },
  methodCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.colors.input, borderRadius: theme.radius.md, padding: 14, marginBottom: 10,
    borderWidth: 2, borderColor: 'transparent',
  },
  methodOn: { borderColor: theme.colors.accent },
  methodLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontWeight: '900', fontSize: 11, color: theme.colors.textDark },
  methodName: { color: theme.colors.white, fontWeight: '700' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.colors.mutedDark },
  radioOn: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accent },
  field: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fieldFocused: {
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.surface,
  },
  fieldIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,184,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fieldBody: { flex: 1 },
  fieldLabel: { color: theme.colors.mutedDark, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  currency: { color: theme.colors.accent, fontWeight: '900', fontSize: 15, marginRight: 8 },
  amountTextInput: { color: theme.colors.white, fontSize: 24, fontWeight: '900', flex: 1, paddingVertical: 0 },
  phoneRow: { flexDirection: 'row', alignItems: 'center' },
  phonePrefix: {
    color: theme.colors.white,
    fontWeight: '900',
    fontSize: 16,
    marginRight: 8,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: theme.colors.borderLight,
  },
  phoneTextInput: { color: theme.colors.white, fontSize: 18, fontWeight: '800', flex: 1, paddingVertical: 0 },
  hint: { color: theme.colors.mutedDark, fontSize: 12, lineHeight: 18, marginBottom: 24, marginTop: -6 },
});
