import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import ScreenWrapper from '../components/ScreenWrapper';
import MapPlaceholder from '../components/MapPlaceholder';
import { formatUgx } from '../utils/ratings';
import { useLanguage } from '../i18n/LanguageContext';

/** Booking confirmed — post-payment success (client only) */
export default function BookingConfirmationScreen({ booking = {}, onNavigate }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const artisanName = booking.artisan?.name || booking.artisanName || t('Fundi');
  const firstName = artisanName.split(' ')[0];
  const service = booking.service || t('Service');
  const address =
    typeof booking.address === 'string'
      ? booking.address
      : typeof booking.location === 'string'
        ? booking.location
        : '';
  const total = booking.total || booking.amount || 17600;
  const eta = booking.eta || 8;
  const dateTime = [booking.date, booking.time].filter(Boolean).join(' · ') || `${t('Today')} · ${t('ASAP')}`;

  return (
    <ScreenWrapper style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom, 24) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={48} color={theme.colors.textDark} />
        </View>
        <Text style={styles.title}>{t('Booking Confirmed!')}</Text>
        <Text style={styles.sub}>{t('{{name}} is on the way to your location.', { name: firstName })}</Text>

        <Text style={styles.section}>{t('BOOKING DETAILS')}</Text>
        <View style={styles.panel}>
          <Text style={styles.line}>
            {service} · {artisanName}
          </Text>
          <Text style={styles.lineMuted}>{address}</Text>
          <Text style={styles.lineMutedSmall}>{dateTime}</Text>
          <View style={styles.twoCol}>
            <View>
              <Text style={styles.colLabel}>{t('Escrow Amount')}</Text>
              <Text style={styles.colVal}>{formatUgx(total)}</Text>
            </View>
            <View>
              <Text style={styles.colLabel}>{t('ETA')}</Text>
              <Text style={styles.colVal}>{t('{{mins}} mins', { mins: eta })}</Text>
            </View>
          </View>
          <View style={styles.heldBadge}>
            <Text style={styles.heldText}>{t('Held in escrow')}</Text>
          </View>
        </View>

        <View style={styles.shareBox}>
          <View style={{ flex: 1 }}>
            <Text style={styles.shareTitle}>
              {t('Your location is being shared with {{name}}', { name: firstName })}
            </Text>
            <Text style={styles.shareSub}>{t('Visible on their navigation map.')}</Text>
          </View>
          <View style={{ width: 72 }}>
            <MapPlaceholder height={56} />
          </View>
        </View>

        <Text style={styles.nextLabel}>{t("WHAT'S NEXT")}</Text>

        <View style={styles.actions}>
          <PrimaryButton onPress={() => onNavigate?.('tracking')} icon="navigate">
            {t('Track Live')}
          </PrimaryButton>

          <PrimaryButton
            filled={false}
            onPress={() =>
              onNavigate?.('chat', {
                targetUserId: booking.artisan?._id || booking.artisan?.id || booking.fundiId,
              })
            }
            icon="chatbubble-outline"
          >
            {t('Message {{name}}', { name: firstName })}
          </PrimaryButton>
        </View>

        <View style={styles.rowActions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => onNavigate?.('bookings')}>
            <Ionicons name="calendar-outline" size={18} color={theme.colors.accent} />
            <Text style={styles.secondaryText}>{t('My Bookings')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => onNavigate?.('home')}>
            <Ionicons name="home-outline" size={18} color={theme.colors.accent} />
            <Text style={styles.secondaryText}>{t('Home')}</Text>
          </TouchableOpacity>
        </View>
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
  actions: { alignSelf: 'stretch', gap: 10, marginBottom: 12 },
  rowActions: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: theme.buttons.radius.md,
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryText: { color: theme.colors.white, fontWeight: '700', fontSize: 13 },
});
