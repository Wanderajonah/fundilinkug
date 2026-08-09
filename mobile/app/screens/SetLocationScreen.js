import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import PrimaryButton from '../components/PrimaryButton';
import FundiMap from '../components/FundiMap';
import { useLocation } from '../../context/LocationContext';
import { geocodeAddress, getNearbyFundis } from '../../services/mapsApi';
import theme from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

const RADII = ['5 km', '10 km', '20 km'];

export default function SetLocationScreen({ onBack, onConfirm, authToken }) {
  const { coords, address, radiusKm, setRadiusKm, setManualLocation, region, saveToBackend, captureCurrentLocation } =
    useLocation();
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [nearbyCount, setNearbyCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNearby = async (lat, lng, radius) => {
    try {
      const { data } = await getNearbyFundis({ lat, lng, radiusKm: radius });
      setNearbyCount(data.count || data.fundis?.length || 0);
    } catch {
      setNearbyCount(0);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const { data } = await geocodeAddress(search.trim());
      await setManualLocation(data.lat, data.lng, data.formattedAddress);
      await loadNearby(data.lat, data.lng, radiusKm);
    } catch (e) {
      Alert.alert(t('Search failed'), e?.response?.data?.message || t('Address not found'));
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = async ({ lat, lng }) => {
    await setManualLocation(lat, lng);
    await loadNearby(lat, lng, radiusKm);
  };

  const handleUseCurrent = async () => {
    setLoading(true);
    try {
      const pos = await captureCurrentLocation();
      await loadNearby(pos.lat, pos.lng, radiusKm);
    } catch (e) {
      Alert.alert(t('Could not get location'), e?.message || t('Enable device location'));
    } finally {
      setLoading(false);
    }
  };

  const pickRadius = async (label) => {
    const km = Number(label.replace(' km', ''));
    setRadiusKm(km);
    await loadNearby(coords.lat, coords.lng, km);
  };

  return (
    <ScreenWrapper style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.black} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Set Your Location')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={theme.colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('Search address or area...')}
          placeholderTextColor={theme.colors.mutedDark}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity onPress={handleSearch}>
          <Text style={styles.gps}>{t('GO')}</Text>
        </TouchableOpacity>
      </View>

      <FundiMap
        style={styles.map}
        region={region}
        currentLocation={coords}
        showRadiusCircle
        radiusKm={radiusKm}
        onPressCoordinate={handleMapPress}
      />

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{t('{{count}} Fundis Nearby', { count: nearbyCount })}</Text>
      </View>

      <Text style={styles.section}>{t('SELECTED LOCATION')}</Text>
      <View style={styles.addressCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.addressTitle}>{address}</Text>
          <Text style={styles.addressSub}>
            {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </Text>
        </View>
        <Ionicons name="pencil" size={18} color={theme.colors.accent} />
      </View>

      <Text style={styles.section}>{t('SEARCH RADIUS')}</Text>
      <View style={styles.radiusRow}>
        {RADII.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.radiusChip, `${radiusKm} km` === r && styles.radiusChipOn]}
            onPress={() => pickRadius(r)}
          >
            <Text style={[styles.radiusText, `${radiusKm} km` === r && styles.radiusTextOn]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator color={theme.colors.accent} /> : null}
      <PrimaryButton
        onPress={async () => {
          await saveToBackend();
          onConfirm?.({ radiusKm });
        }}
      >
        {t('Confirm This Location')}
      </PrimaryButton>
      <PrimaryButton filled={false} onPress={handleUseCurrent} style={{ marginTop: 12 }}>
        {t('Use current location')}
      </PrimaryButton>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.black, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: theme.colors.white, fontSize: 18, fontWeight: '800' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.input,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: { flex: 1, color: theme.colors.white, fontSize: 14 },
  gps: { color: theme.colors.accent, fontWeight: '800', fontSize: 12 },
  scroll: { paddingBottom: 28 },
  map: { width: '100%', height: 180, borderRadius: theme.radius.lg },
  badge: {
    alignSelf: 'flex-end',
    marginTop: -36,
    marginBottom: 12,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    zIndex: 2,
  },
  badgeText: { color: theme.colors.textDark, fontWeight: '800', fontSize: 11 },
  section: {
    color: theme.colors.muted,
    fontSize: theme.typography.caps,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.input,
    padding: 14,
    borderRadius: theme.radius.md,
    marginBottom: 16,
  },
  addressTitle: { color: theme.colors.white, fontWeight: '800', fontSize: 15 },
  addressSub: { color: theme.colors.muted, fontSize: 12, marginTop: 4 },
  radiusRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  radiusChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.input,
  },
  radiusChipOn: { backgroundColor: theme.colors.accent },
  radiusText: { color: theme.colors.muted, fontWeight: '700' },
  radiusTextOn: { color: theme.colors.textDark },
});
