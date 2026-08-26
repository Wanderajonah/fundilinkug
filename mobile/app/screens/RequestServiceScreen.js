import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../../context/LocationContext';
import {
  restoreAuthSession,
  hasApiAuthToken,
} from '../../services/authApi';
import { createBooking, uploadBookingImage, getErrorMessage } from '../../services/bookingsApi';
import { compressImage, resolveMediaUrl } from '../../utils/image';
import { normalizeCategory } from '../utils/bookings';
import theme from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import BookingSentAlert from '../components/BookingSentAlert';
import ScreenWrapper from '../components/ScreenWrapper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../i18n/LanguageContext';

const DATE_OPTIONS = ['Today', 'Tomorrow'];
const TIME_OPTIONS = ['ASAP', 'Morning', 'Afternoon', 'Evening'];

export default function RequestServiceScreen({
  artisan = {},
  authToken,
  onNavigate,
  onSessionRestored,
}) {
  const { address, coords } = useLocation();
  const { t } = useLanguage();
  // Bottom inset is handled here (not by ScreenWrapper) so the sticky footer
  // clears the Android/iOS system navigation bar.
  const insets = useSafeAreaInsets();
  const skillOptions = (artisan.skills?.length ? artisan.skills : [artisan.role || t('General Service')])
    .filter(Boolean);
  const [service, setService] = useState(skillOptions[0] || t('General Service'));
  const [date, setDate] = useState(DATE_OPTIONS[0]);
  const [time, setTime] = useState(TIME_OPTIONS[0]);
  const [location, setLocation] = useState(address || '');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [photos, setPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [sentAlertVisible, setSentAlertVisible] = useState(false);
  const [sentBooking, setSentBooking] = useState(null);

  useEffect(() => {
    if (address) setLocation(address);
  }, [address]);

  const handleBook = async () => {
    if (!desc.trim()) {
      setError(t('Please describe the issue or service needed.'));
      return;
    }
    if (!location.trim()) {
      setError(t('Please set your location before booking.'));
      return;
    }
    let canBook = Boolean(authToken || hasApiAuthToken());
    if (!canBook) {
      const session = await restoreAuthSession();
      if (session?.token) {
        onSessionRestored?.(session);
        canBook = true;
      }
    }

    if (!canBook) {
      Alert.alert(t('Sign in required'), t('Please sign in to book a fundi.'), [
        { text: t('Not now'), style: 'cancel' },
        { text: t('Sign In'), onPress: () => onNavigate?.('signIn') },
      ]);
      return;
    }

    setSubmitting(true);
    setError('');

    let imageUrls = [];
    if (photos.length > 0) {
      setUploadingPhotos(true);
      try {
        for (const uri of photos) {
          const compressed = await compressImage(uri);
          const formData = new FormData();
          const filename = compressed.split('/').pop() || 'photo.jpg';
          formData.append('image', { uri: compressed, type: 'image/jpeg', name: filename });
          const { data } = await uploadBookingImage(formData);
          if (data?.url) imageUrls.push(data.url);
        }
      } catch (uploadErr) {
        setUploadingPhotos(false);
        setSubmitting(false);
        setError(t('Failed to upload photos. Please try again.'));
        return;
      }
      setUploadingPhotos(false);
    }

    try {
      const category = normalizeCategory(service, artisan.skills || []);
      const { data } = await createBooking({
        category,
        description: desc.trim(),
        address: location.trim(),
        location: { lat: coords.lat, lng: coords.lng },
        estimatedDuration: 60,
        fundiId: artisan.id || artisan._id,
        images: imageUrls,
      });

      const booking = data.booking;
      setSentBooking({
        id: booking._id,
        _id: booking._id,
        status: booking.status,
        service: category,
        category,
        description: desc.trim(),
        address: location.trim(),
        location: booking.location,
        expiresAt: booking.expiresAt,
        date,
        time,
        artisanName: artisan.name,
      });
      setSentAlertVisible(true);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickPhoto = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('Permission needed'), t('Allow access to your photo library to add photos.'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 5 - photos.length,
    });
    if (result.canceled || !result.assets?.length) return;
    const newUris = result.assets.map((a) => a.uri).filter(Boolean);
    setPhotos((prev) => [...prev, ...newUris].slice(0, 5));
  }, [photos.length]);

  const ratingValue =
    typeof artisan.rating === 'number' && artisan.rating > 0
      ? artisan.rating.toFixed(1)
      : null;

  return (
    <ScreenWrapper style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => onNavigate?.('artisan')} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>{t('Request Service')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.headerCard}>
          {artisan.profilePhoto ? (
            <Image source={{ uri: resolveMediaUrl(artisan.profilePhoto) }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(artisan.name || 'U').slice(0, 2).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{artisan.name || t('Nearby Fundi')}</Text>
              {artisan.verified ? (
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.green} />
              ) : null}
            </View>
            <Text style={styles.role}>{service}</Text>
            <View style={styles.statRow}>
              {ratingValue ? (
                <View style={[styles.statChip, styles.statChipAccent]}>
                  <Ionicons name="star" size={11} color={theme.colors.accent} />
                  <Text style={styles.statTextAccent}>{ratingValue}</Text>
                </View>
              ) : null}
              {Number.isFinite(artisan.jobsCompleted) && artisan.jobsCompleted > 0 ? (
                <View style={styles.statChip}>
                  <Ionicons name="checkmark-done-outline" size={11} color={theme.colors.muted} />
                  <Text style={styles.statText}>
                    {t('{{count}} jobs done', { count: artisan.jobsCompleted })}
                  </Text>
                </View>
              ) : null}
              {artisan.experience > 0 ? (
                <View style={styles.statChip}>
                  <Text style={styles.statText}>
                    {t('{{years}}+ yrs', { years: artisan.experience })}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons name="build-outline" size={14} color={theme.colors.accent} />
            <Text style={styles.sectionTitle}>{t('WHAT DO YOU NEED?')}</Text>
          </View>
          <View style={styles.chipWrap}>
            {skillOptions.map((s) => {
              const on = s === service;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => setService(s)}
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{s}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons name="calendar-outline" size={14} color={theme.colors.accent} />
            <Text style={styles.sectionTitle}>{t('WHEN DO YOU NEED IT?')}</Text>
          </View>
          <View style={styles.chipWrap}>
            {DATE_OPTIONS.map((d) => {
              const on = d === date;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => setDate(d)}
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Ionicons
                    name={d === 'Today' ? 'today-outline' : 'sunny-outline'}
                    size={13}
                    color={on ? theme.colors.black : theme.colors.muted}
                  />
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{t(d)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={[styles.chipWrap, { marginTop: 8 }]}>
            {TIME_OPTIONS.map((tm) => {
              const on = tm === time;
              return (
                <TouchableOpacity
                  key={tm}
                  onPress={() => setTime(tm)}
                  style={[styles.chip, styles.chipSmall, on && styles.chipOn]}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{t(tm)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons name="location-outline" size={14} color={theme.colors.accent} />
            <Text style={styles.sectionTitle}>{t('WHERE IS THE JOB?')}</Text>
          </View>
          <TouchableOpacity style={styles.locationBox} onPress={() => onNavigate?.('setLocation')} activeOpacity={0.85}>
            <View style={styles.locationIconWrap}>
              <Ionicons name="location" size={16} color={theme.colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.locationText, !location && styles.placeholderText]} numberOfLines={1}>
                {location || t('Set your location')}
              </Text>
              <Text style={styles.locationHint}>
                {location ? t('Tap to change') : t('Pick on map or use current location')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.mutedDark} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons name="document-text-outline" size={14} color={theme.colors.accent} />
            <Text style={styles.sectionTitle}>{t('DESCRIBE THE JOB')}</Text>
          </View>
          <TextInput
            value={desc}
            onChangeText={setDesc}
            placeholder={t('e.g. Kitchen sink is leaking under the cabinet…')}
            placeholderTextColor={theme.colors.mutedDark}
            style={styles.textArea}
            multiline
          />

          <View style={styles.photoHeadRow}>
            <Text style={styles.photosLabel}>{t('Add photos')}</Text>
            <Text style={styles.photosCount}>{photos.length}/5</Text>
          </View>
          {photos.length > 0 ? (
            <View style={styles.photoRow}>
              {photos.map((uri, i) => (
                <View key={i} style={styles.photoThumbWrap}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  <TouchableOpacity
                    style={styles.photoRemove}
                    onPress={() => setPhotos(photos.filter((_, j) => j !== i))}
                  >
                    <Ionicons name="close-circle" size={20} color={theme.colors.red} />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 5 ? (
                <TouchableOpacity style={styles.photoAdd} onPress={handlePickPhoto}>
                  <Ionicons name="camera-outline" size={22} color={theme.colors.mutedDark} />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <TouchableOpacity style={styles.photoPickerBtn} onPress={handlePickPhoto} activeOpacity={0.85}>
              <View style={styles.photoPickerIconWrap}>
                <Ionicons name="camera-outline" size={18} color={theme.colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.photoPickerTitle}>{t('Show the fundi what needs fixing')}</Text>
                <Text style={styles.photoPickerSub}>{t('Photos help the fundi arrive prepared (optional)')}</Text>
              </View>
              <Ionicons name="add-circle-outline" size={20} color={theme.colors.mutedDark} />
            </TouchableOpacity>
          )}
          {uploadingPhotos ? (
            <View style={styles.uploadingRow}>
              <ActivityIndicator size="small" color={theme.colors.accent} />
              <Text style={styles.uploadingText}>{t('Uploading photos…')}</Text>
            </View>
          ) : null}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={theme.colors.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.trustStrip}>
          <Ionicons name="shield-checkmark" size={18} color={theme.colors.green} />
          <Text style={styles.trustText}>
            {t(
              'Your payment is held safely in escrow — the fundi is paid only when the job is done.'
            )}
          </Text>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footerBar,
          { paddingBottom: 12 + insets.bottom },
        ]}
      >
        <PrimaryButton
          onPress={handleBook}
          disabled={submitting || uploadingPhotos}
          loading={submitting}
          icon="hammer-outline"
          style={styles.mainBtn}
        >
          {submitting ? t('Sending request…') : t('Book Fundi')}
        </PrimaryButton>
      </View>

      <BookingSentAlert
        visible={sentAlertVisible}
        onAutoClose={() => {
          setSentAlertVisible(false);
          onNavigate?.('bookingWaiting', { booking: sentBooking });
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.black },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 20, paddingBottom: 130 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: { color: theme.colors.white, fontSize: 17, fontWeight: '800' },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.input,
    padding: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 6,
  },
  headerInfo: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: theme.colors.accent, fontWeight: '900', fontSize: 17 },
  name: { color: theme.colors.white, fontWeight: '900', fontSize: 16, flexShrink: 1 },
  role: { color: theme.colors.muted, fontSize: 13, marginTop: 2 },
  statRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  statChipAccent: { backgroundColor: theme.colors.accentDim },
  statText: { color: theme.colors.muted, fontSize: 11, fontWeight: '700' },
  statTextAccent: { color: theme.colors.accent, fontSize: 11, fontWeight: '800' },
  section: { marginTop: 18 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    color: theme.colors.muted,
    fontSize: theme.typography.caps,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipSmall: { paddingVertical: 7, paddingHorizontal: 12 },
  chipOn: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  chipText: { color: theme.colors.muted, fontSize: 13, fontWeight: '700' },
  chipTextOn: { color: theme.colors.black, fontWeight: '800' },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.input,
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  locationIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: theme.colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationText: { color: theme.colors.white, fontSize: 14, fontWeight: '700' },
  locationHint: { color: theme.colors.mutedDark, fontSize: 11, marginTop: 2 },
  placeholderText: { color: theme.colors.mutedDark, fontWeight: '500' },
  textArea: {
    minHeight: 96,
    backgroundColor: theme.colors.input,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.white,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  photoHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  photosLabel: { color: theme.colors.white, fontSize: 13, fontWeight: '700' },
  photosCount: { color: theme.colors.mutedDark, fontSize: 11, fontWeight: '700' },
  photoPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.input,
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  photoPickerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: theme.colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPickerTitle: { color: theme.colors.white, fontSize: 13, fontWeight: '700' },
  photoPickerSub: { color: theme.colors.mutedDark, fontSize: 11, marginTop: 2 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoThumbWrap: { position: 'relative' },
  photoThumb: { width: 64, height: 64, borderRadius: theme.radius.sm },
  photoRemove: { position: 'absolute', top: -6, right: -6 },
  photoAdd: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  uploadingText: { color: theme.colors.muted, fontSize: 13 },
  errorBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: { color: theme.colors.red, fontSize: 13, lineHeight: 18, flex: 1 },
  trustStrip: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.22)',
  },
  trustText: { color: theme.colors.muted, fontSize: 12, lineHeight: 17, flex: 1 },
  footerBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: theme.colors.black,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  mainBtn: { height: 54 },
});
