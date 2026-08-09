import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import ScreenWrapper from '../components/ScreenWrapper';
import { formatUgx } from '../utils/ratings';
import { useLanguage } from '../i18n/LanguageContext';

/** Shown immediately after the client submits a booking request */
export default function BookingSubmittedScreen({ booking = {}, onNavigate }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const service = booking.service || booking.category || t('Service');
  const address = booking.address || booking.location || '';

  useEffect(() => {
    const t = setTimeout(() => {
      onNavigate?.('bookingWaiting', { booking });
    }, 2500);
    return () => clearTimeout(t);
  }, [booking, onNavigate]);

  return (
    <ScreenWrapper style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: Math.max(insets.bottom, 24) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={48} color={theme.colors.textDark} />
        </View>
        <Text style={styles.title}>{t('Booking Request Sent!')}</Text>
        <Text style={styles.sub}>
          {t("We're notifying nearby fundis. You'll see live updates while we find someone for you.")}
        </Text>

        <Text style={styles.section}>{t('REQUEST DETAILS')}</Text>
        <View style={styles.panel}>
          <Text style={styles.line}>{service}</Text>
          <Text style={styles.lineMuted}>{address}</Text>
          {booking.description ? <Text style={styles.lineMuted}>{booking.description}</Text> : null}
        </View>

        <PrimaryButton onPress={() => onNavigate?.('bookingWaiting', { booking })} style={styles.mainBtn}>
          {t('View booking status')}
        </PrimaryButton>

        <TouchableOpacity onPress={() => onNavigate?.('home')}>
          <Text style={styles.link}>{t('Back to home →')}</Text>
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
  title: { color: theme.colors.white, fontSize: 26, fontWeight: '800', textAlign: 'center' },
  sub: { color: theme.colors.muted, textAlign: 'center', marginTop: 8, marginBottom: 20, lineHeight: 20 },
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
    marginBottom: 20,
  },
  line: { color: theme.colors.white, fontWeight: '700', fontSize: 15 },
  lineMuted: { color: theme.colors.muted, fontSize: 13, marginTop: 4 },
  mainBtn: { alignSelf: 'stretch', marginBottom: 16 },
  link: { color: theme.colors.muted, fontSize: 13, textAlign: 'center' },
});
