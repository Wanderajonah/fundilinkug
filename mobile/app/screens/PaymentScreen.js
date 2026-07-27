import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import PrimaryButton from '../components/PrimaryButton';
import PhoneInput from '../components/PhoneInput';
import theme from '../theme';
import { formatUgx } from '../utils/ratings';
import { canProceedToPayment } from '../utils/bookings';

export default function PaymentScreen({ booking: bk, onBack, onPay, loading = false, error = '', walletBalance }) {
  const insets = useSafeAreaInsets();
  const [payMethod, setPayMethod] = useState('wallet');
  const [mobileMethod, setMobileMethod] = useState('mtn');
  const [phone, setPhone] = useState('');
  const booking = bk || {};
  const total = booking.total || booking.amount || 17600;
  const canPay = canProceedToPayment(booking) || booking.paid;
  const walletSufficient = walletBalance !== null && walletBalance !== undefined && walletBalance >= total;

  const handlePay = () => {
    if (payMethod === 'wallet') {
      onPay?.('wallet');
    } else {
      onPay?.('mobile_money', mobileMethod, phone);
    }
  };

  return (
    <ScreenWrapper style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Payment</Text>
          <View style={{ width: 40 }} />
        </View>

        {!canPay ? (
          <View style={styles.lockBanner}>
            <Ionicons name="lock-closed-outline" size={18} color={theme.colors.accent} />
            <Text style={styles.lockText}>
              Proceed to Payment unlocks once your fundi accepts and you both agree on the price.
            </Text>
          </View>
        ) : null}

        <View style={styles.summary}>
          <Text style={styles.summaryName}>{booking.artisanName || 'Fundi'} · {booking.service || 'Service'}</Text>
          <Text style={styles.summaryMeta}>{booking.date || 'Sat, Apr 27'} · {booking.time || '09:00 AM'}</Text>
          <Text style={styles.summaryLoc}>{typeof booking.location === 'string' ? booking.location : (booking.address || 'Plot 14 Bukoto St')}</Text>
          <Text style={styles.total}>UGX {total.toLocaleString()}</Text>
        </View>

        <Text style={styles.section}>PAYMENT METHOD</Text>

        <View style={styles.methodTabs}>
          <TouchableOpacity
            style={[styles.methodTab, payMethod === 'wallet' && styles.methodTabOn]}
            onPress={() => setPayMethod('wallet')}
          >
            <Ionicons
              name="wallet-outline"
              size={18}
              color={payMethod === 'wallet' ? theme.colors.textDark : theme.colors.muted}
            />
            <Text style={[styles.methodTabText, payMethod === 'wallet' && styles.methodTabTextOn]}>
              Wallet
            </Text>
            {walletBalance !== null && walletBalance !== undefined ? (
              <Text style={[styles.methodTabDetail, payMethod === 'wallet' && styles.methodTabDetailOn]}>
                UGX {walletBalance.toLocaleString()}
              </Text>
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodTab, payMethod === 'mobile_money' && styles.methodTabOn]}
            onPress={() => setPayMethod('mobile_money')}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={18}
              color={payMethod === 'mobile_money' ? theme.colors.textDark : theme.colors.muted}
            />
            <Text style={[styles.methodTabText, payMethod === 'mobile_money' && styles.methodTabTextOn]}>
              Mobile Money
            </Text>
          </TouchableOpacity>
        </View>

        {payMethod === 'wallet' ? (
          <View style={styles.walletInfo}>
            <Ionicons name="wallet-outline" size={32} color={theme.colors.accent} />
            <Text style={styles.walletBalance}>UGX {(walletBalance ?? 0).toLocaleString()}</Text>
            <Text style={styles.walletLabel}>Available Balance</Text>
            {walletSufficient ? (
              <Text style={styles.walletSufficient}>Sufficient balance</Text>
            ) : (
              <Text style={styles.walletInsufficient}>
                Insufficient balance. Please deposit UGX {(total - (walletBalance || 0)).toLocaleString()} or use Mobile Money.
              </Text>
            )}
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.methodCard, mobileMethod === 'mtn' && styles.methodOn]}
              onPress={() => setMobileMethod('mtn')}
            >
              <View style={styles.methodLeft}>
                <View style={[styles.logo, { backgroundColor: '#FFCC00' }]}>
                  <Text style={styles.logoText}>MTN</Text>
                </View>
                <Text style={styles.methodName}>MTN Mobile Money</Text>
              </View>
              <View style={[styles.radio, mobileMethod === 'mtn' && styles.radioOn]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.methodCard, mobileMethod === 'airtel' && styles.methodOn]}
              onPress={() => setMobileMethod('airtel')}
            >
              <View style={styles.methodLeft}>
                <View style={[styles.logo, { backgroundColor: '#E40000' }]}>
                  <Text style={[styles.logoText, { color: '#fff' }]}>A</Text>
                </View>
                <Text style={styles.methodName}>Airtel Money</Text>
              </View>
              <View style={[styles.radio, mobileMethod === 'airtel' && styles.radioOn]} />
            </TouchableOpacity>

            <View style={styles.escrow}>
              <Ionicons name="lock-closed-outline" size={14} color={theme.colors.muted} />
              <Text style={styles.escrowText}> Funds held in escrow until job is confirmed complete.</Text>
            </View>

            <PhoneInput label="MOMO NUMBER" value={phone} onChangeText={setPhone} placeholder="7XX XXX XXX" />
            <Text style={styles.hint}>You'll receive a MoMo STK push prompt to approve on your phone.</Text>
          </>
        )}

        <View style={styles.breakdown}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Service (2hrs est.)</Text>
            <Text style={styles.rowVal}>{formatUgx(booking.serviceFee || 16000)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Platform fee (10%)</Text>
            <Text style={styles.rowVal}>{formatUgx(booking.platformFee || 1600)}</Text>
          </View>
          <View style={[styles.row, styles.rowTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalVal}>UGX {total.toLocaleString()}</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#ff4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <PrimaryButton
          onPress={handlePay}
          disabled={!canPay || loading || (payMethod === 'wallet' && !walletSufficient)}
        >
          {loading ? 'Processing…' : payMethod === 'wallet' ? `Pay with Wallet · UGX ${total.toLocaleString()}` : `Proceed to Payment · UGX ${total.toLocaleString()}`}
        </PrimaryButton>
        {!canPay ? (
          <Text style={styles.disabledHint}>Complete price negotiation to enable payment.</Text>
        ) : payMethod === 'wallet' && !walletSufficient && walletBalance !== null ? (
          <Text style={styles.disabledHint}>Insufficient wallet balance. Deposit or switch to Mobile Money.</Text>
        ) : null}
        {loading ? <ActivityIndicator color={theme.colors.accent} style={{ marginTop: 12 }} /> : null}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { color: theme.colors.white, fontSize: 18, fontWeight: '800' },
  summary: {
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 20,
  },
  summaryName: { color: theme.colors.white, fontWeight: '800', fontSize: 15 },
  summaryMeta: { color: theme.colors.muted, fontSize: 12, marginTop: 4 },
  summaryLoc: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
  total: { color: theme.colors.accent, fontWeight: '900', fontSize: 22, marginTop: 12 },
  section: {
    color: theme.colors.muted,
    fontSize: theme.typography.caps,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  methodTabs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodTabOn: { borderColor: theme.colors.accent },
  methodTabText: { color: theme.colors.muted, fontWeight: '700', fontSize: 13 },
  methodTabTextOn: { color: theme.colors.accent },
  methodTabDetail: { color: theme.colors.mutedDark, fontSize: 11, fontWeight: '600' },
  methodTabDetailOn: { color: theme.colors.accent },
  walletInfo: {
    alignItems: 'center',
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.lg,
    padding: 24,
    marginBottom: 16,
    gap: 8,
  },
  walletBalance: { color: theme.colors.white, fontWeight: '900', fontSize: 28 },
  walletLabel: { color: theme.colors.muted, fontSize: 12 },
  walletSufficient: { color: theme.colors.green || '#22c55e', fontWeight: '700', fontSize: 13 },
  walletInsufficient: { color: '#ff6b6b', fontSize: 12, textAlign: 'center', lineHeight: 18 },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodOn: { borderColor: theme.colors.accent },
  methodLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontWeight: '900', fontSize: 11, color: theme.colors.textDark },
  methodName: { color: theme.colors.white, fontWeight: '700' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.mutedDark,
  },
  radioOn: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accent },
  escrow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.input,
    padding: 12,
    borderRadius: theme.radius.md,
    marginBottom: 16,
  },
  escrowText: { color: theme.colors.muted, fontSize: 12, lineHeight: 18 },
  hint: { color: theme.colors.mutedDark, fontSize: 12, marginTop: -8, marginBottom: 20 },
  breakdown: { marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { color: theme.colors.muted, fontSize: 13 },
  rowVal: { color: theme.colors.white, fontWeight: '600' },
  rowTotal: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border },
  totalLabel: { color: theme.colors.white, fontWeight: '800' },
  totalVal: { color: theme.colors.accent, fontWeight: '900', fontSize: 18 },
  lockBanner: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,184,0,0.1)',
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.2)',
  },
  lockText: { flex: 1, color: theme.colors.muted, fontSize: 12, lineHeight: 18 },
  disabledHint: { color: theme.colors.mutedDark, fontSize: 12, textAlign: 'center', marginTop: 10 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,68,68,0.1)',
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: '#ff4444', fontSize: 13, flex: 1 },
});
