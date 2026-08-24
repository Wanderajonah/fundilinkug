import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import FundiMap from '../components/FundiMap';
import PrimaryButton from '../components/PrimaryButton';
import { useLocation } from '../../context/LocationContext';
import { useBookingOptional } from '../../context/BookingContext';
import { getRoutePreview } from '../../services/mapsApi';
import { initials } from '../utils/ratings';
import theme from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

const STEPS = ['Confirmed', 'Paid', 'On Way', 'Arrived', 'Done'];

export default function LiveTrackingScreen({ job = {}, onBack, onChat, onJobStarted }) {
  const { t } = useLanguage();
  const fundiName = job.fundiName || t('Fundi');
  const firstName = fundiName.split(' ')[0];
  const { coords, region } = useLocation();
  const bookingCtx = useBookingOptional();
  const [route, setRoute] = useState(null);

  // Only trust real GPS fixes from the fundi — never guess from a hardcoded
  // point, otherwise the km/ETA shown would be fiction.
  const liveFundi = bookingCtx?.fundiLocation || job.fundiLocation;
  const hasLiveFundi = Boolean(liveFundi?.lat && liveFundi?.lng);
  const fundiCoords = hasLiveFundi
    ? { lat: liveFundi.lat, lng: liveFundi.lng, title: fundiName }
    : null;

  const statusMessage = useMemo(() => {
    const status = job.status?.toUpperCase?.() || job.status;
    if (status === 'ARRIVED') return t('{{name}} has arrived at your location', { name: firstName });
    if (status === 'IN_PROGRESS') return t('{{name}} is working on your job', { name: firstName });
    return t('{{name}} is on the way to you', { name: firstName });
  }, [firstName, job.status, t]);

  useEffect(() => {
    if (!hasLiveFundi) {
      setRoute(null);
      return;
    }
    (async () => {
      try {
        const { data } = await getRoutePreview({
          fromLat: fundiCoords.lat,
          fromLng: fundiCoords.lng,
          toLat: coords.lat,
          toLng: coords.lng,
        });
        setRoute(data);
      } catch {
        /* keep previous / none */
      }
    })();
  }, [hasLiveFundi, fundiCoords?.lat, fundiCoords?.lng, coords.lat, coords.lng]);

  const activeStep =
    job.status === 'IN_PROGRESS' || job.status === 'in_progress'
      ? 4
      : job.status === 'ARRIVED'
        ? 3
        : 2;

  return (
    <ScreenWrapper style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.white} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('Live Tracking')}</Text>
            <View style={[styles.etaBadge, !route && styles.etaBadgeIdle]}>
              <Text style={styles.etaText}>
                {route
                  ? t('ETA {{mins}} mins', { mins: route.etaMinutes })
                  : t('Locating fundi…')}
              </Text>
            </View>
          </View>
        </View>

        <FundiMap
          style={styles.map}
          region={region}
          currentLocation={coords}
          destination={fundiCoords}
          fundis={
            job.fundiId && fundiCoords
              ? [{ _id: job.fundiId, userId: { location: fundiCoords, name: fundiName } }]
              : []
          }
        />

        <View style={styles.content}>
          {route ? (
            <Text style={styles.distance}>
              {t('≈ {{km}} km away', { km: route.distanceKm })}
            </Text>
          ) : (
            <Text style={styles.distanceIdle}>
              {t('Distance shows once the fundi shares live location')}
            </Text>
          )}
          <Text style={styles.status}>{statusMessage}</Text>

          <View style={styles.stepper}>
            {STEPS.map((s, i) => (
              <View key={s} style={styles.stepItem}>
                <View style={[styles.stepDot, i <= activeStep && styles.stepDotOn]} />
                <Text style={[styles.stepLabel, i <= activeStep && styles.stepLabelOn]}>{t(s)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.fundiCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(fundiName)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{fundiName}</Text>
              <Text style={styles.meta}>{job.service || t('Service')} · {t('Live location updating')}</Text>
            </View>
            <PrimaryButton style={styles.chatBtn} onPress={onChat}>
              💬 {t('Chat')}
            </PrimaryButton>
          </View>

          <PrimaryButton style={{ marginBottom: 12 }} onPress={onJobStarted}>
            {t('Fundi arrived — job started')}
          </PrimaryButton>

          <TouchableOpacity style={styles.shareLink}>
            <Text style={styles.shareText}>🔗 {t('Share trip with a contact for safety')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sosBtn}>
            <Text style={styles.sosText}>🚨 {t('SOS Emergency SOS')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  container: { paddingBottom: 32, flexGrow: 1 },
  topBar: { paddingHorizontal: 20 },
  content: { paddingHorizontal: 20 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  headerTitle: { color: theme.colors.white, fontSize: 18, fontWeight: '800' },
  etaBadge: {
    position: 'absolute',
    right: 0,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  etaText: { color: theme.colors.textDark, fontWeight: '800', fontSize: 12 },
  etaBadgeIdle: { opacity: 0.6 },
  map: { width: '100%', height: 380, marginBottom: 8 },
  distance: { textAlign: 'center', color: theme.colors.accent, fontWeight: '700', marginBottom: 8 },
  distanceIdle: {
    textAlign: 'center',
    color: theme.colors.mutedDark,
    fontSize: 12,
    marginBottom: 8,
  },
  status: { color: theme.colors.white, textAlign: 'center', fontWeight: '700', marginBottom: 16 },
  stepper: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.input,
    marginBottom: 4,
  },
  stepDotOn: { backgroundColor: theme.colors.accent },
  stepLabel: { color: theme.colors.mutedDark, fontSize: 8, textAlign: 'center' },
  stepLabelOn: { color: theme.colors.accent },
  fundiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.lg,
    padding: 14,
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,184,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: theme.colors.white, fontWeight: '800' },
  name: { color: theme.colors.white, fontWeight: '800' },
  meta: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
  chatBtn: { paddingHorizontal: 16, height: 40, borderRadius: 20 },
  shareLink: { marginBottom: 12 },
  shareText: { color: theme.colors.muted, textAlign: 'center', fontSize: 13 },
  sosBtn: {
    borderWidth: 2,
    borderColor: theme.colors.red,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sosText: { color: theme.colors.red, fontWeight: '800' },
});
