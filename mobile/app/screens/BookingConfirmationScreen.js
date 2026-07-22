import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import ScreenWrapper from '../components/ScreenWrapper';
import MapPlaceholder from '../components/MapPlaceholder';
import { formatUgx } from '../utils/ratings';

/** Booking confirmed — post-payment success (client only) */
export default function BookingConfirmationScreen({ booking = {}, onNavigate }) {
  const insets = useSafeAreaInsets();
  const artisanName = booking.artisan?.name || booking.artisanName || 'Fundi';
  const firstName = artisanName.split(' ')[0];
  const service = booking.service || 'Service';
  const address = booking.address || booking.location || '';
  const total = booking.total || booking.amount || 17600;
  const eta = booking.eta || 8;
  const dateTime = [booking.date, booking.time].filter(Boolean).join(' · ') || 'Today · ASAP';

  return (
    <ScreenWrapper style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom, 24) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={48} color={theme.colors.textDark} />
        </View>
        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.sub}>{firstName} is on his way to your location.</Text>

        <Text style={styles.section}>BOOKING DETAILS</Text>
        <View style={styles.panel}>
          <Text style={styles.line}>
            {service} · {artisanName}
          </Text>
          <Text style={styles.lineMuted}>{address}</Text>
          <Text style={styles.lineMutedSmall}>{dateTime}</Text>
          <View style={styles.twoCol}>
            <View>
              <Text style={styles.colLabel}>Escrow Amount</Text>
              <Text style={styles.colVal}>{formatUgx(total)}</Text>
            </View>
            <View>
              <Text style={styles.colLabel}>ETA</Text>
              <Text style={styles.colVal}>{eta} mins</Text>
            </View>
          </View>
          <View style={styles.heldBadge}>
            <Text style={styles.heldText}>Held in escrow</Text>
          </View>
        </View>

        <View style={styles.shareBox}>
          <View style={{ flex: 1 }}>
            <Text style={styles.shareTitle}>
              Your location is being shared with {firstName}
            </Text>
            <Text style={styles.shareSub}>Visible on their navigation map.</Text>
          </View>
          <View style={{ width: 72 }}>
            <MapPlaceholder height={56} />
          </View>
        </View>

        <Text style={styles.nextLabel}>WHAT'S NEXT</Text>

        <PrimaryButton onPress={() => onNavigate?.('tracking')} style={styles.mainBtn}>
          Track Live
        </PrimaryButton>

        <PrimaryButton
          filled={false}
          onPress={() => onNavigate?.('jobInProgress')}
          style={styles.mainBtn}
        >
          Job in progress
        </PrimaryButton>

        <View style={styles.rowActions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => onNavigate?.('bookings')}>
            <Ionicons name="calendar-outline" size={18} color={theme.colors.accent} />
            <Text style={styles.secondaryText}>My Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() =>
            onNavigate?.('chat', { targetUserId: booking.artisan?._id || booking.artisan?.id || booking.fundiId })
          }>
            <Ionicons name="chatbubble-outline" size={18} color={theme.colors.accent} />
            <Text style={styles.secondaryText}>Message {firstName}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => onNavigate?.('home')}>
          <Text style={styles.safety}>Back to home →</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  container: { paddingHorizontal: 24, paddingTop: 24, alignItems: 'center' },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { color: theme.colors.white, fontSize: 26, fontWeight: '800' },
  sub: { color: theme.colors.muted, textAlign: 'center', marginTop: 8, marginBottom: 20 },
  section: {
    alignSelf: 'flex-start',
    color: theme.colors.accent,
    fontSize: theme.typography.caps,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  panel: {
    alignSelf: 'stretch',
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 16,
  },
  line: { color: theme.colors.white, fontWeight: '700', fontSize: 15 },
  lineMuted: { color: theme.colors.muted, fontSize: 13, marginTop: 4 },
  lineMutedSmall: { color: theme.colors.mutedDark, fontSize: 12, marginTop: 2 },
  twoCol: { flexDirection: 'row', marginTop: 16, gap: 24 },
  colLabel: { color: theme.colors.muted, fontSize: 11 },
  colVal: { color: theme.colors.accent, fontWeight: '900', fontSize: 16, marginTop: 4 },
  heldBadge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: 'rgba(34,197,94,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heldText: { color: theme.colors.green, fontWeight: '700', fontSize: 12 },
  shareBox: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 20,
    gap: 10,
  },
  shareTitle: { color: theme.colors.muted, fontSize: 12, lineHeight: 18 },
  shareSub: { color: theme.colors.mutedDark, fontSize: 11, marginTop: 4 },
  nextLabel: {
    alignSelf: 'stretch',
    color: theme.colors.muted,
    fontSize: theme.typography.caps,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  mainBtn: { marginBottom: 10 },
  rowActions: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryText: { color: theme.colors.accent, fontWeight: '700', fontSize: 12 },
  safety: { color: theme.colors.muted, fontSize: 13, textAlign: 'center' },
});
