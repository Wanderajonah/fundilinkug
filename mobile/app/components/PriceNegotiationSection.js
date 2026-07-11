import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import theme from '../theme';
import PrimaryButton from './PrimaryButton';
import { formatUgx } from '../utils/ratings';
import { priceSummaryText } from '../utils/bookings';

export default function PriceNegotiationSection({
  booking,
  role = 'customer',
  onPropose,
  onAgree,
  loading = false,
}) {
  const [priceInput, setPriceInput] = useState('');

  if (!booking || booking.status !== 'ACCEPTED') return null;

  const roleKey = role === 'fundi' ? 'FUNDI' : 'CLIENT';
  const isMyProposal = booking.proposedBy === roleKey;
  const canAgree =
    booking.proposedPrice &&
    booking.proposedBy &&
    booking.proposedBy !== roleKey &&
    !booking.priceAgreed;

  const handlePropose = () => {
    const amount = Number(String(priceInput).replace(/\D/g, ''));
    if (!amount) return;
    onPropose?.(amount);
    setPriceInput('');
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Price Negotiation</Text>
      <Text style={styles.summary}>{priceSummaryText(booking)}</Text>

      {booking.priceAgreed ? (
        <View style={styles.agreedBadge}>
          <Text style={styles.agreedText}>✓ Price agreed · {formatUgx(booking.agreedPrice)}</Text>
        </View>
      ) : (
        <>
          {booking.proposedPrice ? (
            <View style={styles.proposalBox}>
              <Text style={styles.proposalLabel}>
                Current offer from {booking.proposedBy === 'CLIENT' ? 'Client' : 'Fundi'}
              </Text>
              <Text style={styles.proposalPrice}>{formatUgx(booking.proposedPrice)}</Text>
            </View>
          ) : (
            <Text style={styles.hint}>Propose a price or wait for the other party.</Text>
          )}

          <Text style={styles.fieldLabel}>Your price (UGX)</Text>
          <TextInput
            value={priceInput}
            onChangeText={setPriceInput}
            placeholder="e.g. 50000"
            placeholderTextColor={theme.colors.mutedDark}
            keyboardType="number-pad"
            style={styles.input}
          />

          <View style={styles.actions}>
            <PrimaryButton
              style={styles.btn}
              onPress={handlePropose}
              disabled={loading || !priceInput}
            >
              {loading ? 'Sending…' : isMyProposal ? 'Update Proposal' : 'Propose Price'}
            </PrimaryButton>

            {canAgree ? (
              <PrimaryButton
                style={styles.btn}
                filled={false}
                onPress={() => onAgree?.()}
                disabled={loading}
              >
                Agree to {formatUgx(booking.proposedPrice)}
              </PrimaryButton>
            ) : null}
          </View>

          {loading ? <ActivityIndicator color={theme.colors.accent} style={{ marginTop: 8 }} /> : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: { color: theme.colors.white, fontWeight: '900', fontSize: 16, marginBottom: 6 },
  summary: { color: theme.colors.muted, fontSize: 13, marginBottom: 12 },
  hint: { color: theme.colors.mutedDark, fontSize: 12, marginBottom: 12 },
  proposalBox: {
    backgroundColor: 'rgba(255,184,0,0.08)',
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.2)',
  },
  proposalLabel: { color: theme.colors.muted, fontSize: 11, fontWeight: '700' },
  proposalPrice: { color: theme.colors.accent, fontWeight: '900', fontSize: 20, marginTop: 4 },
  fieldLabel: { color: theme.colors.muted, fontSize: 11, fontWeight: '700', marginBottom: 6 },
  input: {
    backgroundColor: theme.colors.panel,
    borderRadius: theme.radius.md,
    padding: 12,
    color: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  actions: { gap: 10 },
  btn: { marginTop: 0 },
  agreedBadge: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderRadius: theme.radius.md,
    padding: 12,
  },
  agreedText: { color: theme.colors.green, fontWeight: '800', textAlign: 'center' },
});
