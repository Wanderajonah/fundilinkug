import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import FundiMap from '../components/FundiMap';
import PrimaryButton from '../components/PrimaryButton';
import { useLocation } from '../../context/LocationContext';
import { useBookingOptional } from '../../context/BookingContext';
import { getRoutePreview } from '../../services/mapsApi';
import { initials } from '../utils/ratings';
import theme from '../theme';

const STEPS = ['Confirmed', 'Paid', 'On Way', 'Arrived', 'Done'];

export default function LiveTrackingScreen({ job = {}, onBack, onChat, onJobStarted }) {
  const insets = useSafeAreaInsets();
  const fundiName = job.fundiName || 'Fundi';
  const firstName = fundiName.split(' ')[0];
  const { coords, region } = useLocation();
  const bookingCtx = useBookingOptional();
  const [route, setRoute] = useState({ distanceKm: 1.8, etaMinutes: 8 });

  const fundiCoords = useMemo(() => {
    const live = bookingCtx?.fundiLocation || job.fundiLocation;
    if (live?.lat && live?.lng) {
      return { lat: live.lat, lng: live.lng, title: fundiName };
    }
    return { lat: -1.292066, lng: 36.821945, title: fundiName };
  }, [bookingCtx?.fundiLocation, job.fundiLocation, fundiName]);

  const statusMessage = useMemo(() => {
    const status = job.status?.toUpperCase?.() || job.status;
    if (status === 'ARRIVED') return `${firstName} has arrived at your location`;
    if (status === 'IN_PROGRESS') return `${firstName} is working on your job`;
    return `${firstName} is on the way to you`;
  }, [firstName, job.status]);

  useEffect(() => {
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
        /* keep defaults */
      }
    })();
  }, [fundiCoords.lat, fundiCoords.lng, coords.lat, coords.lng]);

  const activeStep =
    job.status === 'IN_PROGRESS' || job.status === 'in_progress'
      ? 4
      : job.status === 'ARRIVED'
        ? 3
        : 2;

  return (
    <ScreenWrapper style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.white} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Live Tracking</Text>
          <View style={styles.etaBadge}>
            <Text style={styles.etaText}>ETA {route.etaMinutes} mins</Text>
          </View>
        </View>

        <FundiMap
          style={styles.map}
          region={region}
          currentLocation={coords}
          destination={fundiCoords}
          fundis={
            job.fundiId
              ? [{ _id: job.fundiId, userId: { location: fundiCoords, name: fundiName } }]
              : []
          }
        />

        <Text style={styles.distance}>{route.distanceKm} km</Text>
        <Text style={styles.status}>{statusMessage}</Text>

        <View style={styles.stepper}>
          {STEPS.map((s, i) => (
            <View key={s} style={styles.stepItem}>
              <View style={[styles.stepDot, i <= activeStep && styles.stepDotOn]} />
              <Text style={[styles.stepLabel, i <= activeStep && styles.stepLabelOn]}>{s}</Text>
            </View>
          ))}
        </View>

        <View style={styles.fundiCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(fundiName)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{fundiName}</Text>
            <Text style={styles.meta}>{job.service || 'Service'} · Live location updating</Text>
          </View>
          <PrimaryButton style={styles.chatBtn} onPress={onChat}>
            Chat
          </PrimaryButton>
        </View>

        <PrimaryButton style={{ marginBottom: 12 }} onPress={onJobStarted}>
          Fundi arrived - job started
        </PrimaryButton>

        <TouchableOpacity style={styles.shareLink}>
          <Text style={styles.shareText}>Share trip with a contact for safety</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sosBtn}>
          <Text style={styles.sosText}>SOS Emergency</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  scrollContent: { paddingHorizontal: 20 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.input,
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
  map: { width: '100%', height: 280, borderRadius: theme.radius.lg, marginBottom: 8 },
  distance: { textAlign: 'center', color: theme.colors.accent, fontWeight: '700', marginBottom: 8 },
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
